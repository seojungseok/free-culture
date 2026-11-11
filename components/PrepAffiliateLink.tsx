'use client';
import {useEffect, useRef, type ReactNode} from 'react';
import {affiliateTrack} from '@/lib/affiliate-track';
import {prepProductId} from '@/lib/prep-affiliate';

export default function PrepAffiliateLink({href, slug, placement, children, className, label}: {
  href: string; slug: string; placement: 'prep_checklist' | 'prep_image' | 'prep_product_list';
  children: ReactNode; className?: string; label?: string;
}) {
  const anchor = useRef<HTMLAnchorElement>(null);
  const page = `/weekend-prep/${slug}`;
  const productId = prepProductId(href);
  useEffect(() => {
    const element = anchor.current;
    if (!element || !('IntersectionObserver' in window)) return;
    let observed = false;
    const observer = new IntersectionObserver(entries => {
      if (observed || !entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5)) return;
      observed = true;
      affiliateTrack('affiliate_impression', 'coupang', placement, page, productId);
      observer.disconnect();
    }, {threshold: 0.5});
    observer.observe(element);
    return () => observer.disconnect();
  }, [page, placement, productId, href]);
  return <a ref={anchor} href={href} target="_blank" rel="sponsored noopener noreferrer"
    className={className} aria-label={label} data-affiliate-provider="coupang" data-affiliate-placement={placement}
    onClick={() => affiliateTrack('affiliate_click', 'coupang', placement, page, productId)}>{children}</a>;
}
