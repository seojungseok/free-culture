import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Band";
import CourseArticleBody from "@/components/CourseArticleBody";
import CourseCard from "@/components/CourseCard";
import CourseShare from "@/components/CourseShare";
import {
  getAllCourses, getCourse, relatedCourses, durationLabel, themeEmoji, areaSlug, slimCourse, courseCentroid, courseCity, courseDays, courseFoodStops,
} from "@/lib/courses";
import { coursesNearbyFood, distanceLabel, foodTypeLabel, distanceKm } from "@/lib/nearby";
import { areaFestivals, fmtMd } from "@/lib/festivals";
import { SITE } from "@/lib/site";

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllCourses().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getCourse(id);
  if (!c) return {};
  const desc = c.content.replace(/[#*>`-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
  return {
    title: `${c.title} — ${c.area} ${durationLabel(c.duration)} 여행코스`,
    description: desc || `${c.area} ${durationLabel(c.duration)} 여행코스. ${c.stops.map((s) => s.name).slice(0, 4).join(", ")} 등을 잇는 여행 일정.`,
    keywords: [`${c.area} 여행코스`, `${c.area} ${durationLabel(c.duration)}`, ...c.stops.slice(0, 3).map((s) => s.name)],
    alternates: { canonical: `/course/c/${id}` },
    openGraph: { title: c.title, description: desc, images: c.image ? [c.image] : [], type: "article" },
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCourse(id);
  if (!c) notFound();

  const canonical = `${SITE.url}/course/c/${id}`;
  const slug = areaSlug(c.area);
  const related = relatedCourses(c, 4).map(slimCourse);
  const mapStops = c.stops.filter((s) => s.name);
  // 근처 맛집(내부링크) — 좌표 있으면 거리순, 없으면 코스 도시(주소) 기준. 음식점 데이터 있는 지역만.
  const centroid = courseCentroid(c);
  const city = courseCity(c);
  const coordFood = coursesNearbyFood({ area: c.area, city, mapx: centroid?.mapx, mapy: centroid?.mapy }, 6);
  // 코스가 안내하는 식당(영빈관횟집 등)을 먼저, 그 뒤 좌표 근처 맛집. 상세 없으면 카카오맵 검색으로 연결.
  const courseFoods = c.format === "list" ? [] : courseFoodStops(c).map((s) => ({
    id: s.placeId || s.name, title: s.name, image: s.image, addr: s.addr || "", cat3: "",
    mapx: s.mapx || "", mapy: s.mapy || "",
    href: s.placeId ? `/places/spot/${s.placeId}` : `https://map.kakao.com/link/search/${encodeURIComponent(`${c.area} ${s.name}`)}`,
    onCourse: true, dist: undefined as number | undefined,
  }));
  const nearFood = [
    ...courseFoods,
    ...coordFood.filter((r) => !courseFoods.some((f) => f.title === r.title)).map((r) => ({
      id: r.id, title: r.title, image: r.image, addr: r.addr, cat3: r.cat3 || "",
      mapx: r.mapx || "", mapy: r.mapy || "",
      href: `/places/spot/${r.id}`, onCourse: false, dist: r.dist as number | undefined,
    })),
  ].slice(0, 8);
  // 각 맛집을 "가장 가까운 코스 스팟" 기준으로 라벨 (예: "경포해변 근처"). 좌표 있는 스팟만.
  const stopsWithCoord = c.stops.filter((s) => s.mapx && s.mapy);
  const nearStopName = (r: { mapx?: string; mapy?: string }): string => {
    let best = "", bd = Infinity;
    for (const s of stopsWithCoord) { const d = distanceKm(r, s); if (d < bd) { bd = d; best = s.name; } }
    return best && bd <= 8 ? best : "";
  };
  const festivals = areaFestivals(c.area, { limit: 4 }); // 보는 시점 날짜 연동
  const days = courseDays(c); // 일차별 분할(하루 3~4곳)

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.title,
    numberOfItems: mapStops.length,
    itemListElement: mapStops.map((s, i) => ({
      "@type": "ListItem", position: i + 1, name: s.name,
    })),
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    image: [c.image, ...c.stops.map((s) => s.image).filter(Boolean)].filter(Boolean).slice(0, 6),
    ...(c.publishedAt ? { datePublished: c.publishedAt, dateModified: c.publishedAt } : {}),
    articleSection: `${c.area} 여행코스`,
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: canonical,
    description: c.content.replace(/[#*>`-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "여행코스", item: `${SITE.url}/course` },
      { "@type": "ListItem", position: 2, name: c.area, item: `${SITE.url}/course/${slug}` },
      { "@type": "ListItem", position: 3, name: c.title, item: canonical },
    ],
  };

  return (
    <Container className="max-w-[820px] pb-16 pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12.5px] text-ink-faint">
        <Link href="/course" className="hover:text-free">여행코스</Link>
        <span>›</span>
        <Link href={`/course/${slug}`} className="hover:text-free">{c.area}</Link>
      </nav>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-free px-2.5 py-0.5 text-[11px] font-black text-white">{durationLabel(c.duration)}</span>
        <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-freedark">{c.area}</span>
        {(c.themes || []).slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
            {themeEmoji(t)} {t === "바다피서" ? "바다·피서" : t === "문화유적" ? "문화유적" : t === "자연힐링" ? "자연·힐링" : t === "가족체험" ? "가족·체험" : "맛집"}
          </span>
        ))}
        <span className="text-[12px] text-ink-faint">· 📍 {c.stopCount}곳</span>
      </div>

      <div className="mt-1 flex items-start justify-between gap-3">
        <h1 className="text-[24px] font-black leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">{c.title}</h1>
        <div className="mt-1 flex-none">
          <CourseShare title={c.title} compact />
        </div>
      </div>

      {c.image && (
        <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
          <Image src={c.image} alt={c.title} fill sizes="(max-width:820px) 100vw, 820px" className="object-cover" priority unoptimized />
        </div>
      )}

      {/* 블로그 글 — 각 스팟 소제목 뒤에 사진 삽입 */}
      <CourseArticleBody content={c.content} stops={c.stops} />

      {/* 코스 한눈에 보기 — 일차별로 묶어 장소명 표기 (하루 3~4곳) */}
      {mapStops.length > 0 && (
        <section className="mt-9 rounded-2xl bg-panel px-4 py-5 sm:px-5">
          <h2 className="mb-3 text-[17px] font-extrabold tracking-tight text-ink sm:text-[18px]">{c.format === "list" ? "🏖 해수욕장 목록" : "🧭 코스 한눈에 보기"}</h2>
          <div className="space-y-3">
            {days.map((dayStops, di) => (
              <div key={di}>
                {days.length > 1 && (
                  <p className="mb-1.5 text-[13px] font-black text-free">{di + 1}일차</p>
                )}
                <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
                  {dayStops.map((s, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-ink ring-1 ring-line">
                        <span className="text-[11px] font-black text-free">{i + 1}</span>
                        {s.name}
                      </span>
                      {i < dayStops.length - 1 && c.format !== "list" && <span className="text-ink-faint">→</span>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          {centroid && (
            <a href={`https://map.kakao.com/link/map/${encodeURIComponent(c.title)},${centroid.mapy},${centroid.mapx}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-freedark ring-1 ring-line transition hover:bg-tint">
              🗺 지도에서 코스 위치 보기
            </a>
          )}
        </section>
      )}

      {/* 근처 맛집 — 코스 좌표 기준, 내부링크. 해수욕장 베스트(리스트형)엔 맛집 표시 안 함. */}
      {nearFood.length > 0 && c.format !== "list" && (
        <section className="mt-9">
          <h2 className="mb-1 text-[19px] font-extrabold tracking-tight text-ink sm:text-[20px]">🍽 이 코스 근처 맛집</h2>
          <p className="mb-4 text-[13px] text-ink-faint">코스 동선 근처에서 한 끼 하기 좋은 곳이에요</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {nearFood.map((r) => {
              const ext = r.href.startsWith("http");
              return (
              <Link key={r.id} href={r.href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-sm transition hover:-translate-y-0.5 hover:shadow-cardhover">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                  {r.image ? (
                    <Image src={r.image} alt={r.title} fill sizes="(max-width:640px) 50vw, 260px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-ink-faint">🍽</div>
                  )}
                  {r.onCourse ? (
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-free px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">코스 추천</span>
                  ) : r.cat3 ? (
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{foodTypeLabel({ cat3: r.cat3 } as never)}</span>
                  ) : null}
                </div>
                <div className="px-2.5 pb-2.5 pt-2">
                  <h3 className="line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{r.title}</h3>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">
                    {r.onCourse ? "코스에서 안내하는 맛집" : nearStopName(r) ? `${nearStopName(r)} 근처` : typeof r.dist === "number" ? `코스에서 ${distanceLabel(r.dist)}` : r.addr}
                  </p>
                </div>
              </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 지역 축제·행사 — 보는 시점 날짜 연동(매일 수집). 눈에 띄는 별도 칸으로 강조 */}
      {festivals.length > 0 && (
        <section className="mt-9 rounded-2xl border-2 border-free/25 bg-freelight/60 px-4 py-5 sm:px-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-free px-2.5 py-1 text-[11px] font-black text-white">지금 이맘때</span>
            <h2 className="text-[18px] font-extrabold tracking-tight text-ink sm:text-[20px]">🎪 {c.area} 축제·행사</h2>
          </div>
          <p className="mb-4 text-[13px] text-ink-soft">여행 날짜에 열리는 축제예요 — 제철 먹거리가 있다면 아래 <b>근처 맛집</b>과 함께 즐겨보세요! (날짜별 자동 갱신)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {festivals.map((f) => (
              <Link key={f.id} href={`/search?q=${encodeURIComponent(f.title)}`} className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-sm transition hover:-translate-y-0.5 hover:shadow-cardhover">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                  {f.image ? (
                    <Image src={f.image} alt={f.title} fill sizes="(max-width:640px) 50vw, 200px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-ink-faint">🎪</div>
                  )}
                  <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm ${f.ongoing ? "bg-free" : "bg-black/55"}`}>
                    {f.ongoing ? "진행 중" : "예정"}
                  </span>
                </div>
                <div className="px-2.5 pb-2.5 pt-2">
                  <h3 className="line-clamp-2 text-[13.5px] font-bold text-ink group-hover:text-free">{f.title}</h3>
                  <p className="mt-0.5 text-[12px] text-ink-faint">{fmtMd(f.startDate)}–{fmtMd(f.endDate)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 공유 유도 — 이 코스가 마음에 들면 쉽게 공유 */}
      <div className="mt-9 flex flex-col items-center gap-2 rounded-2xl bg-panel px-5 py-6 text-center">
        <p className="text-[14px] font-bold text-ink">이 코스가 마음에 드셨나요?</p>
        <p className="text-[12.5px] text-ink-faint">친구·가족에게 여행 코스를 공유해 보세요</p>
        <div className="mt-1">
          <CourseShare title={c.title} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <h2 className="mb-3 text-[17px] font-extrabold text-ink">이런 코스도 어때요?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((r) => <CourseCard key={r.id} course={r} />)}
          </div>
        </section>
      )}
    </Container>
  );
}
