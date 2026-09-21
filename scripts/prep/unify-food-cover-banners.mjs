import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const dataFile=path.join(root,'data','weekend-prep.json');
const store=JSON.parse(fs.readFileSync(dataFile,'utf8'));
const flowerSlug='autumn-flower-crab-soup-ingredient-checklist';

function xml(value){return value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
function dishName(article){
 const raw=String(article.coverLabel||article.title||'').replace(/^가을\s*/,'').replace(/^캠핑\s*/,'');
 return raw.replace(/\s*(준비물|재료)(\s*체크리스트)?\s*$/,'').replace(/\s*체크리스트\s*$/,'').trim();
}
function banner(width,height,title){
 const bandY=Math.round(height*.80),bandH=height-bandY;
 const size=title.length>19?Math.round(width*.050):title.length>15?Math.round(width*.058):Math.round(width*.068);
 const letter=Math.max(1,Math.round(size*.025));
 return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#123b2b"/><stop offset=".18" stop-color="#164a35"/><stop offset=".5" stop-color="#1b523b"/><stop offset=".82" stop-color="#164a35"/><stop offset="1" stop-color="#123b2b"/></linearGradient></defs><rect x="0" y="${bandY}" width="${width}" height="${bandH}" fill="url(#g)"/><text x="${width/2}" y="${bandY+bandH*.64}" text-anchor="middle" fill="#fffdf3" font-family="Batang, NanumMyeongjo, serif" font-size="${size}" font-weight="700" letter-spacing="-${letter}">${xml(title)}</text></svg>`;
}

for(const article of store.articles.filter(a=>a.salesFormat==='food-checklist')){
 const source=path.join(root,'public',article.cover.url.replace(/^\//,''));
 if(!fs.existsSync(source))throw new Error(`Missing cover: ${source}`);
 const metadata=await sharp(source).metadata();
 if(!metadata.width||!metadata.height)throw new Error(`Missing dimensions: ${source}`);
 const season=article.slug===flowerSlug?'가을 ':'';
 const title=`${season}${dishName(article)} 재료 알아보기`;
 const sourceBase=path.basename(article.cover.url,'.webp').replace(/(?:-caption-v\d+|-caption-\d{8}|-unified(?:-v\d+)?)+$/,'');
 const outputName=`${sourceBase}-unified-v2.webp`;
 const output=path.join(root,'public','prep-images',outputName);
 await sharp(source).composite([{input:Buffer.from(banner(metadata.width,metadata.height,title)),top:0,left:0}]).webp({quality:90}).toFile(output);
 article.cover.url=`/prep-images/${outputName}`;
 article.cover.prompt=`${article.cover.prompt}\n대표 썸네일 통일: ${title}. 꽃게탕 기준의 중앙 정렬 녹색 그라데이션 제목 배너를 적용하고 별도 AI 문구는 넣지 않았습니다.`;
 article.updatedAt=new Date().toISOString();
}
store.version=(store.version||0)+1;
fs.writeFileSync(dataFile,JSON.stringify(store,null,2)+'\n');
console.log(`Unified ${store.articles.filter(a=>a.salesFormat==='food-checklist').length} food checklist covers.`);
