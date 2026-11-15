import {randomUUID} from 'node:crypto';
import {createFileVisitorCounter,validVisitorId} from '@/lib/visitor-counter-store.mjs';
import baseline from '@/data/visitor-counter-baseline.json';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const counter=createFileVisitorCounter({directory:process.env.VISITOR_COUNTER_DIR,baseline});
const headers={'Cache-Control':'no-store','X-Visitor-Store':'persistent-v1'};
const startedAt=Date.now();let lastRecovery=0;
function recoverLegacy(){
 if(process.env.VISITOR_COUNTER_RECOVER_LEGACY!=='1'||Date.now()-startedAt<60000||Date.now()-lastRecovery<300000)return;
 lastRecovery=Date.now();void counter.reconcileLegacy().catch(()=>{});
}
export async function GET(){
 try{const value=counter.get();recoverLegacy();return Response.json(value,{headers});}
 catch{return Response.json({error:'방문자 집계 확인 중'},{status:503,headers});}
}
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(origin!=='https://mwohaji.kr'&&origin!=='https://www.mwohaji.kr')return new Response(null,{status:403,headers});
 if(Number(request.headers.get('content-length')||0)>256)return new Response(null,{status:413,headers});
 let visitId;
 try{const raw=await request.text();if(raw.length>256)return new Response(null,{status:413,headers});visitId=raw?JSON.parse(raw)?.visitId:randomUUID();}catch{return new Response(null,{status:400,headers});}
 if(!validVisitorId(visitId))return new Response(null,{status:400,headers});
 try{const value=counter.hit(visitId);recoverLegacy();return Response.json(value,{headers});}
 catch{return Response.json({error:'방문자 집계 확인 중'},{status:503,headers});}
}
