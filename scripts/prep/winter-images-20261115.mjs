import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const qa='output/winter-camping-15-20261115';
const files=(await fs.readdir(qa+'/image-records')).filter(file=>file.endsWith('.json'));
const records=await Promise.all(files.map(async file=>JSON.parse(await fs.readFile(qa+'/image-records/'+file,'utf8'))));
records.sort((a,b)=>a.id-b.id);
if(records.length!==45||new Set(records.map(record=>record.id)).size!==45)throw Error('Exactly 45 unique image records required');
await fs.mkdir('public/prep-images',{recursive:true});
let bytes=0;
for(const record of records){
 const base=record.slug+'-'+record.kind+'-20261115';
 record.url='/prep-images/'+base+'.webp';
 record.variants=[];
 for(const width of [1200,640,320]){
  const name=base+(width===1200?'':'-w'+width)+'.webp';
  const target=path.join('public/prep-images',name);
  await sharp(record.source).rotate().resize(width,Math.round(width*2/3),{fit:'cover'}).webp({quality:width===1200?83:80}).toFile(target);
  const data=await fs.readFile(target);bytes+=data.length;
  record.variants.push({url:'/prep-images/'+name,width,height:Math.round(width*2/3),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
 }
}
for(const kind of ['cover','prep','step']){
 const selected=records.filter(record=>record.kind===kind),tiles=[];
 for(let index=0;index<selected.length;index++){
  const record=selected[index];
  const image=await sharp('public'+record.url).resize(360,240).toBuffer();
  const label=Buffer.from('<svg width="360" height="30"><rect width="360" height="30" fill="#fff"/><text x="8" y="21" font-family="Arial" font-size="14">'+String(Math.floor(record.id/3)+1).padStart(2,'0')+' '+kind+' '+record.slug.replace('winter-camping-','')+'</text></svg>');
  tiles.push({input:image,left:(index%3)*360,top:Math.floor(index/3)*270},{input:label,left:(index%3)*360,top:Math.floor(index/3)*270+240});
 }
 await sharp({create:{width:1080,height:1350,channels:3,background:'#fff'}}).composite(tiles).jpeg({quality:91}).toFile(qa+'/'+kind+'-review.jpg');
}
await fs.writeFile('data/winter-camping-images-20261115.json',JSON.stringify({version:1,generatedWith:'built-in image_gen',style:'Light oak, ivory ceramics, forest green HTML title band, natural daylight and subtle winter woodland. No generated lettering or branding.',purpose:'Recipe scenes, not exact commercial product reproductions; no productMatchReviewed approval is asserted.',images:records},null,2)+'\n');
console.log(JSON.stringify({originalScenes:records.length,webpAssets:records.length*3,totalBytes:bytes}));
