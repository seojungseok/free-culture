// Reuse public TourAPI gallery records already collected by this site. These
// are clearly labelled topic illustrations, never photographs of a programme.
import fs from 'node:fs';
import sharp from 'sharp';
const photos=JSON.parse(fs.readFileSync('data/photo-gallery.json','utf8')).photos;
const choices={craft:'2592426',pottery:'1800060',science:'2928400',astronomy:'3362222',nature:'1747390',mudflat:'2990247',kimchi:'3467146',tofu:'2825634',cooking:'2825634',art:'3405867',music:'1607375',reading:'3582053',general:'2592426'};
const file='data/programme-theme-media.json',prior=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{images:{}},images={...prior.images};
fs.mkdirSync('public/programme-images',{recursive:true});
for(const [theme,id]of Object.entries(choices)){
 const photo=photos.find(row=>String(row.id)===id);if(!photo)throw Error('Public topic photo missing');
 const src='/programme-images/topic-'+id+'.webp';
 if(!fs.existsSync('public'+src)){
  const url=new URL(photo.image);if(url.hostname!=='tong.visitkorea.or.kr'||url.protocol!=='https:')throw Error('Unexpected photo host');
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('Topic photo unavailable');
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>20*1024*1024)throw Error('Topic photo exceeds budget');
  await sharp(bytes).rotate().resize({width:1200,height:900,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile('public'+src);
 }
 const info=await sharp('public'+src).metadata();
 images[theme]={src,width:info.width,height:info.height,title:photo.title,provider:'한국관광공사',photographer:photo.photographer,source:photo.image,sourcePage:'https://api.visitkorea.or.kr/',photoId:id,kind:'topic',checkedAt:new Date().toISOString()};
}
// Also reuse visually reviewed activity photos already cached from e청소년.
// The caption identifies the original activity, and the cover labels every reuse.
const youth=JSON.parse(fs.readFileSync('data/youth-experiences.json','utf8')).records;
const reviewed=JSON.parse(fs.readFileSync('data/experience-media.json','utf8')).images;
for(const [theme,id]of Object.entries({digital:'383042',wood:'381236',coffee:'381221',sport:'383066'})){
 const item=youth.find(row=>String(row.id)===id),media=reviewed[item?.imageSource];
 if(!item||!media||!fs.existsSync('public'+media.src))throw Error('Reviewed activity image missing');
 const info=await sharp('public'+media.src).metadata();
 images[theme]={src:media.src,width:info.width,height:info.height,title:item.title,provider:'e청소년',photographer:item.institution||'제공 기관',source:item.imageSource,sourcePage:item.officialDetailUrl||'https://www.youth.go.kr/',photoId:id,kind:'topic',checkedAt:new Date().toISOString()};
}
fs.writeFileSync(file,JSON.stringify({generatedAt:new Date().toISOString(),images}));
console.log(JSON.stringify({themes:Object.keys(images).length,uniquePhotos:new Set(Object.values(images).map(row=>row.src)).size}));
