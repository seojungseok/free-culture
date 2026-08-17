import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import KidCoupangDeals from "@/components/KidCoupangDeals";
import { getKidCourse, getKidCourses, kidCoursesByArea, kmLabel, kidHeadline, type KidStop } from "@/lib/kidCourses";
import { SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 2592000; // 30일 — 좌표·구성 거의 불변
export function generateStaticParams() { return []; }

const THEME_LABEL: Record<string, { label: string; emoji: string }> = {
  animal: { label: "동물 친구", emoji: "🦁" },
  play: { label: "신나는 놀이", emoji: "🎡" },
  learn: { label: "배우는 나들이", emoji: "🔬" },
  nature: { label: "자연 탐험", emoji: "🌳" },
  show: { label: "공연·전시", emoji: "🎪" },
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getKidCourse(id);
  if (!c) return { title: "코스를 찾을 수 없습니다" };
  const th = THEME_LABEL[c.theme]?.label || "아이와 함께";
  const headline = kidHeadline(c.theme, c.spot.title);
  const title = `${headline} — ${c.area} ${c.city} 아이와 함께 코스`;
  const description = `${c.area} ${c.city} 아이와 함께 ${th} 코스. ${c.spot.title}에서 놀고${c.park ? `, 근처 ${c.park.title}을 걷다가` : ""} ${c.food ? `${c.food.title}에서 아이가 좋아하는 음식으로 마무리` : ""}. 차로 가까운 동선으로 반나절이면 충분해요.`;
  return {
    title, description,
    keywords: [`${c.city} 아이와 갈만한 곳`, `${c.area} 아이와 함께`, `${c.city} ${th}`, c.spot.title, headline, `${c.city} 아이 나들이`, `${c.city} 키즈`],
    alternates: { canonical: `/kids/c/${id}` },
    openGraph: { title, description, ...(c.image ? { images: [{ url: c.image }] } : {}), type: "article" },
  };
}

function Stop({ stop, label, emoji, fromTitle, intro }: { stop: KidStop; label: string; emoji: string; fromTitle?: string; intro: string }) {
  return (
    <section className="mt-9">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-free px-2.5 py-0.5 text-[11px] font-black text-white">{label}</span>
        {fromTitle && <span className="text-[12.5px] text-ink-faint">{fromTitle}에서 {kmLabel(stop.distKm)}</span>}
      </div>
      <h2 className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[20px]">{emoji} {stop.title}</h2>
      {stop.image && (
        <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
          <Image src={stop.image} alt={`${stop.title} — ${label}`} fill sizes="(max-width:820px) 100vw, 820px" className="object-cover" loading="lazy" unoptimized />
        </div>
      )}
      <p className="mt-3 text-[15px] leading-[1.85] text-ink-soft">{intro}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={stop.href} className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink-soft transition hover:border-free/40 hover:text-free">{stop.title} 자세히 →</Link>
        {stop.mapx && stop.mapy && (
          <a href={`https://map.kakao.com/link/map/${encodeURIComponent(stop.title)},${stop.mapy},${stop.mapx}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink-soft transition hover:border-free/40 hover:text-free">🗺 지도</a>
        )}
      </div>
    </section>
  );
}

export default async function KidCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getKidCourse(id);
  if (!c) notFound();

  const th = THEME_LABEL[c.theme] || { label: "아이와 함께", emoji: "🧸" };
  const areaSlug = (SIDO_SLUG as Record<string, string>)[c.area] || "";
  const canonical = `${SITE.url}/kids/c/${id}`;
  const related = kidCoursesByArea(c.area).filter((x) => x.id !== c.id && x.theme === c.theme).slice(0, 6);
  const total = getKidCourses().length;

  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "아이와 함께", item: `${SITE.url}/kids` },
      { "@type": "ListItem", position: 2, name: `${c.area} 아이와 함께`, item: `${SITE.url}/kids` },
      { "@type": "ListItem", position: 3, name: `${c.spot.title} 코스`, item: canonical },
    ],
  };
  const articleLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: `${c.spot.title} — ${c.area} ${c.city} 아이와 함께 코스`,
    image: [c.spot.image, c.park?.image, c.food?.image].filter(Boolean),
    articleSection: `${c.area} 아이와 함께`,
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: canonical,
  };

  return (
    <Container className="max-w-[820px] pb-16 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
        <Link href="/kids" className="hover:text-free">아이와 함께</Link>
        <span>›</span>
        <span>{c.area}</span>
      </nav>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-free px-2.5 py-0.5 text-[11px] font-black text-white">{th.emoji} {th.label}</span>
        <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-freedark">{c.area} {c.city}</span>
        {c.indoor && <span className="rounded-full bg-[#3b82f6] px-2 py-0.5 text-[11px] font-bold text-white">🌧️ 비 오는 날 실내</span>}
        <span className="text-[12px] text-ink-faint">· {c.totalKm < 1 ? "걸어서 이동 가능" : `차로 약 ${c.driveMin}분`}</span>
      </div>

      <h1 className="text-[24px] font-black leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
        {kidHeadline(c.theme, c.spot.title)}
      </h1>
      <p className="mt-1 text-[13.5px] text-ink-faint">{c.area} {c.city} · 아이와 함께 {th.label} 코스</p>
      <AffiliateNotice className="mt-1.5" partner="coupang" />

      <p className="mt-3 text-[15px] leading-[1.85] text-ink-soft">
        <b className="font-bold text-ink">{c.area} {c.city}</b>에서 아이와 반나절 보내기 좋은 코스예요.
        <b className="font-bold text-ink"> {c.spot.title}</b>에서 신나게 놀고
        {c.park && <> , 가까운 <b className="font-bold text-ink">{c.park.title}</b>에서 잠깐 걷다가</>}
        {c.food && <> <b className="font-bold text-ink">{c.food.title}</b>에서 아이가 좋아하는 음식으로 마무리</>}해요.
        {" "}세 곳이 차로 가까이 모여 있어 이동에 힘 빼지 않아도 돼요.
      </p>

      {/* 코스 한눈에 */}
      <div className="mt-5 rounded-2xl bg-panel px-4 py-4 sm:px-5">
        <h2 className="mb-2 text-[15px] font-extrabold text-ink">🧭 코스 한눈에 보기</h2>
        <ol className="space-y-1.5 text-[14px]">
          <li className="flex gap-2"><span>①</span><span><b className="font-bold text-ink">{th.emoji} {c.spot.title}</b> <span className="text-ink-faint">— 출발, 아이랑 놀기</span></span></li>
          {c.park && <li className="flex gap-2"><span>②</span><span><b className="font-bold text-ink">🌳 {c.park.title}</b> <span className="text-ink-faint">— {kmLabel(c.park.distKm)}, 산책</span></span></li>}
          {c.food && <li className="flex gap-2"><span>{c.park ? "③" : "②"}</span><span><b className="font-bold text-ink">🍽 {c.food.title}</b> <span className="text-ink-faint">— {kmLabel(c.food.distKm)}, 밥먹기</span></span></li>}
        </ol>
      </div>

      <Stop stop={c.spot} label={`1. ${th.label}`} emoji={th.emoji} intro={`${c.spot.addr}에 있어요. 이 코스의 출발점으로, 아이와 여기서 충분히 논 뒤 근처로 이동하면 동선이 자연스러워요.`} />
      {c.park && <Stop stop={c.park} label="2. 공원 산책" emoji="🌳" fromTitle={c.spot.title} intro={`명소에서 ${kmLabel(c.park.distKm)}, 차로 금방이에요. 실컷 논 뒤 아이와 천천히 걷고 뛰어놀기 좋은 곳이에요.`} />}
      {c.food && <Stop stop={c.food} label={c.park ? "3. 아이 맛집" : "2. 아이 맛집"} emoji="🍽" fromTitle={c.park ? c.park.title : c.spot.title} intro={`${kmLabel(c.food.distKm)} 거리예요. 아이가 좋아할 만한 메뉴로 하루를 마무리하기 좋아요. 방문 전 영업시간은 확인해 주세요.`} />}

      {/* 쿠팡 상품 (숙소 광고 없음 — 쿠팡만) */}
      <div className="mt-10 border-t border-line pt-8">
        <h2 className="mb-4 text-[19px] font-extrabold text-ink">🛒 아이와 나들이, 이런 것도 챙겨요</h2>
        <KidCoupangDeals />
      </div>

      {related.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <h2 className="mb-3 text-[17px] font-extrabold text-ink">{c.area} {th.label} 다른 코스</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/kids/c/${r.id}`} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 transition hover:border-free/40">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[14px] font-bold text-ink">{th.emoji} {kidHeadline(r.theme, r.spot.title)}</b>
                    <span className="mt-0.5 block truncate text-[12px] text-ink-faint">📍 {r.city}{r.food ? ` · 🍽 ${r.food.title}` : ""}</span>
                  </span>
                  <span className="shrink-0 text-[15px] font-bold text-free">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/kids" className="mt-4 inline-flex rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free">아이와 함께 코스 전체 보기 →</Link>
        </section>
      )}

      <p className="mt-8 text-[12px] text-ink-faint">아이와 함께 코스 {total.toLocaleString()}개 중 하나예요 · 코스는 좌표 거리로 자동 구성했고, 영업시간·휴무는 방문 전 확인을 권해요 · 정보 제공: 한국관광공사</p>
    </Container>
  );
}
