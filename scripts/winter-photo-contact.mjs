import fs from 'node:fs';
import sharp from 'sharp';
fs.mkdirSync('.cache/winter-review',{recursive:true});
const places=JSON.parse(fs.readFileSync('data/winter-daytrip-places.json')).flatMap(p=>p.stops);
for(let k=0;k<3;k++){
 const layers=[];
 for(let j=0;j<20;j++){
  const p=places[k*20+j],x=j%4*300,y=Math.floor(j/4)*220;
  layers.push({input:await sharp('public'+p.photo.src).resize(300,190,{fit:'contain',background:'#fff'}).toBuffer(),left:x,top:y});
  layers.push({input:Buffer.from(`<svg width="300" height="30"><rect width="300" height="30" fill="white"/><text x="10" y="21" font-size="18">${k*20+j+1} : ${p.id}</text></svg>`),left:x,top:y+190});
 }
 await sharp({create:{width:1200,height:1100,channels:3,background:'#fff'}}).composite(layers).jpeg({quality:88}).toFile(`.cache/winter-review/sheet-${k}.jpg`);
}
