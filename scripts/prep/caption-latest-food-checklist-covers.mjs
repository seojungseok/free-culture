import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const dataFile=path.join(root,'data','weekend-prep.json');
const store=JSON.parse(fs.readFileSync(dataFile,'utf8'));
const titles={
 'autumn-20260920-soy-butter-potato-grill':'간장버터감자구이 재료',
 'autumn-20260920-shrimp-jeon':'새우전 재료',
 'autumn-20260920-mushroom-cheese-grill':'버섯치즈구이 재료',
 'autumn-20260920-tofu-soy-grill':'두부간장구이 재료',
 'autumn-20260920-kimchi-fishcake-stirfry':'김치어묵볶음 재료',
 'autumn-20260920-jeyuk-bokkeum-ingredient-checklist':'제육볶음 재료',
 'autumn-20260920-sundae-bokkeum-ingredient-checklist':'순대볶음 재료',
 'autumn-20260920-dakgalbi-ingredient-checklist':'춘천 닭갈비 재료',
 'autumn-20260920-chicken-kimchi-fried-rice-ingredient-checklist':'닭가슴살 김치볶음밥 재료',
 'autumn-20260920-mussel-seaweed-soup-ingredient-checklist':'홍합미역국 재료',
 'autumn-camping-pork-kimchi-stew-ingredient-checklist':'돼지고기 김치찌개 재료',
 'autumn-camping-doenjang-stew-ingredient-checklist':'된장찌개 재료',
 'autumn-camping-perilla-mushroom-soup-ingredient-checklist':'들깨버섯탕 재료',
 'autumn-camping-potato-sujebi-ingredient-checklist':'감자수제비 재료',
 'autumn-camping-shrimp-butter-grill-ingredient-checklist':'새우버터구이 재료',
 'autumn-camping-mackerel-potato-braise-ingredient-checklist':'고등어감자조림 재료',
 'autumn-camping-chicken-potato-stew-ingredient-checklist':'닭볶음탕 재료',
 'autumn-camping-tteokbokki-ingredient-checklist':'떡볶이 재료',
 'autumn-camping-zucchini-pancake-ingredient-checklist':'애호박전 재료',
 'autumn-camping-corn-cheese-ingredient-checklist':'버터콘치즈 재료'
};

function escapeXml(value){return value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
function captionSvg(width,height,title,showAi=true){
 const bandHeight=Math.round(height*.165),bandY=height-bandHeight-Math.round(height*.035);
 const fontSize=title.length>16?Math.round(width*.056):title.length>12?Math.round(width*.067):Math.round(width*.082);
 const safeTitle=escapeXml(title);
 const ai=showAi?`<text x="${width-Math.round(width*.045)}" y="${height-Math.round(height*.012)}" text-anchor="end" fill="#fff" stroke="#183a2b66" stroke-width="2" paint-order="stroke" font-family="Malgun Gothic, NanumGothic, sans-serif" font-size="${Math.max(15,Math.round(width*.018))}" font-weight="700">AI 연출 이미지</text>`:'';
 return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><rect x="${Math.round(width*.035)}" y="${bandY}" width="${Math.round(width*.93)}" height="${bandHeight}" rx="${Math.round(height*.024)}" fill="#123b2b"/><text x="${width/2}" y="${bandY+bandHeight*.63}" text-anchor="middle" fill="#fffdf3" font-family="Malgun Gothic, NanumGothic, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-${Math.max(1,Math.round(fontSize*.035))}">${safeTitle}</text>${ai}</svg>`;
}

for(const [slug,title] of Object.entries(titles)){
 const article=store.articles.find(article=>article.slug===slug);
 if(!article)throw new Error(`Missing article: ${slug}`);
 const sourceName=path.basename(article.cover.url,'.webp').replace(/(?:-caption-v2|-caption-v3)+$/,'');
 const source=path.join(root,'public','prep-images',`${sourceName}.webp`);
 const outputName=`${sourceName}-caption-v3.webp`;
 const output=path.join(root,'public','prep-images',outputName);
 const metadata=await sharp(source).metadata();
 if(!metadata.width||!metadata.height)throw new Error(`Could not read image dimensions: ${source}`);
 await sharp(source).composite([{input:Buffer.from(captionSvg(metadata.width,metadata.height,title,!sourceName.startsWith('autumn-20260919-'))),top:0,left:0}]).webp({quality:88}).toFile(output);
 article.cover.url=`/prep-images/${outputName}`;
 article.cover.prompt=`${article.cover.prompt}\n대표 썸네일 문구: ${title}. 원본 사진 위에 꽃게탕과 같은 하단 제목 배너를 적용했습니다.`;
 article.updatedAt=new Date().toISOString();
}
store.version=(store.version||0)+1;
fs.writeFileSync(dataFile,JSON.stringify(store,null,2)+'\n');
console.log(`Created ${Object.keys(titles).length} captioned food checklist covers.`);
