'use client';
import {useId,useRef,useState} from 'react';
import Image from 'next/image';
import type {PrepImage as Photo,PrepProduct} from '@/lib/weekend-prep/types';
export default function PrepImage({photo,products,priority=false,onPlace,headline}:{photo:Photo;products:PrepProduct[];priority?:boolean;onPlace?:(x:number,y:number)=>void;headline?:string}){
 const [active,setActive]=useState<number|null>(null);const last=useRef<HTMLButtonElement|null>(null);const panelId=useId();
 const close=()=>{setActive(null);last.current?.focus();};const product=active===null?undefined:products.find(p=>p.id===photo.tags[active]?.productId);
 return <figure className="prep-photo" onKeyDown={e=>{if(e.key==='Escape')close();}}>
  <div className="prep-image" onClick={e=>{if(!onPlace)return;const r=e.currentTarget.getBoundingClientRect();onPlace(Math.round((e.clientX-r.left)/r.width*1000)/10,Math.round((e.clientY-r.top)/r.height*1000)/10);}}>
   {photo.url?<Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 640px) 100vw, 800px" priority={priority} unoptimized={!photo.url.startsWith('/')} />:<div className="prep-no-image">설명 이미지를 준비하고 있어요</div>}
   {headline&&<strong className="prep-cover-label">{headline}</strong>}
   {photo.tags.map((tag,i)=>{const p=products.find(p=>p.id===tag.productId);if(!p)return null;const style={left:`${tag.x}%`,top:`${tag.y}%`};return onPlace?<button key={i} type="button" className="prep-tag" style={style} aria-label={`${p.name} 정보 보기`} aria-controls={active===i?panelId:undefined} aria-expanded={active===i} onClick={e=>{e.stopPropagation();last.current=e.currentTarget;setActive(active===i?null:i);}}>+</button>:<a key={`${p.id}-${i}`} className="prep-tag" style={style} href={p.affiliateUrl} target="_blank" rel="sponsored noopener" aria-label={`${p.name} 쿠팡 상품페이지 보기 (새 창)`} title={p.name}>+</a>;})}
  </div>
  <figcaption>{photo.alt}{photo.tags.length>0&&(onPlace?' 사진의 +를 눌러 연결을 검토하세요.':' · 사진의 +를 누르면 해당 쿠팡 상품을 확인할 수 있습니다.')}</figcaption>
  {photo.usageNotice&&<p className="prep-notice">{photo.usageNotice}</p>}
  {product&&<div id={panelId} className="prep-product-pop" role="region" aria-label="준비물 정보"><button type="button" className="prep-close" onClick={close}>닫기 ×</button><p>{photo.productMatchReviewed?'이 장면에 연결된 상품':'이 활동에 어울리는 준비물'}</p><div className="prep-tag-product"><Image src={product.image} alt={`${product.name} 판매처 상품 사진`} width={96} height={96} unoptimized/><div><strong>{product.name}</strong><p>{product.specification||'규격과 구성은 판매처에서 확인하세요.'}</p><p>{product.options}</p><a href={product.affiliateUrl} target="_blank" rel="sponsored noopener">쿠팡에서 이 상품 보기 ↗</a></div></div></div>}
 </figure>;
}
