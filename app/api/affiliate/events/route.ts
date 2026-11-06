import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {normalizeAffiliateEvent} from '@/lib/affiliate-events.mjs';
export const runtime='nodejs';
const buckets=new Map<string,{at:number;count:number}>(),salt=randomBytes(16).toString('hex');
export async function POST(req:Request){
 const origin=req.headers.get('origin');
 if(!origin||origin!==new URL(req.url).origin&&origin!=='https://mwohaji.kr'&&origin!=='https://www.mwohaji.kr')return new Response(null,{status:403});
 if(Number(req.headers.get('content-length')||0)>2048)return new Response(null,{status:413});
 const now=Date.now(),key=createHash('sha256').update(salt+(req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')||'local')).digest('hex');
 for(const [id,b] of buckets)if(now-b.at>60000)buckets.delete(id);
 if(buckets.size>10000)return new Response(null,{status:429});
 const b=buckets.get(key)||{at:now,count:0};b.count++;buckets.set(key,b);if(b.count>60)return new Response(null,{status:429});
 const raw=await req.text();if(raw.length>2048)return new Response(null,{status:413});
 let input;try{input=JSON.parse(raw);}catch{return new Response(null,{status:400});}
 const v=normalizeAffiliateEvent(input);if(!v)return new Response(null,{status:400});
 try{
  const dir=process.env.AFFILIATE_EVENTS_DIR||path.join(process.cwd(),'.cache/affiliate-events');fs.mkdirSync(dir,{recursive:true});
  const day=new Date().toISOString().slice(0,10),file=path.join(dir,day+'.jsonl');
  if(fs.existsSync(file)&&fs.statSync(file).size>8*1024*1024)return new Response(null,{status:429});
  fs.appendFileSync(file,JSON.stringify({at:new Date(now).toISOString(),event:v.event,provider:v.provider,placement:v.placement,page:v.page,...(Number.isInteger(v.productId)&&v.productId>0?{productId:v.productId}: {})})+'\n',{mode:0o600});
  return new Response(null,{status:204});
 }catch{return new Response(null,{status:503});}
}
