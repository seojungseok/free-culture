'use client';
import {useEffect, useState} from 'react';
import Image from 'next/image';
import type {PrepChecklistItem} from '@/lib/weekend-prep/types';
import {reviewedPrepAffiliate} from '@/lib/prep-affiliate';
import PrepAffiliateLink from './PrepAffiliateLink';

const groupLabel = {main: '먼저 확인할 핵심 재료', seasoning: '양념·국물 재료', common: '조리 도구·보관 용기'} as const;

type ChecklistItem = PrepChecklistItem;

// Only show product links that have been matched and reviewed in advance.
const reviewedAffiliate = reviewedPrepAffiliate;

export default function PrepChecklist({slug, items, dishName}: {slug: string; items: ChecklistItem[]; dishName: string}) {
  const storageKey = `prep-checklist:${slug}`;
  const [selection, setSelection] = useState<{key: string; ids: Set<string>}>({key: '', ids: new Set()});
  const checked = selection.key === storageKey ? selection.ids : new Set<string>();
  useEffect(() => { let ids: string[] = []; try { const saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(saved)) ids = saved.filter(value => typeof value === 'string' && items.some(item => item.id === value)); } catch {} setSelection({key: storageKey, ids: new Set(ids)}); }, [storageKey, items]);
  useEffect(() => { if (selection.key === storageKey) { try { localStorage.setItem(storageKey, JSON.stringify([...selection.ids])); } catch {} } }, [selection, storageKey]);
  const toggle = (id: string) => setSelection(current => { const next = new Set(current.key === storageKey ? current.ids : []); next.has(id) ? next.delete(id) : next.add(id); return {key: storageKey, ids: next}; });
  return <section id="prep-checklist" className="prep-checklist" aria-labelledby="prep-checklist-title">
    <div className="prep-checklist-head"><div><p className="prep-eyebrow">요리 전 확인</p><h2 id="prep-checklist-title">{dishName} 재료와 조리 도구</h2></div><button type="button" onClick={() => setSelection({key: storageKey, ids: new Set()})} disabled={!checked.size}>전체 체크 해제</button></div>
    <p className="prep-checklist-intro">다음은 {dishName}에 필요한 재료와 조리 도구를 확인해 볼까요?</p>
    <p className="prep-checklist-count" aria-live="polite">{items.length}개 중 {checked.size}개 확인</p>
    {items.some(reviewedAffiliate) && <p className="prep-affiliate-disclosure">이 글의 쿠팡 제휴 링크로 구매하면 수수료를 받을 수 있습니다.</p>}
    {(['main', 'seasoning', 'common'] as const).map((group) => { const rows = items.filter((item) => item.group === group); if (!rows.length) return null; return <div className={`prep-check-group prep-check-${group}`} key={group}><h3>{groupLabel[group]}</h3><ul>{rows.map((item) => {
      const product = reviewedAffiliate(item);
      const isChecked = checked.has(item.id);
      return <li className={[isChecked ? 'is-checked' : product ? 'has-affiliate' : '', item.required ? 'prep-essential' : ''].filter(Boolean).join(' ')} key={item.id}><label><input type="checkbox" checked={isChecked} onChange={() => toggle(item.id)} /><span><strong>{item.label}{item.required && <span className="prep-required">필수 주재료</span>}</strong>{item.quantity && <small className="prep-quantity">{item.quantity}</small>}<small>{item.role}</small></span></label>{isChecked ? <span className="prep-done">확인 완료</span> : product ? <div className="prep-affiliate-product"><span className="prep-linked-product">{product.image&&<Image src={product.image} alt={product.productName+' 판매처 상품 사진'} width={64} height={64} unoptimized/>}<span className="prep-affiliate-name">연결 상품: {product.productName}</span></span>{product.optionNote&&<span className="prep-option-note">{product.optionNote}</span>}<PrepAffiliateLink className="prep-order" href={product.url} slug={slug} placement="prep_checklist" label={`${item.label} 상품 확인하기: ${product.productName} (새 창)`}>쿠팡에서 규격·옵션 확인 <span aria-hidden="true">↗</span></PrepAffiliateLink></div> : <span className="prep-link-pending">직접 준비할 재료{item.required ? ' · 상품 연결 확인 중' : ''}</span>}</li>;
    })}</ul></div>; })}
  </section>;
}
