import Link from "next/link";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";

export default function RegionLinks() {
  return (
    <section className="py-6">
      <h2 className="mb-3 text-lg font-extrabold tracking-tight text-ink sm:text-xl">
        📍 지역별로 찾기
      </h2>
      <div className="flex flex-wrap gap-2">
        {SIDO_LIST.map((sido) => (
          <Link
            key={sido}
            href={`/region/${(SIDO_SLUG as Record<string, string>)[sido]}`}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink-soft shadow-sm transition hover:border-free/40 hover:bg-free/5 hover:text-free"
          >
            {sido}
          </Link>
        ))}
      </div>
    </section>
  );
}
