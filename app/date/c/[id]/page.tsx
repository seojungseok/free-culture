import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Band";
import AffiliateNotice from "@/components/AffiliateNotice";
import CoupangBanner from "@/components/CoupangBanner";
import { fetchPlaceOverview } from "@/lib/tourDetail";
import { getRestaurantMenu, restaurantIntroRows } from "@/lib/tourExtra";
import { getDateCourse, getDateCourses, dateCoursesByArea, distLabel, type CourseStop } from "@/lib/dateCourses";
import { SIDO_SLUG } from "@/lib/classify";
import { SITE } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 2592000; // 30일 — 좌표·구성은 거의 안 바뀜

export function generateStaticParams() {
  return []; // 온디맨드 생성 후 캐시(빌드 시간 절약)
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getDateCourse(id);
  if (!c) return { title: "코스를 찾을 수 없습니다" };
  const title = `${c.cafe.title} 카페데이트 — ${c.area} ${c.city} 카페·공원·맛집 코스`;
  const menu = getRestaurantMenu(c.food.id);
  const menuHead = menu ? menu.split(" / ")[0] : "";
  const description = `${c.area} ${c.city} 카페데이트 코스. ${c.cafe.title}에서 커피 한잔 하고 ${distLabel(c.park.distKm)} 거리의 ${c.park.title}을 걷다가 ${c.food.title}${menuHead ? `(${menuHead})` : ""}에서 식사까지. 세 곳이 ${distLabel(c.totalKm)} 안에 모여 있어 반나절이면 충분해요.`;
  return {
    title,
    description,
    keywords: [
      `${c.city} 카페데이트`,
      `${c.area} 카페데이트`,
      `${c.cafe.title}`,
      `${c.cafe.title} 데이트`,
      `${c.city} 카페 추천`,
      `${c.area} 데이트 코스`,
      ...(menuHead ? [`${c.city} ${menuHead}`, `${c.food.title} ${menuHead}`] : []),
    ],
    alternates: { canonical: `/date/c/${id}` },
    openGraph: { title, description, ...(c.image ? { images: [{ url: c.image }] } : {}), type: "article" },
  };
}

/** 코스 한 지점 — 사진 + 소개 + 이동 정보 */
function StopSection({
  stop, label, emoji, overview, fromTitle, intro, menu, rows,
}: {
  stop: CourseStop; label: string; emoji: string; overview: string; fromTitle?: string; intro: string;
  /** 대표메뉴 / 취급메뉴 (음식점·카페만) */
  menu?: string;
  /** 영업시간·휴무 등 (값 있는 항목만) */
  rows?: { label: string; value: string }[];
}) {
  return (
    <section className="mt-9">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-free px-2.5 py-0.5 text-[11px] font-black text-white">{label}</span>
        {fromTitle && (
          <span className="text-[12.5px] text-ink-faint">
            {fromTitle}에서 {distLabel(stop.distKm)}
          </span>
        )}
      </div>
      <h2 className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[20px]">
        {emoji} {stop.title}
      </h2>

      {stop.image && (
        <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
          <Image src={stop.image} alt={`${stop.title} — ${label}`} fill sizes="(max-width:820px) 100vw, 820px" className="object-cover" loading="lazy" unoptimized />
        </div>
      )}

      <p className="mt-3 text-[15px] leading-[1.85] text-ink-soft">{intro}</p>
      {menu && (
        <p className="mt-3 rounded-xl bg-tint/50 px-4 py-3 text-[14px] leading-[1.7] text-ink-soft">
          🍴 <b className="font-bold text-ink">뭘 먹나요</b> — {menu}
        </p>
      )}
      {overview && (
        <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.85] text-ink-soft">{overview}</p>
      )}
      {rows && rows.length > 0 && (
        <dl className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {rows.map((r) => (
            <div key={r.label} className="flex gap-3 px-4 py-2.5">
              <dt className="w-16 shrink-0 text-[12.5px] font-bold text-ink-faint">{r.label}</dt>
              <dd className="min-w-0 flex-1 whitespace-pre-line text-[13.5px] text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={stop.href} className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink-soft transition hover:border-free/40 hover:text-free">
          {stop.title} 자세히 →
        </Link>
        {stop.mapx && stop.mapy && (
          <a href={`https://map.kakao.com/link/map/${encodeURIComponent(stop.title)},${stop.mapy},${stop.mapx}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink-soft transition hover:border-free/40 hover:text-free">
            🗺 지도
          </a>
        )}
      </div>
    </section>
  );
}

export default async function DateCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getDateCourse(id);
  if (!c) notFound();

  // 세 지점의 소개문 — TourAPI 캐시(ISR 30일). 실패해도 코스 정보는 그대로 나온다.
  const [cafeOv, parkOv, foodOv] = await Promise.all([
    fetchPlaceOverview(c.cafe.id),
    fetchPlaceOverview(c.park.id),
    fetchPlaceOverview(c.food.id),
  ]);
  // 메뉴·영업정보는 수집 캐시에서 (API 호출 없음)
  const cafeMenu = getRestaurantMenu(c.cafe.id);
  const foodMenu = getRestaurantMenu(c.food.id);
  const cafeRows = restaurantIntroRows(c.cafe.id).filter((r) => r.label !== "대표메뉴" && r.label !== "취급메뉴").slice(0, 3);
  const foodRows = restaurantIntroRows(c.food.id).filter((r) => r.label !== "대표메뉴" && r.label !== "취급메뉴").slice(0, 3);

  const areaSlug = (SIDO_SLUG as Record<string, string>)[c.area] || "";
  const canonical = `${SITE.url}/date/c/${id}`;
  const related = dateCoursesByArea(c.area).filter((x) => x.id !== c.id).slice(0, 6);
  const total = getDateCourses().length;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${c.cafe.title} 카페데이트 코스`,
    numberOfItems: 3,
    itemListElement: [c.cafe, c.park, c.food].map((s, i) => ({
      "@type": "ListItem", position: i + 1, name: s.title,
    })),
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${c.cafe.title} 카페데이트 — ${c.area} ${c.city}`,
    image: [c.cafe.image, c.park.image, c.food.image].filter(Boolean),
    articleSection: `${c.area} 카페데이트`,
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: canonical,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "카페데이트", item: `${SITE.url}/date` },
      { "@type": "ListItem", position: 2, name: `${c.area} 카페데이트`, item: `${SITE.url}/date/${areaSlug}` },
      { "@type": "ListItem", position: 3, name: `${c.cafe.title} 코스`, item: canonical },
    ],
  };

  return (
    <Container className="max-w-[820px] pb-16 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
        <Link href="/date" className="hover:text-free">카페데이트</Link>
        <span>›</span>
        {areaSlug ? <Link href={`/date/${areaSlug}`} className="hover:text-free">{c.area}</Link> : <span>{c.area}</span>}
      </nav>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-free px-2.5 py-0.5 text-[11px] font-black text-white">세 곳 {distLabel(c.totalKm)} 안</span>
        <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-freedark">{c.area} {c.city}</span>
        <span className="text-[12px] text-ink-faint">· 총 {distLabel(c.totalKm)}</span>
      </div>

      <h1 className="text-[24px] font-black leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
        {c.cafe.title} 카페데이트 코스
      </h1>
        <AffiliateNotice className="mt-1.5" partner="coupang" />

      <p className="mt-3 text-[15px] leading-[1.85] text-ink-soft">
        <b className="font-bold text-ink">{c.area} {c.city}</b>에서 반나절이면 충분한 카페데이트 코스예요.
        커피 한잔으로 시작해 가까운 <b className="font-bold text-ink">{c.park.title}</b>을 걷고,
        마지막에 <b className="font-bold text-ink">{c.food.title}</b>에서 식사까지 이어집니다.
        세 곳이 <b className="font-bold text-ink">{distLabel(c.totalKm)}</b> 안에 모여 있어 걸어도, 차로 움직여도 부담이 없어요.
        하루를 통째로 비우지 않아도 되는 동선이에요.
      </p>

      {/* 코스 한눈에 */}
      <div className="mt-5 rounded-2xl bg-panel px-4 py-4 sm:px-5">
        <h2 className="mb-2 text-[15px] font-extrabold text-ink">🧭 코스 한눈에 보기</h2>
        <ol className="space-y-1.5 text-[14px]">
          <li className="flex gap-2"><span>①</span><span><b className="font-bold text-ink">☕ {c.cafe.title}</b> <span className="text-ink-faint">— 출발</span></span></li>
          <li className="flex gap-2"><span>②</span><span><b className="font-bold text-ink">🌳 {c.park.title}</b> <span className="text-ink-faint">— 카페에서 {distLabel(c.park.distKm)}</span></span></li>
          <li className="flex gap-2"><span>③</span><span><b className="font-bold text-ink">🍽 {c.food.title}</b> <span className="text-ink-faint">— 공원에서 {distLabel(c.food.distKm)}</span></span></li>
        </ol>
      </div>

      <StopSection
        stop={c.cafe} label="1. 카페" emoji="☕" overview={cafeOv.overview} menu={cafeMenu} rows={cafeRows}
        intro={`${c.cafe.addr}에 있는 카페예요. 이 코스의 출발점으로, 먼저 여기서 커피를 마시며 쉬었다가 걷기 시작하면 동선이 자연스러워요.`}
      />
      <StopSection
        stop={c.park} label="2. 산책" emoji="🌳" overview={parkOv.overview} fromTitle={c.cafe.title}
        intro={`카페 바로 근처, ${distLabel(c.park.distKm)} 거리예요. 커피를 마신 뒤 천천히 둘러보기 좋은 구간이라 이 코스의 가운데에 뒀어요.`}
      />
      <StopSection
        stop={c.food} label="3. 맛집" emoji="🍽" overview={foodOv.overview} fromTitle={c.park.title} menu={foodMenu} rows={foodRows}
        intro={`공원에서 ${distLabel(c.food.distKm)}, 바로 근처예요. 둘러본 뒤 식사로 마무리하기 좋은 위치예요.${foodMenu ? ` 대표메뉴는 ${foodMenu.split(" / ")[0]}이에요.` : ""}`}
      />

      {/* 관심 기반 제휴 배너 (쿠팡 파트너스) */}
      <div className="mt-9">
        <CoupangBanner />
      </div>

      {related.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <h2 className="mb-3 text-[17px] font-extrabold text-ink">{c.area} 카페데이트 다른 코스</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/date/c/${r.id}`} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] transition hover:border-free/40">
                  <span className="min-w-0 flex-1">
                    <b className="font-bold text-ink">{r.cafe.title}</b>
                    <span className="ml-1.5 text-[12.5px] text-ink-faint">{r.city} · {r.park.title} · {r.food.title}</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] font-semibold text-free">{distLabel(r.totalKm)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`/date/${areaSlug}`} className="mt-4 inline-flex rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-free/40 hover:text-free">
            {c.area} 카페데이트 전체 보기 →
          </Link>
        </section>
      )}

      <p className="mt-8 text-[12px] text-ink-faint">
        전국 카페데이트 코스 {total.toLocaleString()}곳 중 하나예요 · 코스는 좌표 거리로 자동 구성했고, 영업시간·휴무는 방문 전 확인을 권해요 · 정보 제공: 한국관광공사
      </p>
    </Container>
  );
}
