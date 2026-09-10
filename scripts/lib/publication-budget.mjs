import fs from 'node:fs';
import path from 'node:path';
export const dayKST=(date=new Date())=>date.toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
const read=(root,file,fallback)=>{const p=path.join(root,file);return fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):fallback;};
export function publicationBudget(root=process.cwd(),now=new Date()){
 const policy=read(root,'data/publication-policy.json',{general:{daily:30},tickets:{daily:20}});
 const day=dayKST(now), seen=new Set(), categories={};
 for(const file of ['place-articles','course-articles','city-tour-articles']){
  const rows=read(root,`data/${file}.json`,{}).articles||{};
  for(const [id,a] of Object.entries(rows))if(a.publishedAt&&dayKST(new Date(a.publishedAt))===day&&a.status!=='draft'&&a.status!=='held'){seen.add(file+':'+(a.id||id));categories[file]=(categories[file]||0)+1;}
 }
 const editorial=read(root,'data/waug/editorial.json',{history:[],articles:[]});
 for(const h of editorial.history)if(h.day===day)seen.add('waug:'+h.slug);
 const reserved=new Set(editorial.articles.filter(a=>!a.publishedAt&&a.status==='scheduled'&&a.scheduledAt?.slice(0,10)===day).map(a=>a.placeId));
 const queue=read(root,'data/waug/queue.json',{jobs:[]});
 for(const j of queue.jobs)if(j.publicationDay===day&&!['published','excluded','held'].includes(j.status)&&!editorial.articles.some(a=>a.placeId===j.placeId&&a.publishedAt))reserved.add(j.placeId);
 return {day,published:seen.size,reserved:reserved.size,remaining:Math.max(0,policy.tickets.daily-editorial.history.filter(h=>h.day===day).length),unreserved:Math.max(0,policy.general.daily-(seen.size-editorial.history.filter(h=>h.day===day).length)),categories,waugPublished:editorial.history.filter(h=>h.day===day).length,otherPublished:seen.size-editorial.history.filter(h=>h.day===day).length};
}
// Called before each new generation. A process may keep its store in memory until exit.
export function newArticleAllowance(root=process.cwd(),category){const b=publicationBudget(root);const p=read(root,'data/publication-policy.json',{general:{daily:30,categories:{}}});return Math.min(b.unreserved,category?Math.max(0,(p.general.categories?.[category]??10)-(b.categories[category]||0)):p.general.daily);}
