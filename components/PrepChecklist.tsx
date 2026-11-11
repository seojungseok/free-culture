import type {PrepChecklistItem} from '@/lib/weekend-prep/types';
import {reviewedPrepAffiliate} from '@/lib/prep-affiliate';
import PrepAffiliateLink from './PrepAffiliateLink';

export default function PrepChecklist({slug,items,dishName,kind='cooking'}:{slug:string;items:PrepChecklistItem[];dishName:string;kind?:'cooking'|'supplies'}){
 return <section id="prep-checklist" className="prep-checklist" aria-labelledby="prep-checklist-title">
  <div className="prep-checklist-head"><h2 id="prep-checklist-title">{kind==='cooking'?`${dishName} 재료와 조리도구`:'본문에서 소개한 상품'}</h2></div>
  <ul className="prep-simple-items">{items.map(item=>{
   const product=reviewedPrepAffiliate(item);
   return <li key={item.id}><strong>{item.label}</strong>{product&&<PrepAffiliateLink href={product.url} slug={slug} placement="prep_checklist" className="prep-order" label={`${item.label} 최저가 알아보기 (새 창)`}>최저가 알아보기</PrepAffiliateLink>}</li>;
  })}</ul>
 </section>;
}
