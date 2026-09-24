import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtMd, getAllFestivals, getFestivalById, festivalHref } from "@/lib/festivals";
import { SITE } from "@/lib/site";
import { todayYmd } from "@/lib/dates";

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllFestivals().slice(0, 80).map((festival) => ({ id: festival.id }));
}

function paragraphs(text: string) {
  const pieces = text.replace(/\s*\n\s*/g, "\n").split(/\n{2,}|(?<=[.!?])\s+(?=[가-힣A-Z])/).map((item) => item.trim()).filter(Boolean);
  return pieces.length ? pieces : [text];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const festival = getFestivalById((await params).id);
  if (!festival) return { title: "축제를 찾을 수 없습니다" };
  const description = festival.description || "";
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

export default async function FestivalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const festival = getFestivalById((await params).id);
  if (!festival) notFound();
  const description = festival.description || "";
  const images = [...new Set([festival.image, ...(festival.images || [])].filter(Boolean))].slice(0, 6);
  const related = getAllFestivals().filter((item) => item.id !== festival.id && item.area === festival.area).slice(0, 4);
  const introEntries = Object.entries(festival.intro || {}).filter(([, value]) => value).filter(([key]) => !["eventstart", "eventend", "eventplace"].includes(key));
  const introLabels: Record<string, string> = { usetime: "이용 시간", playtime: "공연 시간", sponsor: "주최·주관", sponsorTel: "주최 측 문의", agelimit: "관람 연령", program: "행사 프로그램" };
  const date = (value: string) => value.length === 8 ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : value;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Festival", name: festival.title, ...(description ? { description } : {}),
    startDate: date(festival.startDate), endDate: date(festival.endDate), image: images.length ? images : undefined,
    location: { "@type": "Place", name: festival.place || festival.area, address: festival.addr },
    url: festival.homepage || `${SITE.url}/festivals/${festival.id}`,
  };

  return <main className="mx-auto max-w-[1180px] px-5 pb-14 pt-6 sm:px-6 lg:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <nav className="mb-5 text-sm text-ink-faint"><Link href="/">홈</Link><span className="mx-2">/</span><Link href="/festivals">전국 축제</Link><span className="mx-2">/</span><Link href={`/festivals?region=${encodeURIComponent(festival.area)}`}>{festival.area}</Link></nav>
    <article>
      <div className="grid gap-7 md:grid-cols-[minmax(0,430px)_minmax(0,1fr)] md:gap-8">
        <div className="overflow-hidden rounded-2xl bg-tint"><div className="aspect-[4/3]">{festival.image ? <img src={festival.image} alt={`${festival.title} 축제 사진`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-6xl" aria-hidden="true">🎉</div>}</div></div>
        <div><div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-[#eaf7ef] px-3 py-1 text-free">{festival.area}</span><span className="rounded-full bg-[#f2f4f7] px-3 py-1 text-ink-soft">{fmtMd(festival.startDate)} ~ {fmtMd(festival.endDate)}</span></div><h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">{festival.title}</h1>{description && <p className="mt-5 text-[15px] leading-7 text-ink-soft">{paragraphs(description)[0]}</p>}
          <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-white"><div className="grid grid-cols-[72px_1fr] gap-3 px-4 py-3 text-sm"><dt className="font-bold text-ink-faint">기간</dt><dd>{festival.startDate} ~ {festival.endDate}</dd></div>{festival.place && <div className="grid grid-cols-[72px_1fr] gap-3 px-4 py-3 text-sm"><dt className="font-bold text-ink-faint">장소</dt><dd>{festival.place}</dd></div>}{festival.addr && <div className="grid grid-cols-[72px_1fr] gap-3 px-4 py-3 text-sm"><dt className="font-bold text-ink-faint">주소</dt><dd>{festival.addr}</dd></div>}{festival.tel && <div className="grid grid-cols-[72px_1fr] gap-3 px-4 py-3 text-sm"><dt className="font-bold text-ink-faint">문의</dt><dd>{festival.tel}</dd></div>}</dl>
          <div className="mt-5 flex flex-wrap gap-3"><a href={`https://map.kakao.com/?q=${encodeURIComponent(festival.addr || festival.place || festival.title)}`} target="_blank" rel="noreferrer" className="rounded-lg bg-free px-4 py-2.5 text-sm font-bold text-white">지도에서 보기 ↗</a>{festival.homepage && <a href={festival.homepage} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold text-brandblue">공식 홈페이지 ↗</a>}</div>
        </div>
      </div>
      {description && <section className="mt-10 max-w-3xl border-t border-line pt-7"><h2 className="text-xl font-black text-ink">축제 소개</h2>{paragraphs(description).map((paragraph, index) => <p key={index} className="mt-4 text-[15px] leading-8 text-ink-soft">{paragraph}</p>)}</section>}
      {images.length > 1 && <section className="mt-10 border-t border-line pt-7"><h2 className="text-xl font-black text-ink">축제 사진</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{images.slice(1).map((image, index) => <div key={image} className="aspect-[4/3] overflow-hidden rounded-xl bg-tint"><img src={image} alt={`${festival.title} 현장 사진 ${index + 2}`} loading="lazy" className="h-full w-full object-cover" /></div>)}</div></section>}
      {(introEntries.length > 0 || festival.info?.length) && <section className="mt-10 border-t border-line pt-7"><h2 className="text-xl font-black text-ink">운영 안내</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{introEntries.map(([key, value]) => <div key={key} className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-black text-ink">{introLabels[key] || "안내"}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-soft">{value}</p></div>)}{festival.info?.slice(0, 8).map((item, index) => <div key={`${item.name}-${index}`} className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-black text-ink">{item.name || "행사 안내"}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-soft">{item.text}</p></div>)}</div></section>}
    </article>
    {related.length > 0 && <section className="mt-10 border-t border-line pt-7"><div className="flex items-center justify-between"><h2 className="text-xl font-black text-ink">{festival.area}에서 함께 볼 축제</h2><Link href={`/festivals?region=${encodeURIComponent(festival.area)}`} className="text-sm font-bold text-free">지역 축제 더보기 →</Link></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{related.map((item) => <Link key={item.id} href={festivalHref(item)} className="overflow-hidden rounded-xl border border-line bg-white hover:border-free">{item.image && <img src={item.image} alt="" className="aspect-[4/3] w-full object-cover" />}<div className="p-3"><h3 className="line-clamp-2 text-sm font-black text-ink">{item.title}</h3><p className="mt-2 text-xs text-ink-soft">{fmtMd(item.startDate)} ~ {fmtMd(item.endDate)}</p></div></Link>)}</div></section>}
  </main>;
}
