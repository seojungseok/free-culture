'use client';
import {useEffect,useMemo,useState} from 'react';
import type {PrepChecklistItem,PrepProduct} from '@/lib/weekend-prep/types';
import {AFFILIATE_ENABLED} from '@/lib/affiliate';

const groupLabel={main:'먼저 확인할 핵심 재료',seasoning:'양념·국물 재료',common:'조리 도구·보관 용기'} as const;

export default function PrepChecklist({slug,items,products,dishName}:{slug:string;items:PrepChecklistItem[];products:PrepProduct[];dishName:string}){
 const storageKey=`prep-checklist:${slug}`;
 const [checked,setChecked]=useState<Set<string>>(new Set());
 const [ready,setReady]=useState(false);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))setChecked(new Set(saved.filter(v=>typeof v==='string')));}catch{}setReady(true);},[storageKey]);
 useEffect(()=>{if(ready)localStorage.setItem(storageKey,JSON.stringify([...checked]));},[checked,ready,storageKey]);
 const productMap=useMemo(()=>new Map(products.map(p=>[p.id,p])),[products]);
 const toggle=(id:string)=>setChecked(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next;});
 return <section className="prep-checklist" aria-labelledby="prep-checklist-title">
  <div className="prep-checklist-head"><div><p className="prep-eyebrow">요리 전 확인</p><h2 id="prep-checklist-title">{dishName} 재료와 조리 도구</h2></div><button type="button" onClick={()=>setChecked(new Set())} disabled={!checked.size}>전체 체크 해제</button></div>
  <p className="prep-checklist-intro">다음은 {dishName}에 필요한 재료와 조리 도구를 확인해 볼까요?</p>
  <p className="prep-checklist-count" aria-live="polite">{items.length}개 중 {checked.size}개 확인</p>
  {(['main','seasoning','common'] as const).map(group=>{const rows=items.filter(item=>item.group===group);if(!rows.length)return null;return <div className={`prep-check-group prep-check-${group}`} key={group}><h3>{groupLabel[group]}</h3><ul>{rows.map(item=>{const done=checked.has(item.id);const product=productMap.get(item.productId);return <li className={done?'is-checked':undefined} key={item.id}>
   <label><input type="checkbox" checked={done} onChange={()=>toggle(item.id)}/><span><strong>{item.label}</strong><small>{item.role}</small></span></label>
   {done?<span className="prep-done">확인 완료</span>:AFFILIATE_ENABLED&&product?<a className="prep-order" href={product.affiliateUrl} target="_blank" rel="sponsored noopener" aria-label={`${item.label} 상품 확인하기`}>상품 확인</a>:null}
  </li>})}</ul></div>})}
 </section>;
}
