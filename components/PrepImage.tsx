'use client';
import {useId, useRef, useState} from 'react';
import Image from './PrepStaticImage';
import PrepAffiliateLink from './PrepAffiliateLink';
import {reviewedPrepAffiliate} from '@/lib/prep-affiliate';
import type {PrepImage as Photo, PrepChecklistItem} from '@/lib/weekend-prep/types';

export default function PrepImage({photo, priority = false, headline, items = [], slug}: {photo: Photo; priority?: boolean; headline?: string; items?: PrepChecklistItem[]; slug?: string}) {
  const [active, setActive] = useState<string | null>(null);
  const lastButton = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  const selected = items.find(item => item.id === active);
  const product = selected ? reviewedPrepAffiliate(selected) : undefined;
  const close = () => { setActive(null); lastButton.current?.focus(); };
  return <figure className="prep-photo">
    <div className="prep-image">
      {photo.url ? <Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height}
        sizes="(max-width: 640px) 100vw, 800px" priority={priority} fetchPriority={priority ? 'high' : undefined} unoptimized={!photo.url.startsWith('/')} />
        : <div className="prep-no-image">설명 이미지를 준비하고 있어요</div>}
      {headline && <strong className="prep-cover-label">{headline}</strong>}
    </div>
    <figcaption>{photo.alt}</figcaption>
    {!!items.length && slug && <div className="prep-photo-shopping" onKeyDown={event => {if (event.key === 'Escape') close();}}>
      <p className="prep-photo-shopping-title">이 활동에 어울리는 준비물 <span>+를 눌러 필요한 재료와 상품을 확인하세요.</span></p>
      <div className="prep-photo-tags" role="group" aria-label="사진 관련 준비물">
        {items.map(item => <button type="button" className="prep-tag" key={item.id} aria-expanded={active === item.id} aria-controls={panelId}
          onClick={event => {lastButton.current = event.currentTarget; setActive(active === item.id ? null : item.id);}}><span aria-hidden="true">{active === item.id ? '−' : '+'}</span> {item.label}</button>)}
      </div>
      {selected && <div id={panelId} className="prep-product-pop" role="region" aria-label={`${selected.label} 준비 안내`}>
        <div className="prep-product-pop-head"><strong>{selected.label}{selected.required && <span className="prep-required">필수 주재료</span>}</strong><button type="button" onClick={close} aria-label="준비물 안내 닫기">닫기 ×</button></div>
        {selected.quantity && <p className="prep-quantity">{selected.quantity}</p>}
        <p>{selected.role}</p>
        {product ? <><div className="prep-linked-product">{product.image&&<Image src={product.image} alt={product.productName+' 판매처 상품 사진'} width={80} height={80} unoptimized/>}<p className="prep-affiliate-name">연결 상품: {product.productName}</p></div>{product.optionNote&&<p className="prep-option-note">{product.optionNote}</p>}<PrepAffiliateLink href={product.url} slug={slug} placement="prep_image" className="prep-order" label={`${selected.label} 쿠팡 상품의 규격과 옵션 확인 (새 창)`}>쿠팡에서 규격·옵션 확인 ↗</PrepAffiliateLink></>
          : <p className="prep-link-pending">준비할 재료입니다. 확인된 상품 링크는 아직 연결되지 않았어요.</p>}
        <p className="prep-photo-shopping-note">AI 연출 이미지로, 연결 상품의 실제 외형·구성과 다를 수 있습니다.</p>
      </div>}
    </div>}
    {photo.usageNotice && <p className="prep-notice">{photo.usageNotice}</p>}
  </figure>;
}
