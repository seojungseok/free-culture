import {currentProducts,freshnessMs} from './sharelink-policy.mjs';

export function selectSeasonalProducts(feed,collection,reviewed,now=Date.now()){
 const live=currentProducts(feed,now),feedTime=Date.parse(feed?.checkedAt);
 return (collection?.productIds||[]).flatMap(id=>{
  const snapshot=reviewed.find(p=>p.id===id);
  if(!snapshot)return [];
  const item=live.find(p=>p.id===id);
  const snapshotTime=Date.parse(snapshot.checkedAt);
  // After a collector newer than the launch review, omissions are authoritative.
  const newlyCollected=['winter-warmers','kimjang'].includes(snapshot.collection);
  const authoritative=!newlyCollected||feed?.seasonalCampaignVersion===1;
  if(!item&&authoritative&&Number.isFinite(feedTime)&&feedTime>=snapshotTime)return [];
  const candidate=item||snapshot,checked=item?feedTime:snapshotTime;
  if(!Number.isFinite(checked)||checked>now||now-checked>=freshnessMs)return [];
  if(candidate.isSoldOut===true||candidate.name!==snapshot.name||candidate.image!==snapshot.image)return [];
  if(!Number.isFinite(candidate.price)||candidate.price<=0||candidate.price>=30000)return [];
  if(candidate.endAt&&(!Number.isFinite(Date.parse(candidate.endAt))||Date.parse(candidate.endAt)<=now))return [];
  try{const url=new URL(candidate.links?.home);if(url.protocol!=='https:'||url.hostname!=='toss.shopping'||url.username||url.password)return [];}catch{return [];}
  return [{...candidate,label:snapshot.label,checkedAt:new Date(checked).toISOString(),expiresAt:Math.min(checked+freshnessMs,candidate.endAt?Date.parse(candidate.endAt):Infinity)}];
 });
}
