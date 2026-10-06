import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const base='https://sharelink.toss.im/openapi';
export class SharelinkError extends Error {
  constructor(status,code,retryAfter=0){super(`Sharelink ${status} ${code}`);this.status=status;this.code=code;this.retryAfter=retryAfter;}
}
export function unwrap(response,body){
  if(!response.ok||body?.resultType!=='SUCCESS')throw new SharelinkError(response.status,String(body?.error?.errorCode||'REQUEST_FAILED').replace(/[^A-Z0-9_]/gi,'').slice(0,80),response.headers.get('Retry-After')||0);
  return body.success;
}
export async function withClient(work,{fetchImpl=fetch,stateDir=process.env.TOSS_SHARELINK_STATE_DIR||'.cache/sharelink'}={}){
  fs.mkdirSync(stateDir,{recursive:true,mode:0o700});
  const lock=path.join(stateDir,'operation.lock');
  let fd;try{fd=fs.openSync(lock,'wx',0o600);}catch{throw new Error('Sharelink operation already running; inspect before manual recovery');}
  fs.writeFileSync(fd,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
  try{
    const access=process.env.TOSS_SHARELINK_ACCESS_KEY,secret=process.env.TOSS_SHARELINK_SECRET_KEY;
    if(!access||!secret)throw new Error('Missing private Sharelink credentials');
    const fingerprint=crypto.createHash('sha256').update(access+secret).digest('hex');
    const tokenPath=path.join(stateDir,'token.json');
    let token;try{token=JSON.parse(fs.readFileSync(tokenPath,'utf8'));}catch{}
    if(!token||token.fingerprint!==fingerprint||token.expiresAt<Date.now()+300000){
      const response=await fetchImpl('https://oauth2.cert.toss.im/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:access,client_secret:secret,scope:'sharelink:read sharelink:write'}),signal:AbortSignal.timeout(30000)});
      const body=await response.json();
      if(!response.ok||!body.access_token||!Number.isFinite(Number(body.expires_in)))throw new SharelinkError(response.status,'TOKEN_FAILED');
      token={accessToken:body.access_token,expiresAt:Date.now()+Number(body.expires_in)*1000,fingerprint};
      fs.writeFileSync(tokenPath,JSON.stringify(token),{mode:0o600});
    }
    const cooldownPath=path.join(stateDir,'cooldown.json');
    let lastRequest=0;
    const request=async(endpoint,{method='GET',body}={})=>{
      if(!endpoint.startsWith('/')||endpoint.startsWith('//')||endpoint.includes('://'))throw new Error('Invalid Sharelink endpoint');
      let cooldown;try{cooldown=JSON.parse(fs.readFileSync(cooldownPath,'utf8'));}catch{}
      if(cooldown?.until>Date.now())throw new Error('Sharelink cooldown active');
      const delay=1100-(Date.now()-lastRequest);if(delay>0)await new Promise(r=>setTimeout(r,delay));
      lastRequest=Date.now();
      const response=await fetchImpl(base+endpoint,{method,headers:{Authorization:`Bearer ${token.accessToken}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
      const data=await response.json();
      if(response.status===429){const raw=response.headers.get('Retry-After');const seconds=Number(raw);const until=Number.isFinite(seconds)&&seconds>0?Date.now()+seconds*1000:Math.max(Date.now()+60000,Date.parse(raw)||0);fs.writeFileSync(cooldownPath,JSON.stringify({until}),{mode:0o600});}
      if(data?.error?.errorCode==='SHARELINK_OPENAPI_QUOTA_EXCEEDED'){const d=new Date(Date.now()+9*3600000);d.setUTCHours(24,0,0,0);fs.writeFileSync(cooldownPath,JSON.stringify({until:d.getTime()-9*3600000}),{mode:0o600});}
      return unwrap(response,data);
    };
    return await work({request});
  }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
