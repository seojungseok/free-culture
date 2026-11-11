import {createVisitorCounter} from '@/lib/visitor-count.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const counter=createVisitorCounter();
const headers={'Cache-Control':'no-store'};
export async function GET(){
 try{return Response.json(await counter.get(),{headers});}
 catch{return Response.json({error:'방문자 집계 확인 중'},{status:503,headers});}
}
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(origin!=='https://mwohaji.kr'&&origin!=='https://www.mwohaji.kr')return new Response(null,{status:403,headers});
 try{return Response.json(await counter.hit(),{headers});}
 catch{return Response.json({error:'방문자 집계 확인 중'},{status:503,headers});}
}
