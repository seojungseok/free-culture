import NextStop from "@/components/NextStop";
import NearbyParking from "@/components/NearbyParking";
import { todayYmd } from "@/lib/dates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAllEvents, getEventById } from "@/lib/data";
import archivedEventsData from "@/data/events-archive.json";
import type { CultureEvent } from "@/lib/types";
import { eventStory } from "@/lib/eventStory";
import { eventContentsText, eventContentsParagraphs } from "@/lib/eventContents";
import { fmtRange, placeText, dday } from "@/lib/format";
import { SITE } from "@/lib/site";
import PriceBadge from "@/components/PriceBadge";
import AdSlot from "@/components/AdSlot";
import PosterCard from "@/components/PosterCard";
import ShareButtons from "@/components/ShareButtons";
import { eventOffer } from "@/lib/eventSeo";
import { hasSubstantiveEventInfo } from "@/lib/eventQuality";
import { SIDO_SLUG } from "@/lib/classify";
import { displayAddress, displayRegionTitle } from "@/lib/address";

const archivedEvents = new Map((archivedEventsData.events as CultureEvent[]).map(event => [event.id, {
  ...event,
  title: displayRegionTitle(event.title, event.area),
  address: displayAddress(event.address || "", event.area),
  addressConflict: Boolean(event.address && !displayAddress(event.address, event.area)),
}]));
const eventForDetail = (id: string) => getEventById(id) || archivedEvents.get(id);

// ISR: 1시간 재검증. 종료 상태를 반영하면서 기존 상세 URL은 유지한다.
// 전체를 빌드 때 만들지 않고 주목도 높은 일부만 사전 생성, 나머지는 첫 요청 때 생성 후 캐시.
export const revalidate = 10800;

export function generateStaticParams() {
  return getAllEvents()
    .filter((e) => e.featured)
    .slice(0, 60)
    .map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ev = eventForDetail(id);
  if (!ev) return { title: "행사를 찾을 수 없습니다" };
  const where = placeText(ev.area, ev.sigungu, ev.place);
  const contents = eventContentsText(ev.contents).replace(/\s+/g, " ");
  const desc = `${ev.endDate < todayYmd() ? "종료된 행사 · " : ""}${ev.priceLabel} · ${fmtRange(ev.startDate, ev.endDate)} · ${where}. ${
    contents ? contents.slice(0, 80) : `${ev.realmName} 행사 정보를 확인하세요.`
  }`;
  const isFree = ev.priceType === "free";
  const keywords = [
    `${ev.area} ${ev.realmName}`,
    isFree ? `${ev.area} 무료 ${ev.realmName}` : `${ev.area} ${ev.realmName} 공연`,
    ev.sigungu ? `${ev.sigungu} 문화행사` : `${ev.area} 문화행사`,
    `${ev.area} 주말 나들이`,
    ev.title,
  ];
  return {
    title: ev.title,
    description: desc,
    robots: ev.endDate < todayYmd() || !hasSubstantiveEventInfo(ev) ? { index: false, follow: true } : undefined,
    keywords,
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
  const ev = eventForDetail(id);
  if (!ev) notFound();

  const d = dday(ev.startDate, ev.endDate);
  const ended = ev.endDate < todayYmd();
  const regionSlug = (SIDO_SLUG as Record<string,string>)[ev.area];
  const contents = eventContentsParagraphs(ev.contents);
  const story = eventStory({
    title: ev.title, realmName: ev.realmName, area: ev.area, sigungu: ev.sigungu,
    place: ev.place, startDate: ev.startDate, endDate: ev.endDate,
    priceLabel: ev.priceLabel, priceType: ev.priceType, audiences: ev.audiences,
  });
  const related = getAllEvents()
    .filter((e) => e.id !== ev.id && e.genreKey === ev.genreKey && e.imgUrl && e.endDate >= todayYmd())
    .sort((a,b)=>Number(b.area===ev.area)-Number(a.area===ev.area))
    .slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    url: `${SITE.url}/event/${ev.id}`,
    startDate: iso(ev.startDate),
    endDate: iso(ev.endDate),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: ev.imgUrl ? [ev.imgUrl] : undefined,
    description: contents.join("\n\n") || `${ev.realmName} · ${ev.priceLabel}`,
    location: {
      "@type": "Place",
      name: ev.place || ev.area,
      address: ev.address || `${ev.area} ${ev.sigungu}`.trim(),
    },
    offers: ended ? undefined : eventOffer(ev),
  };

  return (
    <article className="mx-auto w-full max-w-[1280px] px-5 pb-14 pt-6 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, {
          '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
            {'@type':'ListItem',position:1,name:'홈',item:SITE.url},
            {'@type':'ListItem',position:2,name:ev.realmName || '문화행사',item:`${SITE.url}/genre/${ev.genreKey}`},
            {'@type':'ListItem',position:3,name:ev.title,item:`${SITE.url}/event/${ev.id}`},
          ],
        }]).replace(/</g, "\\u003c") }}
      />

      <nav className="mb-5 text-sm text-ink-faint">
        <Link href="/" className="hover:text-ink">홈</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/genre/${ev.genreKey}`} className="hover:text-ink">
          {ev.realmName || "문화행사"}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* 포스터 */}
        <div className="min-w-0 md:sticky md:top-32 md:self-start">
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
            {!ended && <div className="absolute right-3 top-3">
              <PriceBadge type={ev.priceType} label={ev.priceLabel} />
            </div>}
          </div>
        </div>

        {/* 정보 */}
        <div className="min-w-0">
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

          {ended && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6">등록된 일정 기준으로 종료된 행사입니다. 지난 행사 정보는 참고용으로 보존합니다. {regionSlug&&<Link href={'/region/'+regionSlug} className="font-bold underline">현재 {ev.area} 행사·나들이 찾기</Link>}</p>}

          <dl className="mt-6 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white">
            <Row label={ended ? "당시 안내 요금" : "요금"}>
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
            <Row label="기간"><time dateTime={iso(ev.startDate)}>{fmtRange(ev.startDate, ev.startDate)}</time>{ev.startDate!==ev.endDate&&<> ~ <time dateTime={iso(ev.endDate)}>{fmtRange(ev.endDate,ev.endDate)}</time></>}</Row>
            <Row label="장소">{ev.place || "-"}</Row>
            <Row label="주소">{ev.address || `${ev.area} ${ev.sigungu}`.trim() || "-"}</Row>
            {ev.phone && <Row label="문의">{ev.phone}</Row>}
          </dl>

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

          {contents.length > 0 && (
            <section aria-labelledby="event-details-heading" className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
              <h2 id="event-details-heading" className="mb-5 text-[17px] font-extrabold text-ink">행사 상세 안내</h2>
              <div className="space-y-5 text-[15px] leading-[1.9] text-ink-soft sm:text-base">
                {contents.map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line break-words [overflow-wrap:anywhere]">{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {/* 소개글 — 구조화 데이터로 조합(공식 소개 없는 행사도 읽을거리 확보).
              네이버블로그처럼 여백 있고 읽기 편하게(짧은 문단, 넉넉한 줄간격) */}
          <section className="mt-7 rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-1.5 text-[17px] font-extrabold text-ink">
              <span>📖</span> 행사 소개
            </h2>
            <div className="space-y-4 text-[15.5px] leading-[1.95] text-ink-soft">
              {story.map((para, i) => (
                <p key={i} className={i === 0 ? "font-medium text-ink" : ""}>{para}</p>
              ))}
            </div>
          </section>

          {ev.endDate >= todayYmd() ? <NextStop anchor={{id:"event:"+ev.id,title:ev.title,href:"/event/"+ev.id,area:ev.area,kind:"event",image:ev.imgUrl,address:ev.address || ev.place,x:Number(ev.gpsX),y:Number(ev.gpsY),free:ev.priceType==="free",kids:ev.audiences?.includes("kids"),start:ev.startDate,end:ev.endDate}}/> : <section className="mt-5 rounded-xl bg-amber-50 p-4 text-sm"><h2 className="font-bold">이 행사는 종료되었습니다</h2><p className="mt-2">등록된 일정 기준입니다. 현재 갈 곳을 다시 찾아보세요.</p><nav className="mt-3 flex flex-wrap gap-4 font-bold underline"><Link href="/weekend">이번 주말 행사 보기</Link>{regionSlug&&<Link href={`/region/${regionSlug}`}>{ev.area} 이번 주말 가볼 곳</Link>}</nav></section>}
          {ev.endDate >= todayYmd() && <NearbyParking lon={Number(ev.gpsX)} lat={Number(ev.gpsY)} area={ev.area} address={ev.address} title="행사장 근처 주차 확인" />}
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

          <p className="mt-6 text-sm leading-6 text-ink-faint">정보 출처: 공공데이터포털(한국문화정보원). {ev.officialUrl && <a href={ev.officialUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">행사 공식 페이지 확인 ↗</a>}</p>

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
