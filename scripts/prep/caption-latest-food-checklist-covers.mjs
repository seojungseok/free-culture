import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const dataFile=path.join(root,'data','weekend-prep.json');
const store=JSON.parse(fs.readFileSync(dataFile,'utf8'));
const titles={
 'autumn-20260920-soy-butter-potato-grill':'가을 간장버터감자구이 준비물',
 'autumn-20260920-shrimp-jeon':'가을 새우전 준비물',
 'autumn-20260920-mushroom-cheese-grill':'가을 버섯치즈구이 준비물',
 'autumn-20260920-tofu-soy-grill':'가을 두부간장구이 준비물',
 'autumn-20260920-kimchi-fishcake-stirfry':'가을 김치어묵볶음 준비물',
 'autumn-20260920-jeyuk-bokkeum-ingredient-checklist':'가을 제육볶음 준비물',
 'autumn-20260920-sundae-bokkeum-ingredient-checklist':'가을 순대볶음 준비물',
 'autumn-20260920-dakgalbi-ingredient-checklist':'가을 춘천 닭갈비 준비물',
 'autumn-20260920-chicken-kimchi-fried-rice-ingredient-checklist':'가을 닭가슴살 김치볶음밥 준비물',
 'autumn-20260920-mussel-seaweed-soup-ingredient-checklist':'가을 홍합미역국 준비물'
};

function escapeXml(value){return value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
function captionSvg(width,height,title){
 const bandHeight=Math.round(height*.165),bandY=height-bandHeight-Math.round(height*.035);
 const fontSize=title.length>16?Math.round(width*.056):title.length>12?Math.round(width*.067):Math.round(width*.082);
 const safeTitle=escapeXml(title);
 return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><rect x="${Math.round(width*.035)}" y="${bandY}" width="${Math.round(width*.93)}" height="${bandHeight}" rx="${Math.round(height*.024)}" fill="#123b2bdc"/><text x="${width/2}" y="${bandY+bandHeight*.63}" text-anchor="middle" fill="#fffdf3" font-family="Malgun Gothic, NanumGothic, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-${Math.max(1,Math.round(fontSize*.035))}">${safeTitle}</text><text x="${width-Math.round(width*.045)}" y="${height-Math.round(height*.035)}" text-anchor="end" fill="#fff" font-family="Malgun Gothic, NanumGothic, sans-serif" font-size="${Math.max(15,Math.round(width*.018))}" font-weight="700">AI 연출 이미지</text></svg>`;
}

for(const [slug,title] of Object.entries(titles)){
 const article=store.articles.find(article=>article.slug===slug);
 if(!article)throw new Error(`Missing article: ${slug}`);
 const source=path.join(root,'public',article.cover.url.replace(/^\//,''));
 const outputName=path.basename(article.cover.url,'.webp')+'-caption-v2.webp';
 const output=path.join(root,'public','prep-images',outputName);
 const metadata=await sharp(source).metadata();
 if(!metadata.width||!metadata.height)throw new Error(`Could not read image dimensions: ${source}`);
 await sharp(source).composite([{input:Buffer.from(captionSvg(metadata.width,metadata.height,title)),top:0,left:0}]).webp({quality:88}).toFile(output);
 article.cover.url=`/prep-images/${outputName}`;
 article.cover.prompt=`${article.cover.prompt}\n대표 썸네일 문구: ${title}. 원본 사진 위에 꽃게탕과 같은 하단 제목 배너를 적용했습니다.`;
 article.updatedAt=new Date().toISOString();
}
store.version=(store.version||0)+1;
fs.writeFileSync(dataFile,JSON.stringify(store,null,2)+'\n');
console.log(`Created ${Object.keys(titles).length} captioned food checklist covers.`);
