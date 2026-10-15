import fs from 'node:fs';
import path from 'node:path';
export const dynamic='force-dynamic';
export function GET(){
 let commit:string|null=null;
 try{const data=JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/site-release.json'),'utf8'));if(/^[0-9a-f]{40}$/.test(data.commit))commit=data.commit;}catch{}
 return Response.json({ready:true,commit},{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
}
