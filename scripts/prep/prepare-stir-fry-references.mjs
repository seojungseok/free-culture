import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const report=JSON.parse(fs.readFileSync('data/weekend-prep-stir-fry-research.json','utf8'));
const existing=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8')).products;
const selected=['7265684367','7404695153','8987385839','8960028100','6854193615','6645728981','344228023','9169365991','9262718994','8042525293','7032698357','68121544','9587833030','8243714135'];
const candidates=[...report.records.map(r=>r.candidate).filter(Boolean),...existing];
const products=selected.map(id=>candidates.find(p=>p.id===id));
if(products.some(p=>!p))throw Error('선택 상품 참고 사진 누락');
const dir='.cache/prep-stir-fry-products';fs.mkdirSync(dir,{recursive:true});
const tiles=[];
for(const p of products){
 const response=await fetch(p.image,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`상품 사진 ${p.id}: HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());const file=path.join(dir,`${p.id}.jpg`);fs.writeFileSync(file,bytes);
 const tile=await sharp(bytes).resize(300,240,{fit:'contain',background:'#ffffff'}).extend({bottom:56,background:'#ffffff'}).composite([{input:Buffer.from(`<svg width="300" height="56"><rect width="300" height="56" fill="white"/><text x="12" y="22" font-family="Arial" font-size="17" font-weight="700" fill="#172c3c">${p.id}</text><text x="12" y="45" font-family="Arial" font-size="13" fill="#52625b">${p.name.replace(/[&<>]/g,'').slice(0,34)}</text></svg>`),top:240,left:0}]).jpeg({quality:86}).toBuffer();
 tiles.push({input:tile});
}
const width=1200,cols=4,rows=Math.ceil(tiles.length/cols);const input=tiles.map((tile,i)=>({...tile,left:(i%cols)*300,top:Math.floor(i/cols)*296}));
await sharp({create:{width,height:rows*296,channels:3,background:'#eef2ed'}}).composite(input).jpeg({quality:88}).toFile(path.join(dir,'contact-sheet.jpg'));
console.log(JSON.stringify({downloaded:products.length,dir,contactSheet:path.join(dir,'contact-sheet.jpg'),products:products.map(p=>({id:p.id,name:p.name,image:p.image}))},null,2));
