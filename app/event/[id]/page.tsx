import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAllEvents, getEventById } from "@/lib/data";
import { fmtRange, placeText, dday } from "@/lib/format";
import { SITE } from "@/lib/site";
import PriceBadge from "@/components/PriceBadge";
import AdSlot from "@/components/AdSlot";
import PosterCard from "@/components/PosterCard";
import ShareButtons from "@/components/ShareButtons";

export function generateStaticParams() {
  return getAllEvents().map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ev = getEventById(id);
  if (!ev) return { title: "행사를 찾을 수 없습니다" };
  const where = placeText(ev.area, ev.sigungu, ev.place);
  const desc = `${ev.priceLabel} · ${fmtRange(ev.startDate, ev.endDate)} · ${where}. ${
    ev.contents ? ev.contents.slice(0, 80) : `${ev.realmName} 행사 정보를 확인하세요.`
  }`;
  return {
    title: ev.title,
    description: desc,
    alternates: { canonical: `/event/${ev.id}` },
    openGraph: {
      title: ev.title,
      description: desc,
      images: ev.imgUrl ? [{ url: ev.imgUrl }] : undefined,
      type: "article",
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ev = getEventById(id);
  if (!ev) notFound();

  const d = dday(ev.startDate, ev.endDate);
  const related = getAllEvents()
    .filter((e) => e.id !== ev.id && e.genreKey === ev.genreKey && e.imgUrl)
    .slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    startDate: iso(ev.startDate),
    endDate: iso(ev.endDate),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: ev.imgUrl ? [ev.imgUrl] : undefined,
    description: ev.contents || `${ev.realmName} · ${ev.priceLabel}`,
    location: {
      "@type": "Place",
      name: ev.place || ev.area,
      address: ev.address || `${ev.area} ${ev.sigungu}`.trim(),
    },
    offers: {
      "@type": "Offer",
      price: ev.priceType === "free" ? "0" : ev.priceMax ? String(ev.priceMax) : undefined,
      priceCurrency: "KRW",
      availability: "https://schema.org/InStock",
      url: ev.officialUrl || SITE.url,
    },
  };

  return (
    <article className="mx-auto w-full max-w-[1280px] px-5 pb-14 pt-6 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-5 text-sm text-ink-faint">
        <Link href="/" className="hover:text-ink">홈</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/genre/${ev.genreKey}`} className="hover:text-ink">
          {ev.realmName || "문화행사"}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_1fr]">
        {/* 포스터 */}
        <div className="md:sticky md:top-32 md:self-start">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-card">
            {ev.imgUrl ? (
              <Image
                src={ev.imgUrl}
                alt={ev.title}
                fill
                sizes="(max-width:768px) 100vw, 420px"
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-ink-faint">
                {ev.title}
              </div>
            )}
            <div className="absolute right-3 top-3">
              <PriceBadge type={ev.priceType} label={ev.priceLabel} />
            </div>
          </div>
        </div>

        {/* 정보 */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-xs font-semibold text-ink-soft">
              {ev.realmName || "문화행사"}
            </span>
            {d && (
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-bold",
                  d.critical ? "bg-danger text-white" : "bg-black/[0.05] text-ink-soft",
                ].join(" ")}
              >
                {d.label}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
            {ev.title}
          </h1>

          <dl className="mt-6 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white">
            <Row label="요금">
              <span className="font-semibold">{ev.priceRaw || ev.priceLabel}</span>
              {ev.priceType === "unknown" && (
                <span className="ml-2 text-xs text-ink-faint">
                  (공식 페이지에서 확인 권장)
                </span>
              )}
              {ev.priceType === "partial_free" && ev.freeCondition && (
                <span className="ml-2 rounded-full bg-free/10 px-2 py-0.5 text-xs font-semibold text-free">
                  {ev.freeCondition}
                </span>
              )}
            </Row>
            <Row label="기간">{fmtRange(ev.startDate, ev.endDate)}</Row>
            <Row label="장소">{ev.place || "-"}</Row>
            <Row label="주소">{ev.address || `${ev.area} ${ev.sigungu}`.trim() || "-"}</Row>
            {ev.phone && <Row label="문의">{ev.phone}</Row>}
          </dl>

          {/* 무료 추정 안내 (요금 바로 아래) */}
          {ev.priceType === "free_estimated" && (
            <div className="mt-4 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">
                ⚠️ 요금 정보 확인이 필요합니다
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                이 행사는 공공데이터에 요금 정보가 제공되지 않아, 행사 유형을
                바탕으로 <b>무료로 추정</b>한 것입니다. 일부 프로그램은 유료이거나
                사전 예약이 필요할 수 있습니다. 방문 전 반드시 공식 페이지나 주최
                기관에 확인해주세요.
              </p>
              {ev.officialUrl && (
                <a
                  href={ev.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-amber-600"
                >
                  공식 페이지에서 확인하기 →
                </a>
              )}
            </div>
          )}

          {/* 요금 정보 없음 안내 */}
          {ev.priceType === "unknown" && (
            <div className="mt-4 rounded-xl border-l-4 border-neutral-300 bg-neutral-50 p-4">
              <p className="text-[13px] leading-relaxed text-ink-soft">
                ℹ️ 관람료 정보가 제공되지 않았습니다. 공식 페이지에서 확인해주세요.
              </p>
              {ev.officialUrl && (
                <a
                  href={ev.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-white transition hover:bg-black"
                >
                  공식 페이지에서 확인하기 →
                </a>
              )}
            </div>
          )}

          {ev.contents && (
            <div className="mt-6 whitespace-pre-line rounded-2xl bg-white p-5 text-[15px] leading-relaxed text-ink-soft ring-1 ring-black/5">
              {ev.contents}
            </div>
          )}

          <ShareButtons title={ev.title} officialUrl={ev.officialUrl} />

          <p className="mt-4 text-[13px] text-ink-faint">
            요금·정보가 잘못되었나요?{" "}
            <a
              href={`mailto:${SITE.email}?subject=${encodeURIComponent(
                `요금정보 제보 - ${ev.title}`
              )}`}
              className="font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
            >
              제보하기
            </a>
          </p>

          <AdSlot label="상세 하단 광고" />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-lg font-extrabold text-ink">
            비슷한 {ev.realmName || "문화"} 행사
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((e) => (
              <PosterCard key={e.id} ev={e} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-5 py-3.5 text-[15px]">
      <dt className="w-16 shrink-0 font-semibold text-ink-faint">{label}</dt>
      <dd className="text-ink-soft">{children}</dd>
    </div>
  );
}

function iso(ymd: string): string | undefined {
  if (!ymd || ymd.length !== 8) return undefined;
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}
