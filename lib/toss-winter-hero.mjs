import {currentProducts,freshnessMs} from './sharelink-policy.mjs';
import {reviewedWinterTossFeed,winterTossCampaigns,winterCampaignVersion} from '../data/toss-winter-reviewed.mjs';

export function winterTossCampaign(product) {
 const campaign=winterTossCampaigns.find(c=>c.id===product?.id&&c.name===product?.name);
 return campaign||null;
}

export function selectWinterTossHero(feed,now=Date.now()) {
 // A fresh, reviewed launch snapshot bridges the first hourly collection after deployment.
 // Once the new collector has run, its omissions (sold out, renamed or changed image) are authoritative.
 const source=feed?.winterCampaignVersion===winterCampaignVersion?feed:reviewedWinterTossFeed;
 const eligible=currentProducts(source,now).filter(p=>{
  if(!p||p.isSoldOut===true||!Number.isInteger(p.id)||!p.name||!p.image?.startsWith('https://')||!Number.isFinite(p.price)||p.price<0)return false;
  if(!winterTossCampaign(p))return false;
  try{const url=new URL(p.links?.home);return url.hostname==='toss.shopping'&&url.protocol==='https:';}catch{return false;}
 });
 return winterTossCampaigns.map(c=>eligible.find(p=>p.id===c.id&&p.name===c.name)).filter(Boolean)
  .map(p=>({...p,verifiedAt:p.verifiedAt||source.checkedAt,freshUntil:Date.parse(source.checkedAt)+freshnessMs}));
}
