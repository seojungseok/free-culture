import Link from "next/link";
import type { CultureEvent } from "@/lib/types";
import PosterCard from "./PosterCard";

export default function Rail({
  title,
  emoji,
  subtitle,
  moreHref,
  events,
}: {
  title: string;
  emoji?: string;
  subtitle?: string;
  moreHref?: string;
  events: CultureEvent[];
}) {
  if (!events.length) return null;
  return (
    <section className="py-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
            {emoji && <span className="mr-1.5">{emoji}</span>}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-ink-faint">{subtitle}</p>
          )}
        </div>
        {moreHref && (
          <Link
            href={moreHref}
            className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-ink-soft transition hover:bg-black/5 hover:text-ink"
          >
            더보기 →
          </Link>
        )}
      </div>

      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="w-[45%] shrink-0 snap-start sm:w-[30%] lg:w-[19%]"
          >
            <PosterCard ev={ev} />
          </div>
        ))}
      </div>
    </section>
  );
}
