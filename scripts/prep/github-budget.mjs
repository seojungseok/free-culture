import {randomUUID} from 'node:crypto';
import {retryDelay} from './limiter.mjs';
export const QUEUE_REPO='seojungseok/free-culture';
export const QUEUE_BRANCH='codex/coupang-shared-state';
const file='coupang-state.json';
// Fixed account-wide address: never select a fallback/local budget on errors.
export async function githubRequest(path,{method='GET',body,fetcher=fetch}={}){
 const token=process.env.COUPANG_QUEUE_GITHUB_TOKEN||process.env.GITHUB_TOKEN;
 if(!token)throw Error('GitHub 공용 제한기 인증 미설정: 상품 조회 대기');
 const r=await fetcher(`https://api.github.com/repos/${QUEUE_REPO}/${path}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','Cache-Control':'no-cache'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000),redirect:'error',cache:'no-store'});
 const now=Date.parse(r.headers.get('date'));
 if(!Number.isFinite(now))throw Error('공용 서버 시각 미확인: 상품 조회 대기');
 return {r,now};
}
export function validateBudget(s){
 if(!s||s.version!==1||!s.revision||!Number.isInteger(s.cap)||s.cap<1||!Number.isFinite(s.window)||s.window<60000||!Number.isFinite(s.interval)||s.interval<6100||!Number.isFinite(s.nextAt)||!Array.isArray(s.events)||!s.cache||typeof s.cache!=='object'||Array.isArray(s.cache)||s.events.some(e=>!e.id||!Number.isFinite(e.at)||!Number.isInteger(e.count)||e.count<1)||(s.lock!==null&&typeof s.lock!=='string'))throw Error('공용 제한 기록 형식 오류: 상품 조회 대기');
 return s;
}
export const githubBackend={
 async read(){const {r,now}=await githubRequest(`contents/${file}?ref=${encodeURIComponent(QUEUE_BRANCH)}&nonce=${randomUUID()}`);if(!r.ok)throw Error(`공용 제한 기록 조회 실패 (${r.status}): 상품 조회 대기`);const d=await r.json();if(!d.sha||d.encoding!=='base64'||!d.content)throw Error('공용 제한 기록 없음: 상품 조회 대기');return {state:validateBudget(JSON.parse(Buffer.from(d.content,'base64').toString('utf8'))),sha:d.sha,now};},
 async write(snapshot,state){const next={...state,revision:randomUUID()};const {r}=await githubRequest(`contents/${file}`,{method:'PUT',body:{message:'Update shared Coupang request budget [skip ci]',branch:QUEUE_BRANCH,sha:snapshot.sha,content:Buffer.from(JSON.stringify(next)).toString('base64')}});if(r.status===409||r.status===422)return false;if(!r.ok)throw Error(`공용 제한 기록 저장 실패 (${r.status}): 상품 조회 대기`);return true;}
};
export async function sharedProductRequest(cacheKey,run,{backend=githubBackend,sleep=ms=>new Promise(r=>setTimeout(r,ms)),count=1,maxWait=120000,ttl=3600000}={}){
 if(!Number.isInteger(count)||count<1||count>10)throw Error('직전 60초 최대 10회·10개');
 const owner=randomUUID();let waited=0;
 while(true){
  const snap=await backend.read();const s=validateBudget(snap.state),now=snap.now;
  if(!Number.isFinite(now))throw Error('공용 서버 시각 미확인');
  const cached=s.cache[cacheKey];if(cached&&cached.until>now&&typeof cached.body==='string')return new Response(cached.body,{headers:{'Content-Type':'application/json','X-Prep-Cache':'hit'}});
  const events=s.events.filter(e=>e.at>now-Math.max(60000,s.window));const total=events.reduce((sum,e)=>sum+e.count,0);
  let delay=s.lock?2000:Math.max(0,s.nextAt-now);
  if(count>Math.min(10,s.cap))throw Error('더 엄격한 계정 한도를 초과한 요청');
  if(total+count>Math.min(10,s.cap))delay=Math.max(delay,Math.min(...events.map(e=>e.at))+s.window-now+2000);
  if(delay>0){if(waited+delay>maxWait)throw Error('공용 잠금 복구 또는 호출 순서 대기');await sleep(Math.min(delay,30000));waited+=Math.min(delay,30000);continue;}
  const acquired={...s,events:[...events,{id:owner,at:now+2000,count}],lock:owner};
  if(!await backend.write(snap,acquired)){await sleep(1000);waited+=1000;if(waited>maxWait)throw Error('공용 제한 기록 경쟁: 대기');continue;}
  // Never run before the durable CAS succeeds. Unknown network outcomes retain the lock.
  const response=await run();const body=await response.clone().text();
  const done=await backend.read();if(done.state.lock!==owner)throw Error('공용 요청 소유권 불일치: 후속 조회 금지');
  const end=done.now+2000;
  const cooldown=response.status===429?retryDelay(response.headers.get('retry-after'),done.now):0;
  const cache=Object.fromEntries(Object.entries(done.state.cache).filter(([,v])=>v.until>done.now).slice(-127));
  if(response.ok&&Buffer.byteLength(body)<20000)cache[cacheKey]={until:end+Math.min(86400000,Math.max(1,ttl)),body};
  const released={...done.state,lock:null,nextAt:end+Math.max(6100,done.state.interval,cooldown),events:done.state.events.map(e=>e.id===owner?{...e,at:end}:e),cache};
  if(!await backend.write(done,released))throw Error('공용 요청 완료 기록 충돌: 후속 조회 대기');
  if(response.status===429)throw Error('쿠팡 429: 공용 대기시간 적용, 자동 재시도 없음');
  return response;
 }
}
