import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const [slug,source]=process.argv.slice(2);
if(!slug||!source)throw new Error('사용법: node scripts/waug/prepare-thumbnail.mjs <slug> <검수한 제작 원본>');
const file='data/waug/editorial.json',state=JSON.parse(fs.readFileSync(file,'utf8'));
const article=state.articles.find(a=>a.slug===slug);if(!article)throw new Error('글이 없습니다.');
if(article.publishedAt)throw new Error('발행된 글의 이미지는 별도 후보로 제작·업로드·검수한 뒤 연결하세요. 현재 공개 이미지 주소는 유지합니다.');
const raw=fs.readFileSync(source),inputHash=crypto.createHash('sha256').update(raw).update('full-photo-1200x630-jpeg90-v1').digest('hex');
if(article.thumbnail.inputHash===inputHash&&article.thumbnail.localPath&&fs.existsSync(article.thumbnail.localPath)){console.log('기존 파일 재사용');process.exit(0);}
// Resize/compress the complete reviewed design; safety margins belong in the design, not a solid frame.
const buffer=await sharp(raw).resize(1200,630,{fit:'fill'}).jpeg({quality:90,mozjpeg:true}).toBuffer();
const sha256=crypto.createHash('sha256').update(buffer).digest('hex');
const localPath=`public/ticket-images/${slug}-${sha256.slice(0,12)}.jpg`;
fs.mkdirSync('public/ticket-images',{recursive:true});fs.writeFileSync(localPath,buffer);
Object.assign(article.thumbnail,{status:'upload_pending',url:`https://mwohaji.kr/ticket-images/${slug}-${sha256.slice(0,12)}.jpg`,localPath,inputHash,sha256,bytes:buffer.length,mimeType:'image/jpeg',width:1200,height:630,generatedAt:new Date().toISOString(),qualityNote:buffer.length>250*1024?'가독성과 사진 품질 우선':null});
for(const field of ['uploadedAt','verifiedAt','mobileCheckedAt','desktopCheckedAt','ogCheckedAt'])article.thumbnail[field]=null;
fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');
const placesFile='data/waug/places.json',places=JSON.parse(fs.readFileSync(placesFile,'utf8'));
const place=places.places.find(p=>p.id===article.placeId);if(place){place.articleSlug=article.slug;place.thumbnail=article.thumbnail;place.status='draft';}
fs.writeFileSync(placesFile,JSON.stringify(places,null,2)+'\n');
console.log({localPath,bytes:buffer.length,sha256,status:article.thumbnail.status});
