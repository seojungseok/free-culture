import fs from 'node:fs';
import sharp from 'sharp';
const extra=JSON.parse(fs.readFileSync('data/winter-api-extra.json'));
const ids=['126081','2611140','2760707','2675068','126730','1919548','129784'];
fs.mkdirSync('.cache/winter-review/alternatives',{recursive:true});
for(const id of ids){
 const rows=extra.images[id].images,layers=[];
 for(let i=0;i<rows.length;i++){
  const p=rows[i],file=`.cache/winter-review/alternatives/${id}-${i}.jpg`;
  try{
   if(!fs.existsSync(file)){const r=await fetch((p.smallimageurl||p.originimgurl).replace(/^http:/,'https:'),{signal:AbortSignal.timeout(15000)});if(!r.ok)continue;await sharp(Buffer.from(await r.arrayBuffer())).resize(240,150,{fit:'contain',background:'white'}).jpeg().toFile(file);}
   const x=i%5*240,y=Math.floor(i/5)*180;
   layers.push({input:file,left:x,top:y},{input:Buffer.from(`<svg width="240" height="30"><rect width="240" height="30" fill="white"/><text x="10" y="22" font-size="18">${id} - ${i}</text></svg>`),left:x,top:y+150});
  }catch{}
 }
 await sharp({create:{width:1200,height:Math.ceil(rows.length/5)*180,channels:3,background:'white'}}).composite(layers).jpeg({quality:86}).toFile(`.cache/winter-review/alternatives-${id}.jpg`);
 console.log(id,'candidates',layers.length/2);
}
