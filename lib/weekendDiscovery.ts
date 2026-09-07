import type {TripStop} from './planner';
export type WeekendCandidate=TripStop & {nature:boolean;seasonal:boolean};
export type WeekendFilter={area:string;date:string;purpose:string;free:boolean;kids:boolean;query:string};
export function weekendCandidates(items:WeekendCandidate[],f:WeekendFilter){
 if(!f.area)return [];
 const pool=items.filter(s=>s.area===f.area&&(!f.free||s.free===true)&&(!f.kids||s.kids===true)&&
  (s.kind!=='event'||!!s.start&&!!s.end&&s.start<=f.date&&s.end>=f.date)&&
  (f.purpose==='all'||f.purpose==='event'&&s.kind==='event'||f.purpose==='nature'&&s.nature||f.purpose==='season'&&s.seasonal)&&
  (!f.query||[s.title,s.address].join(' ').includes(f.query.trim())));
 const score=(s:WeekendCandidate)=>(s.image?2:0)+(s.seasonal?3:0)+(s.kind==='event'&&s.end===f.date?4:0);
 pool.sort((a,b)=>score(b)-score(a)||(a.id<b.id?-1:a.id>b.id?1:0));
 const events=pool.filter(s=>s.kind==='event'),places=pool.filter(s=>s.kind!=='event'),out:WeekendCandidate[]=[];
 for(let i=0;i<Math.max(events.length,places.length);i++){if(events[i])out.push(events[i]);if(places[i])out.push(places[i]);}
 return out;
}
