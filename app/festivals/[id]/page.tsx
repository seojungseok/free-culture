import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VisitChecklist from "@/components/VisitChecklist";
import SourceNote from "@/components/SourceNote";
import { fmtMd, getAllFestivals, getFestivalById, festivalHref, festivalStatus, festivalDateLabel, festivalVisitChecks, festivalVisitInfo } from "@/lib/festivals";
import { SITE } from "@/lib/site";
import { todayYmd } from "@/lib/dates";
import { eventContentsText, eventContentsParagraphs } from "@/lib/eventContents";
import { isUsefulDisplayValue } from "@/lib/displayValue";

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllFestivals().slice(0, 80).map((festival) => ({ id: festival.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const festival = getFestivalById((await params).id);
  if (!festival) return { title: "축제를 찾을 수 없습니다" };
  const description = eventContentsText(festival.description || "");
  const duplicateEventId = festival.id.startsWith("event-") ? festival.id.slice(6) : "";
  const searchValue = !duplicateEventId && festival.endDate >= todayYmd() && (festival.description || "").trim().length >= 150;
  return {
    title: `${festival.title} | ${festival.area} 축제 일정`,
    description: (description || `${festival.title} · ${festival.area} · ${fmtMd(festival.startDate)} ~ ${fmtMd(festival.endDate)}`).replace(/\s+/g, " ").slice(0, 160),
    robots: searchValue ? undefined : { index: false, follow: true },
    alternates: { canonical: duplicateEventId ? `/event/${duplicateEventId}` : `/festivals/${festival.id}` },
    openGraph: { title: festival.title, description, images: festival.image ? [{ url: festival.image }] : undefined, type: "article" },
  };
}

const introLabels: Record<string, string> = { sponsor: "주최·주관", sponsorTel: "주최 측 문의", program: "행사 프로그램" };

export default async function FestivalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const festival = getFestivalById((await params).id);
  if (!festival) notFound();
  const description = eventContentsText(festival.description || "");
  const descriptionParts = eventContentsParagraphs(description);
  const images = [...new Set([festival.image, ...(festival.images || [])].filter(Boolean))].slice(0, 6);
  const related = getAllFestivals().filter((item) => item.id !== festival.id && item.area === festival.area).slice(0, 4);
  const state = festivalStatus(festival);
  const visit = festivalVisitInfo(festival);
  const introEntries = Object.entries(festival.intro || {})
    .filter(([key, value]) => introLabels[key] && isUsefulDisplayValue(value))
    .map(([key, value]) => [key, eventContentsText(value)]);
  const extraInfo = (festival.info || [])
    .filter((item) => isUsefulDisplayValue(item.text) && eventContentsText(item.text) !== visit.reservation)
    .slice(0, 8);
  const facts = [
    { label: "기간", value: `${festivalDateLabel(festival.startDate)} ~ ${festivalDateLabel(festival.endDate)}` },
    { label: "장소", value: festival.place },
    { label: "주소", value: festival.addr },
    { label: "행사 시간", value: visit.hours },
    { label: "이용요금", value: visit.fee },
    { label: "관람 연령", value: visit.age },
    { label: "예약 안내", value: visit.reservation },
    { label: "문의", value: festival.tel || festival.intro?.sponsorTel },
  ].filter((fact) => isUsefulDisplayValue(fact.value));
  const date = (value: string) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  const canonical = `${SITE.url}/festivals/${festival.id}`;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Festival", name: festival.title,
    ...(description ? { description } : {}),
    ...(state !== "unknown" ? { startDate: date(festival.startDate), endDate: date(festival.endDate) } : {}),
    ...(images.length ? { image: images } : {}),
    location: { "@type": "Place", name: festival.place || festival.area, address: festival.addr },
    url: festival.homepage || canonical,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "전국 축제", item: `${SITE.url}/festivals` },
      { "@type": "ListItem", position: 2, name: festival.title, item: canonical },
    ],
  };
  const sourceHref = festival.id.startsWith("event-") ? "https://www.culture.go.kr/" : /^\d+$/.test(festival.id) ? "https://korean.visitkorea.or.kr/" : "https://www.data.go.kr/";

  return <main className="mx-auto max-w-[1180px] px-5 pb-14 pt-6 sm:px-6 lg:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
    <nav className="mb-5 text-sm text-ink-faint"><Link href="/">홈</Link><span className="mx-2">/</span><Link href="/festivals">전국 축제</Link><span className="mx-2">/</span><Link href={`/festivals?region=${encodeURIComponent(festival.area)}`}>{festival.area}</Link></nav>
    <article>
      <div className="grid gap-7 md:grid-cols-[minmax(0,430px)_minmax(0,1fr)] md:gap-8">
        <div className="overflow-hidden rounded-2xl bg-tint"><div className="aspect-[4/3]">{festival.image ? <img src={festival.image} alt={`${festival.title} 안내 이미지`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-6xl" aria-hidden="true">🎉</div>}</div></div>
        <div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#eaf7ef] px-3 py-1 text-free">{festival.area}</span>
            {state !== "unknown" && <span className={`rounded-full px-3 py-1 ${state === "ended" ? "bg-neutral-100 text-ink-soft" : "bg-tint text-freedark"}`}>{state === "ended" ? "종료된 행사" : state === "upcoming" ? "개최 예정" : "행사 기간 중"}</span>}
          </div>
          <h1 className="mt-3 break-keep text-3xl font-black leading-tight text-ink sm:text-4xl">{festival.title}</h1>
          {state === "ended" && <div className="mt-4 rounded-xl border border-line bg-panel p-4 text-sm leading-6 text-ink-soft"><p className="font-bold text-ink">기록된 행사 기간이 종료되었습니다.</p><p className="mt-1">아래는 {festivalDateLabel(festival.startDate)} ~ {festivalDateLabel(festival.endDate)} 행사에 대한 안내입니다. 다음 개최 일정은 주최 측의 새 공지를 확인해 주세요.</p><Link href="/festivals" className="mt-2 inline-flex min-h-11 items-center font-bold text-free">현재 진행·예정 축제 찾아보기 →</Link></div>}
          {descriptionParts[0] && <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-ink-soft">{descriptionParts[0]}</p>}
          <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-white">
            {facts.map((fact) => <div key={fact.label} className="grid grid-cols-[72px_1fr] gap-3 px-4 py-3 text-sm"><dt className="font-bold text-ink-faint">{fact.label}</dt><dd className="min-w-0 whitespace-pre-line break-words leading-6 text-ink">{fact.value}</dd></div>)}
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`https://map.kakao.com/?q=${encodeURIComponent(festival.addr || festival.place || festival.title)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-free px-4 py-2.5 text-sm font-bold text-white">지도에서 보기 ↗</a>
            {festival.homepage && <a href={festival.homepage} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 py-2.5 text-sm font-bold text-brandblue">공식 홈페이지 ↗</a>}
          </div>
        </div>
      </div>
      {state !== "ended" && <VisitChecklist pageId={`festival:${festival.id}`} items={festivalVisitChecks(festival)} />}
      {descriptionParts.length > 1 && <section className="mt-10 max-w-3xl border-t border-line pt-7"><h2 className="text-xl font-black text-ink">축제 소개</h2>{descriptionParts.slice(1).map((paragraph, index) => <p key={index} className="mt-4 whitespace-pre-line text-[15px] leading-8 text-ink-soft">{paragraph}</p>)}</section>}
      {images.length > 1 && <section className="mt-10 border-t border-line pt-7"><h2 className="text-xl font-black text-ink">축제 이미지</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{images.slice(1).map((image, index) => <div key={image} className="aspect-[4/3] overflow-hidden rounded-xl bg-tint"><img src={image} alt={`${festival.title} 안내 이미지 ${index + 2}`} loading="lazy" className="h-full w-full object-cover" /></div>)}</div></section>}
      {(introEntries.length > 0 || extraInfo.length > 0) && <section className="mt-10 border-t border-line pt-7"><h2 className="text-xl font-black text-ink">{state === "ended" ? "당시 행사 안내" : "프로그램과 주최 안내"}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{introEntries.map(([key, value]) => <div key={key} className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-black text-ink">{introLabels[key]}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-soft">{value}</p></div>)}{extraInfo.map((item, index) => <div key={`${item.name}-${index}`} className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-black text-ink">{eventContentsText(item.name) || "행사 안내"}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-soft">{eventContentsText(item.text)}</p></div>)}</div></section>}
      <SourceNote name={festival.source || "한국관광공사 관광정보"} href={sourceHref} dates={[{ label: "일정·기본정보 수집일", at: festival.checkedAt || festival.collectedAt }, { label: "추가 안내 응답 수집일", at: festival.enrichedAt }]} officialUrl={festival.homepage} />
    </article>
    {related.length > 0 && <section className="mt-10 border-t border-line pt-7"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black text-ink">같은 지역의 축제</h2><Link href={`/festivals?region=${encodeURIComponent(festival.area)}`} className="text-sm font-bold text-free">지역 축제 더보기 →</Link></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{related.map((item) => <Link key={item.id} href={festivalHref(item)} prefetch={false} className="overflow-hidden rounded-xl border border-line bg-white hover:border-free">{item.image && <img src={item.image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />}<div className="p-3"><h3 className="line-clamp-2 text-sm font-black text-ink">{item.title}</h3><p className="mt-2 text-xs text-ink-soft">{fmtMd(item.startDate)} ~ {fmtMd(item.endDate)}</p></div></Link>)}</div></section>}
  </main>;
}
