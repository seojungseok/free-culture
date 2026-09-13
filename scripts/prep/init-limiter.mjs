import {redis} from './redis.mjs';
import {stateKey} from './limiter.mjs';
if(process.env.COUPANG_CENTRAL_CLIENTS_READY!=='1')throw Error('모든 동일 계정 클라이언트의 중앙 경유와 이전 프로세스 종료를 먼저 확인하세요.');
const state={cap:Math.min(9,Math.max(1,Math.floor(Number(process.env.COUPANG_WINDOW_CAP)||9))),window:Math.max(60000,Number(process.env.COUPANG_WINDOW_MS)||60000),interval:Math.max(6100,Number(process.env.COUPANG_MIN_INTERVAL_MS)||6100),nextAt:0,events:[]};
const init=`if redis.call('EXISTS',KEYS[1])==1 then return 0 end;local s=cjson.decode(ARGV[1]);local t=redis.call('TIME');s.nextAt=t[1]*1000+math.floor(t[2]/1000)+s.window;redis.call('SET',KEYS[1],cjson.encode(s));return 1`;
console.log(await redis(['EVAL',init,1,stateKey(),JSON.stringify(state)])===1?'중앙 제한기 초기화 완료. 첫 조회는 이전 창 종료 후 허용.':'기존 중앙 제한기 유지');
