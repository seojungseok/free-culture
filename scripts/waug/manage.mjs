import fs from 'node:fs';
import { importLinks } from './import.mjs';
import { publish, schedule, publicArticles, readiness, launchNow } from './core.mjs';
const root='data/waug/';
const read=name=>JSON.parse(fs.readFileSync(root+name+'.json','utf8'));
const write=(name,data)=>{const f=root+name+'.json';fs.writeFileSync(f+'.tmp',JSON.stringify(data,null,2)+'\n');fs.renameSync(f+'.tmp',f);};
const state=read('editorial'), db=read('catalog');
if(fs.existsSync(root+'publication-policy.json'))state.publicationPolicy=read('publication-policy');
const command=process.argv[2]||'status';
if(command==='status') {
  console.log(JSON.stringify({products:db.products.length,excluded:db.products.filter(p=>p.eligibility==='excluded').length,articles:state.articles.map(a=>({slug:a.slug,status:a.status,scheduledAt:a.scheduledAt,reasons:readiness(a,db.products)})),paused:state.paused,published:state.history.length},null,2));
} else if(command==='import-env') {
  if(!process.env.WAUG_LINKS?.trim()) throw new Error('등록할 표가 비어 있습니다.');
  console.log({added:importLinks(db,process.env.WAUG_LINKS)});write('catalog',db);
} else if(['pause','resume'].includes(command)) {
  state.paused=command==='pause';write('editorial',state);
} else if(['run','launch-now'].includes(command)) {
  // CI concurrency + exclusive local lock + durable history prevent duplicate publication.
  const lock=root+'.publish.lock';
  const fd=fs.openSync(lock,'wx');
  try {
    const planned=command==='run'?schedule(state,db.products):[];
    const published=command==='launch-now'?launchNow(state,db.products,read('launch-selection').entries.map(e=>e.placeId)):publish(state,db.products);
    for(const a of state.articles)for(const id of a.productIds||[]){const p=db.products.find(p=>p.id===id);if(p){p.articleSlug=a.slug;p.scheduledAt=a.scheduledAt||null;}}
    write('editorial',state);write('catalog',db);write('published',{version:1,articles:publicArticles(state,db.products)});
    if(fs.existsSync(root+'places.json')){
      const places=read('places');for(const a of state.articles){const p=places.places.find(p=>p.id===a.placeId);if(p)Object.assign(p,{articleSlug:a.slug,address:a.address,status:a.status,scheduledAt:a.scheduledAt||null,publishedAt:a.publishedAt||null,thumbnail:a.thumbnail});}write('places',places);
    }
    console.log(JSON.stringify({paused:state.paused,planned,published}));
  } finally {fs.closeSync(fd);fs.unlinkSync(lock);}
} else throw new Error('지원 명령: status, import-env, pause, resume, run, launch-now');
