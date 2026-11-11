// Download only previously returned product images; this never calls the product API.
import fs from 'node:fs';
import sharp from 'sharp';
const files=process.argv.slice(2);
if(!files.length)throw Error('Explicit candidate files required');
fs.mkdirSync('.cache/catalog-photos',{recursive:true});fs.mkdirSync('public/prep-products',{recursive:true});
let images=0;
function allowed(url){return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&(url.hostname==='ads-partners.coupang.com'||url.hostname.endsWith('.coupangcdn.com'));}
async function photoResponse(initial){let url=initial;for(let hop=0;hop<4;hop++){if(!allowed(url))throw Error('Unapproved image redirect');const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'manual'});if(![301,302,303,307,308].includes(response.status))return response;const location=response.headers.get('location');if(!location)throw Error('Missing image redirect');url=new URL(location,url);}throw Error('Too many image redirects');}
for(const file of files){
 const data=JSON.parse(fs.readFileSync(file,'utf8')),items=Array.isArray(data)?data:data.candidates;
 for(const item of items){
  const url=new URL(item.image);
  if(!allowed(url))throw Error('Unapproved product image source');
  const key=String(item.key),id=Number(item.productId);if(!/^[a-z0-9-]+$/.test(key)||!Number.isSafeInteger(id)||id<1)throw Error('Invalid image identifier');
  const local='/prep-products/'+id+'.webp',source='.cache/catalog-photos/'+key+'-'+id+'.source';
  if(!fs.existsSync(source)){
   const response=await photoResponse(url);if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('Product photo download failed for '+key);
   const body=Buffer.from(await response.arrayBuffer());if(body.length>8*1024*1024)throw Error('Photo too large');fs.writeFileSync(source,body);
  }
  await sharp(source).rotate().resize(320,320,{fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile('public'+local);
  item.localImage=local;images++;
 }
 fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
}
console.log(JSON.stringify({productPhotos:images,productApiRequests:0}));
