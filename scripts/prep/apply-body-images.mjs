import fs from 'node:fs';
import sharp from 'sharp';
import {readStore,saveStore} from './store.mjs';
const manifest=JSON.parse(fs.readFileSync('data/weekend-prep-body-images.json','utf8'));
const store=readStore();let changed=false;
for(const record of manifest.images){
 if(!record.reviewed)throw Error('본문 이미지 검토 필요: '+record.key);
 const a=store.articles.find(a=>a.slug===record.slug);if(!a||a.status!=='draft'||!a.sections[record.section])throw Error('대상 초안·단락 확인 필요');
 const section=a.sections[record.section],url=`/prep-images/${record.key}-v1.webp`;
 if(section.image?.url===url)continue;
 if(section.image?.url)throw Error('기존 본문 이미지 보존: '+record.key);
 const photos=[a.cover,...a.sections.map(s=>s.image).filter(Boolean)];if(photos.length>=4)throw Error('이미지 최대 4장 초과');
 const out='public'+url;if(!fs.existsSync(out))await sharp(record.source).rotate().resize(1200,800,{fit:'inside'}).webp({quality:82}).toFile(out);
 const meta=await sharp(out).metadata();
 section.image={url,width:meta.width,height:meta.height,alt:record.alt,generated:true,reviewed:true,prompt:record.prompt,tags:[]};a.updatedAt=new Date().toISOString();changed=true;
}
if(changed)saveStore(store,store.version);
const counts=store.articles.map(a=>({slug:a.slug,category:a.category,images:[a.cover,...a.sections.map(s=>s.image).filter(Boolean)].length}));
console.log(JSON.stringify({articles:counts.length,total:counts.reduce((n,a)=>n+a.images,0),allThree:counts.every(a=>a.images===3),published:store.articles.filter(a=>a.status==='published').length}));
