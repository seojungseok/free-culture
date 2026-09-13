import {randomUUID} from 'node:crypto';
import {redis} from './redis.mjs';
// One durable, non-evicting primary. No TTL: a paused caller cannot overlap a replacement.
export const ACQUIRE=`
local raw=redis.call('GET',KEYS[1]); if not raw then return {-1,0} end
local s=cjson.decode(raw); local t=redis.call('TIME'); local now=t[1]*1000+math.floor(t[2]/1000)
if s.lock then return {0,1000} end
if now < s.nextAt then return {0,s.nextAt-now} end
local events={};local count=0
for _,e in ipairs(s.events) do if e.at>now-s.window then table.insert(events,e);count=count+e.count end end
local n=tonumber(ARGV[2]); if n<1 or n>math.min(10,s.cap) then return {-2,0} end
if count+n>math.min(10,s.cap) then return {0,events[1].at+s.window-now+1} end
s.events=events;table.insert(s.events,{id=ARGV[1],at=now,count=n});s.lock=ARGV[1];s.lastAt=now
redis.call('SET',KEYS[1],cjson.encode(s));return {1,0}`;
export const RELEASE=`
local raw=redis.call('GET',KEYS[1]);if not raw then return -1 end
local s=cjson.decode(raw);if s.lock~=ARGV[1] then return -1 end
local t=redis.call('TIME');local now=t[1]*1000+math.floor(t[2]/1000)
for _,e in ipairs(s.events) do if e.id==ARGV[1] then e.at=now end end
s.nextAt=now+math.max(6100,s.interval,tonumber(ARGV[2]));s.lock=nil
redis.call('SET',KEYS[1],cjson.encode(s));return 1`;
export function stateKey(){const account=process.env.COUPANG_ACCOUNT_SCOPE;if(!account||!/^[a-zA-Z0-9_-]{3,80}$/.test(account))throw Error('공유 계정 식별자 미설정: 조회 대기');return `coupang:{${account}}:budget:v1`;}
export function retryDelay(value,now=Date.now()){if(!value)return 60000;const seconds=Number(value);return Math.max(60000,Number.isFinite(seconds)?seconds*1000:Date.parse(value)-now||60000);}
export async function limitedRequest(run,{count=1,command=redis,key=stateKey(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),maxWait=Infinity}={}){
 if(!Number.isInteger(count)||count<1||count>10)throw Error('조회량은 1~10개만 허용 (직전 60초 최대 10개)');
 const token=randomUUID();let waited=0;
 while(true){const answer=await command(['EVAL',ACQUIRE,1,key,token,count]);if(!Array.isArray(answer)||answer[0]<0)throw Error('중앙 제한 상태 미확인: 조회 대기');if(answer[0]===1)break;const delay=Math.max(100,Number(answer[1])||1000);if(waited+delay>maxWait)throw Error('중앙 대기열 혼잡 또는 작업 복구 대기');await sleep(delay);waited+=delay;}
 // Ambiguous network failures keep the lock until the original process is stopped and recovered.
 const response=await run();
 const cooldown=response.status===429?retryDelay(response.headers.get('retry-after')):0;
 const released=await command(['EVAL',RELEASE,1,key,token,cooldown]);if(released!==1)throw Error('중앙 제한 기록 실패: 후속 호출 보류');
 return response;
}
