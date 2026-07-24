import { Suspense } from "react";
import type { CultureEvent } from "@/lib/types";
import FilterableGrid from "./FilterableGrid";
import { Band, Container } from "./Band";

export default function CollectionView({
  title,
  subtitle,
  events,
  hidePriceFilter = false,
}: {
  title: React.ReactNode;
  subtitle?: string;
  events: CultureEvent[];
  hidePriceFilter?: boolean;
}) {
  return (
    <>
      <Band tone="tint" innerClassName="py-6">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[14px] text-ink-soft">{subtitle}</p>
        )}
      </Band>
      <div className="bg-panel">
        <Container className="pb-10 pt-6">
          <Suspense fallback={null}>
            <FilterableGrid events={events} showControls={!hidePriceFilter} />
          </Suspense>
        </Container>
      </div>
    </>
  );
}
