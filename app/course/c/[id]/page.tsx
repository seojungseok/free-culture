import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Band";
import ArticleBody from "@/components/ArticleBody";
import CourseCard from "@/components/CourseCard";
import CourseShare from "@/components/CourseShare";
import {
  getAllCourses, getCourse, relatedCourses, durationLabel, themeEmoji, areaSlug, slimCourse,
} from "@/lib/courses";
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

      {/* 블로그 글 */}
      <ArticleBody content={c.content} />

      {/* 코스 한눈에 보기 — 동선 타임라인 */}
      {mapStops.length > 0 && (
        <section className="mt-9">
          <h2 className="mb-4 text-[19px] font-extrabold tracking-tight text-ink sm:text-[20px]">🧭 코스 한눈에 보기</h2>
          <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
            {mapStops.map((s, i) => (
              <li key={i} className="relative flex gap-3">
                <span className="z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-free text-[13px] font-black text-white shadow-sm">
                  {i + 1}
                </span>
                <div className="flex flex-1 gap-3 rounded-2xl bg-panel p-2.5 ring-1 ring-black/[0.03]">
                  {s.image ? (
                    <div className="relative h-16 w-20 flex-none overflow-hidden rounded-xl bg-neutral-100 sm:h-20 sm:w-28">
                      <Image src={s.image} alt={s.name} fill sizes="112px" className="object-cover" loading="lazy" unoptimized />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 py-0.5">
                    <h3 className="text-[14px] font-bold text-ink sm:text-[15px]">{s.name}</h3>
                    {s.overview ? (
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-[1.5] text-ink-soft">{s.overview}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {c.mapx && c.mapy && (
            <a href={`https://map.kakao.com/link/map/${encodeURIComponent(c.title)},${c.mapy},${c.mapx}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-freedark ring-1 ring-line transition hover:bg-tint">
              🗺 지도에서 코스 위치 보기
            </a>
          )}
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
