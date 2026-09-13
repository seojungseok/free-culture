'use client';
import {useRef,useState} from 'react';
import Image from 'next/image';
import type {PrepImage as Photo,PrepProduct} from '@/lib/weekend-prep/types';
export default function PrepImage({photo,products,priority=false,onPlace}:{photo:Photo;products:PrepProduct[];priority?:boolean;onPlace?:(x:number,y:number)=>void}){
 const [active,setActive]=useState<string|null>(null);const last=useRef<HTMLButtonElement|null>(null);
 const close=()=>{setActive(null);last.current?.focus();};const product=products.find(p=>p.id===active);
 return <figure className="prep-photo" onKeyDown={e=>{if(e.key==='Escape')close();}}>
  <div className="prep-image" onClick={e=>{if(!onPlace)return;const r=e.currentTarget.getBoundingClientRect();onPlace(Math.round((e.clientX-r.left)/r.width*1000)/10,Math.round((e.clientY-r.top)/r.height*1000)/10);}}>
   {photo.url?<Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 640px) 100vw, 800px" priority={priority} unoptimized={!photo.url.startsWith('/')} />:<div className="prep-no-image">설명 이미지를 준비하고 있어요</div>}
   {photo.tags.map((tag,i)=>{const p=products.find(p=>p.id===tag.productId);return p?<button key={i} type="button" className="prep-tag" style={{left:`${tag.x}%`,top:`${tag.y}%`}} aria-label={`${p.name} 정보 보기`} aria-expanded={active===p.id} onClick={e=>{e.stopPropagation();last.current=e.currentTarget;setActive(active===p.id?null:p.id);}}>+</button>:null;})}
  </div>
  <figcaption>{photo.generated?'AI 연출 이미지 · 실제 판매 상품과 외형·구성이 다를 수 있습니다.':photo.alt}</figcaption>
  {product&&<div className="prep-product-pop" role="region" aria-label="준비물 정보"><button type="button" className="prep-close" onClick={close}>닫기 ×</button><p>{photo.generated?'이 활동에 어울리는 준비물':'연결된 준비물'}</p><strong>{product.name}</strong><p>{product.specification||'규격과 구성은 판매처에서 확인하세요.'}</p><a href={product.affiliateUrl} target="_blank" rel="sponsored noopener">상품 정보 확인 ↗</a></div>}
 </figure>;
}
