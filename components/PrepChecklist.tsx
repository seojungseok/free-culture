'use client';
import {useEffect,useMemo,useState} from 'react';
import type {PrepChecklistItem,PrepProduct} from '@/lib/weekend-prep/types';

const groupLabel={main:'먼저 챙길 요리재료',seasoning:'양념·국물 재료',common:'집에 있는지 확인할 공통 준비물'} as const;

export default function PrepChecklist({slug,items,products}:{slug:string;items:PrepChecklistItem[];products:PrepProduct[]}){
 const storageKey=`prep-checklist:${slug}`;
 const [checked,setChecked]=useState<Set<string>>(new Set());
 const [ready,setReady]=useState(false);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))setChecked(new Set(saved.filter(v=>typeof v==='string')));}catch{}setReady(true);},[storageKey]);
 useEffect(()=>{if(ready)localStorage.setItem(storageKey,JSON.stringify([...checked]));},[checked,ready,storageKey]);
 const productMap=useMemo(()=>new Map(products.map(p=>[p.id,p])),[products]);
 const toggle=(id:string)=>setChecked(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next;});
 return <section className="prep-checklist" aria-labelledby="prep-checklist-title">
  <div className="prep-checklist-head"><div><p className="prep-eyebrow">출발 전 확인</p><h2 id="prep-checklist-title">준비물 체크리스트</h2></div><button type="button" onClick={()=>setChecked(new Set())} disabled={!checked.size}>전체 체크 해제</button></div>
  <p className="prep-checklist-count" aria-live="polite">{items.length}개 중 {checked.size}개 준비 완료</p>
  {(['main','seasoning','common'] as const).map(group=>{const rows=items.filter(item=>item.group===group);if(!rows.length)return null;return <div className={`prep-check-group prep-check-${group}`} key={group}><h3>{groupLabel[group]}</h3><ul>{rows.map(item=>{const done=checked.has(item.id);const product=productMap.get(item.productId);return <li className={done?'is-checked':undefined} key={item.id}>
   <label><input type="checkbox" checked={done} onChange={()=>toggle(item.id)}/><span><strong>{item.label}</strong><small>{item.role}</small></span></label>
   {done?<span className="prep-done">준비 완료</span>:product?<a className="prep-order" href={product.affiliateUrl} target="_blank" rel="sponsored noopener" aria-label={`${item.label} 상품 주문하기`}>주문하기</a>:null}
  </li>})}</ul></div>})}
 </section>;
}
