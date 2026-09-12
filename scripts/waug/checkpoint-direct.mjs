import { publicArticles } from './core.mjs';
import fs from 'node:fs';import {execFileSync} from 'node:child_process';
if(process.env.WAUG_SERVER_EXECUTION!=='1')throw Error('예약 서버 전용');
const run=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
// Only durable content and generated assets; never source code, credentials or caches.
const state=JSON.parse(fs.readFileSync('data/waug/editorial.json'));const catalog=JSON.parse(fs.readFileSync('data/waug/catalog.json'));const projection=JSON.parse(fs.readFileSync('data/waug/published.json'));
if(JSON.stringify(projection.articles)!==JSON.stringify(publicArticles(state,catalog.products)))throw Error('공개 데이터와 발행 이력 불일치');
const policy=JSON.parse(fs.readFileSync('data/waug/publication-policy.json'));
for(const day of new Set(state.history.map(h=>h.day)))if(state.history.filter(h=>h.day===day).length>(policy.historicalPublicationAllowances?.[day]?.limit||30))throw Error('발행 한도 위반');
run('add','data/waug/catalog.json','data/waug/editorial.json','data/waug/published.json','data/waug/places.json','data/waug/queue.json','data/waug/listings.json','public/ticket-images');
for(const dir of ['data/waug/image-jobs','data/waug/research-jobs'])if(fs.existsSync(dir))run('add',dir);
if(run('diff','--cached','--name-only').trim()){
 const paths=run('diff','--cached','--name-only').trim().split('\n');if(paths.some(p=>!p.startsWith('data/waug/')&&!p.startsWith('public/ticket-images/')))throw Error('허용되지 않은 변경');
 run('commit','-m','chore: checkpoint scheduled ticket content');run('push','origin','HEAD:main');
}
console.log('Durable checkpoint saved');
