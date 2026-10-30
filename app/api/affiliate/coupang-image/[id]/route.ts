import fs from 'node:fs';
import path from 'node:path';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!/^\d{1,20}$/.test(id))return new Response(null,{status:404});
  const runtime=process.env.COUPANG_FOOD_IMAGE_DIR;
  const files=[...(runtime?[path.join(runtime,`${id}.webp`)]:[]),path.join(process.cwd(),'public/affiliate-food',`${id}.webp`),path.join(process.cwd(),'public/affiliate-images',`coupang-food-${id}.webp`)];
  for(const file of files){
    try {
      const buffer=fs.readFileSync(file);if(buffer.length>5*1024*1024)continue;
      const type=buffer[0]===0xff&&buffer[1]===0xd8?'image/jpeg':buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'?'image/webp':null;
      if(type)return new Response(new Uint8Array(buffer),{headers:{'Content-Type':type,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
    }catch{}
  }
  return new Response(null,{status:404});
}
