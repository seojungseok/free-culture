// Private local preview: never alters approval, publication or scheduling state.
import fs from 'node:fs';
import {publicArticles} from './core.mjs';
const state=JSON.parse(fs.readFileSync('data/waug/editorial.json','utf8'));
const products=JSON.parse(fs.readFileSync('data/waug/catalog.json','utf8')).products;
for(const a of state.articles){a.status='published';a.publishedAt=new Date().toISOString();state.history.push({slug:a.slug});if(a.thumbnail.localPath)a.thumbnail.url=`http://127.0.0.1:3010/${a.thumbnail.localPath.replace(/^public\//,'')}`;for(const p of a.photos)if(p.localPath)p.url=`http://127.0.0.1:3010/${p.localPath.replace(/^public\//,'')}`;}
const articles=publicArticles(state,products).map(a=>({...a,checkedAt:a.checkedAt||'검수 대기'}));
fs.mkdirSync('.cache/waug',{recursive:true});fs.writeFileSync('.cache/waug/preview.json',JSON.stringify({articles},null,2));
console.log('로컬 개발 미리보기 저장. 공개 상태 변경 없음.');
