import {readCache,writeCache} from './lib/tourClient.mjs';
import {petQuality} from '../lib/petContent.mjs';
const store=readCache('pet-travel.json',{places:{}});
for(const p of Object.values(store.places)){
 if(!p.enrichedAt)continue;
 p.images=[...new Set([p.image,...(p.images||[])].filter(Boolean).map(x=>x.replace(/^http:/,'https:')))];
 p.image=p.images[0]||'';
}
writeCache('pet-travel.json',store);
const ready=Object.values(store.places).filter(p=>petQuality(p).publishable);
console.log(JSON.stringify({published:ready.length,with3Photos:ready.filter(p=>p.images.length>=3).length,photos:ready.reduce((n,p)=>n+p.images.length,0),regions:[...new Set(ready.map(p=>p.area))].length,under200chars:ready.filter(p=>p.overview.length<200).map(p=>({id:p.id,title:p.title,chars:p.overview.length}))}));
