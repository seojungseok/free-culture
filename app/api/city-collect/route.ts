import { createHash, timingSafeEqual } from "node:crypto";
import https from "node:https";
import { XMLParser } from "fast-xml-parser";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const expires = 1788800462969;
const expected = Buffer.from("f5b480ffea8dae58e7637c972a6467baabdb43598d32ac2804e33d6a1bbc689d", "hex");
const reply = (body: unknown, status = 200) => Response.json(body, {status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
export async function GET(){return reply({},404);}
export async function POST(req: Request) {
  if(Date.now()>expires || process.env.VERCEL_ENV!=="production" || !timingSafeEqual(createHash("sha256").update(req.headers.get("authorization")||"").digest(),expected))return reply({},404);
  const key=process.env.KCISA_API_KEY?.trim();
  if(!key)return reply({error:"missing_secret"},503);
  let phase="dns";
  try {
    const input=await req.json();
    const page=Number(input.page||1),rows=Number(input.rows||1);
    if(!Number.isInteger(page)||page<1||page>1000||!Number.isInteger(rows)||rows<1||rows>1000)return reply({},400);
    const dns=await fetch("https://cloudflare-dns.com/dns-query?name=api.kcisa.kr&type=A",{headers:{accept:"application/dns-json"},signal:AbortSignal.timeout(5000)}).then(r=>r.json());
    const address=dns.Answer?.find((a: {type:number;data:string})=>a.type===1)?.data;
    if(!address)return reply({error:"dns_failed"},502);
    const q=new URLSearchParams({serviceKey:key,numOfRows:String(rows),pageNo:String(page),areaNm:String(input.area||"").slice(0,20),clNm:String(input.category||"").slice(0,20)});
    phase="https";
    const result=await new Promise<{status:number;raw:string}>((resolve,reject)=>{
      const request=https.request({hostname:"api.kcisa.kr",servername:"api.kcisa.kr",path:"/openapi/API_CNV_063/request?"+q,method:"GET",family:4,lookup:(_host,_options,cb)=>cb(null,address,4),timeout:20000},response=>{
        let raw="";response.setEncoding("utf8");response.on("data",chunk=>{raw+=chunk;if(raw.length>3000000)request.destroy(new Error("response_too_large"));});response.on("end",()=>resolve({status:response.statusCode||0,raw}));
      });
      request.on("error",reject);request.on("timeout",()=>request.destroy(new Error("timeout")));request.end();
    });
    phase="parse";
    let parsed;try{parsed=JSON.parse(result.raw);}catch{parsed=new XMLParser({ignoreAttributes:true,parseTagValue:false}).parse(result.raw);}
    // Redact defensively before returning provider data; never expose request URLs/errors.
    const clean=JSON.parse(JSON.stringify(parsed).split(key).join("[redacted]"));
    return reply({httpStatus:result.status,data:clean});
  }catch(error){const code=(error as {code?:string}).code;return reply({error:"collection_failed",phase,region:process.env.VERCEL_REGION,code:code&&/^[A-Z0-9_]+$/.test(code)?code:null},502);}
}
