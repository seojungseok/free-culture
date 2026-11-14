'use client';
import {useEffect,useState} from 'react';
import type {PrepChecklistItem} from '@/lib/weekend-prep/types';
import {reviewedPrepAffiliate} from '@/lib/prep-affiliate';
import PrepAffiliateLink from './PrepAffiliateLink';

export default function PrepChecklist({slug,items,dishName,kind='cooking'}:{slug:string;items:PrepChecklistItem[];dishName:string;kind?:'cooking'|'supplies'}){
 const storageKey=`prep-checklist:${slug}`;
 const [selection,setSelection]=useState<{key:string;ids:Set<string>}>({key:'',ids:new Set()});
 const [missingOnly,setMissingOnly]=useState(false);
 const checked=selection.key===storageKey?selection.ids:new Set<string>();
 useEffect(()=>{
  let ids:string[]=[];
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))ids=saved.filter((id:unknown):id is string=>typeof id==='string'&&items.some(item=>item.id===id));}catch{}
  setSelection({key:storageKey,ids:new Set(ids)});setMissingOnly(false);
 },[storageKey,items]);
 useEffect(()=>{if(selection.key===storageKey)try{localStorage.setItem(storageKey,JSON.stringify([...selection.ids]));}catch{}},[selection,storageKey]);
 const toggle=(id:string)=>setSelection(current=>{const ids=new Set(current.key===storageKey?current.ids:[]);ids.has(id)?ids.delete(id):ids.add(id);return {key:storageKey,ids};});
 const remaining=items.filter(item=>!checked.has(item.id));
 return <section id="prep-checklist" className="prep-checklist" aria-labelledby="prep-checklist-title">
  <div className="prep-checklist-head"><h2 id="prep-checklist-title">{kind==='cooking'?`${dishName} 재료 장보기 목록`:'본문에서 소개한 상품'}</h2></div>
  <p className="prep-checklist-intro">{kind==='cooking'?'양념과 채소는 집에 있는 것을 먼저 확인하고, 필요한 재료만 체크하세요.':'집에 있는 것은 체크하세요. 없는 것만 구매하면 돼요.'}</p>
  <div className="prep-checklist-toolbar"><p className="prep-checklist-count" role="status">준비 완료 {checked.size}개 · 필요한 것 {remaining.length}개</p><div><button type="button" aria-pressed={missingOnly} onClick={()=>setMissingOnly(value=>!value)}>{missingOnly?'전체 보기':'없는 것만 보기'}</button><button type="button" disabled={!checked.size} onClick={()=>setSelection({key:storageKey,ids:new Set()})}>체크 초기화</button></div></div>
  {missingOnly&&!remaining.length&&<p className="prep-checklist-complete">모두 준비했어요. 이제 요리를 시작해 보세요!</p>}
  <ul className="prep-simple-items">{(missingOnly?remaining:items).map(item=>{
   const product=reviewedPrepAffiliate(item);
   const ready=checked.has(item.id);
   return <li key={item.id} className={ready?'is-checked':undefined}><label className="prep-have"><input type="checkbox" checked={ready} disabled={selection.key!==storageKey} onChange={()=>toggle(item.id)}/><strong>{item.label}</strong><span className="sr-only"> 집에 있음</span></label>{ready?<span className="prep-done">준비 완료</span>:product&&<PrepAffiliateLink href={product.url} slug={slug} placement="prep_checklist" className="prep-order" label={`${item.label} 구매하러가기 (새 창)`}>구매하러가기</PrepAffiliateLink>}</li>;
  })}</ul>
 </section>;
}
