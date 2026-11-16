import { Suspense } from "react";
import type { CultureEvent } from "@/lib/types";
import FilterableGrid from "./FilterableGrid";
import { Band, Container } from "./Band";
import ShareLinkButton from "./ShareLinkButton";
import TossTopDeals from "./TossTopDeals";
import InitialIndexPreview from './InitialIndexPreview';
import {slimForClient} from '@/lib/data';
import {fmtRange} from '@/lib/format';

export default function CollectionView({
  title,
  subtitle,
  events,
  hidePriceFilter = false,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  events: CultureEvent[];
  hidePriceFilter?: boolean;
  children?: React.ReactNode;
}) {
  const preview=events.slice(0,18).map(event=>({href:`/event/${event.id}`,title:event.title,
    meta:`${event.area} · ${fmtRange(event.startDate,event.endDate)} · ${event.place}`}));
  return (
    <>
      <Band tone="tint" innerClassName="flex flex-wrap items-end justify-between gap-3 py-6">
        <div>
          <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[14px] text-ink-soft">{subtitle}</p>
          )}
        </div>
        <ShareLinkButton label="이 목록 공유" size="md" />
      </Band>
      <div className="bg-panel">
        <Container className="pb-10 pt-6">
          {children}
          <Suspense fallback={<InitialIndexPreview title="현재 등록된 문화행사" items={preview}/> }>
            <FilterableGrid events={slimForClient(events)} showControls hidePriceFilter={hidePriceFilter} advertisement={<TossTopDeals contained compact />} />
          </Suspense>
        </Container>
      </div>
    </>
  );
}
