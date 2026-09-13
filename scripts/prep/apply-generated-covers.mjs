import fs from 'node:fs';
import sharp from 'sharp';
import {readStore,saveStore} from './store.mjs';
const manifest=JSON.parse(fs.readFileSync('data/weekend-prep-image-batch.json','utf8'));
const store=readStore();let changed=false;
for(const record of manifest.images){
 if(!record.reviewed)throw Error('검토되지 않은 이미지: '+record.slug);
 const article=store.articles.find(a=>a.slug===record.slug);if(!article||article.status!=='draft')throw Error('비공개 초안만 이미지 적용 가능');
 const url=`/prep-images/${record.slug}-cover-v1.webp`;
 if(article.cover.url===url&&article.cover.alt===record.alt&&article.cover.prompt===record.prompt)continue;
 if(article.cover.url&&article.cover.url!==url)throw Error('기존 대표 이미지 보호: '+record.slug);
 const output='public'+url;
 if(!fs.existsSync(output))await sharp(record.source).rotate().resize(1200,800,{fit:'inside'}).webp({quality:82}).toFile(output);
 const meta=await sharp(output).metadata();
 article.cover={url,width:meta.width,height:meta.height,alt:record.alt,generated:true,reviewed:true,prompt:record.prompt,tags:[]};
 article.updatedAt=new Date().toISOString();changed=true;
}
if(changed)saveStore(store,store.version);
console.log(JSON.stringify({imagesApplied:manifest.images.length,articlesWithCover:store.articles.filter(a=>a.cover.url).length,published:store.articles.filter(a=>a.status==='published').length}));
