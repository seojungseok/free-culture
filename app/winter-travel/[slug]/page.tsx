import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicWinterCourses, getWinterCourse } from '@/lib/winterCourses';
import { SITE } from '@/lib/site';
import { winterCourseImage } from '@/lib/winterCourseImage.mjs';
import TossAffiliate from '@/components/TossAffiliate';

export const revalidate = 3600;
// Data is deployed by rebuilding the site. Unknown and held slugs are not routes.
export const dynamicParams = false;
export function generateStaticParams() { return getPublicWinterCourses().map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = getWinterCourse(slug);
  if (!course) return { robots: { index: false, follow: true } };
  const photo = winterCourseImage(course);
  return { title: course.title, description: course.intro.slice(0, 155), alternates: { canonical: `/winter-travel/${slug}` }, openGraph: { type: 'article', title: course.title, description: course.intro.slice(0, 155), ...(photo ? { images: [{ url: photo.src, alt: photo.alt }] } : {}) } };
}

function safeSourceUrl(value: string): string | null {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}

export default async function WinterCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getWinterCourse(slug);
  if (!course) notFound();
  const canonical = `${SITE.url}/winter-travel/${course.slug}`;
  const breadcrumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: SITE.url },
    { '@type': 'ListItem', position: 2, name: '겨울 여행지', item: `${SITE.url}/winter-travel` },
    { '@type': 'ListItem', position: 3, name: course.title, item: canonical },
  ] };
  const photo = winterCourseImage(course);
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: course.title, description: course.intro, datePublished: course.publishedAt, mainEntityOfPage: canonical, ...(photo ? { image: new URL(photo.src, SITE.url).href } : {}), publisher: { '@type': 'Organization', name: SITE.name } };
  const json = (value: object) => JSON.stringify(value).replace(/</g, '\\u003c');
  const days = course.duration === '당일' ? [1] : [1, 2];
  return <article className="mx-auto max-w-[820px] px-5 pb-16 pt-6 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(breadcrumbs) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(article) }} />
    <nav aria-label="현재 위치" className="text-sm text-ink-soft"><Link href="/" className="hover:underline">홈</Link> / <Link href="/winter-travel" className="hover:underline">겨울 여행지</Link> / <span aria-current="page">{course.title}</span></nav>
    <p className="mt-6 text-sm font-bold text-brandblue">{course.area} · {course.duration === '당일' ? '당일치기' : '1박 2일'}</p>
    <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl">{course.title}</h1>
    <p className="mt-4 text-base leading-8 text-ink-soft">{course.intro}</p>
    {photo && <figure className="mt-6"><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} className="h-auto w-full rounded-2xl" /><figcaption className="mt-2 text-xs leading-5 text-ink-soft">{photo.kind === 'ai' ? 'AI 연출 · ' : ''}{photo.caption} · {photo.credit}</figcaption></figure>}
    <section className="mt-8 rounded-2xl bg-[#f4f8fd] p-5 sm:p-6" aria-labelledby="winter-plan-title"><h2 id="winter-plan-title" className="text-xl font-black text-ink">방문 순서</h2><p className="mt-2 text-sm leading-6 text-ink-soft">표시 순서는 여행 계획을 위한 제안입니다. 도로·대중교통 경로와 실제 이동시간은 출발 전 확인해 주세요.</p>{days.map((day) => <div key={day} className="mt-5"><h3 className="font-extrabold text-ink">{course.duration === '당일' ? '당일 코스' : `${day}일차`}</h3><ol className="mt-2 space-y-2">{course.stops.filter((stop) => stop.day === day).map((stop, index) => { const official = stop.officialUrl ? safeSourceUrl(stop.officialUrl) : null; return <li key={stop.placeId} className="flex gap-3 rounded-xl bg-white p-3"><span className="font-black text-brandblue">{index + 1}</span><span className="min-w-0">{official ? <a href={official} target="_blank" rel="noopener noreferrer" className="font-bold text-ink hover:underline">{stop.name} <span className="text-xs font-normal text-ink-soft">공식 안내 ↗</span></a> : stop.officialUrl ? <span className="font-bold text-ink">{stop.name}</span> : <Link href={`/places/spot/${stop.placeId}`} className="font-bold text-ink hover:underline">{stop.name}</Link>}{stop.addr && <span className="mt-1 block break-words text-sm text-ink-soft">{stop.addr}</span>}</span></li>; })}</ol></div>)}</section>
    <TossAffiliate position="article" />
    {course.sections.map((section, index) => <section key={`${section.heading}-${index}`} className="mt-8"><h2 className="text-xl font-black text-ink">{section.heading}</h2>{section.paragraphs.map((paragraph, i) => <p key={i} className="mt-3 whitespace-pre-line text-[15px] leading-8 text-ink-soft">{paragraph}</p>)}</section>)}
    <aside className="mt-9 rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-ink-soft"><h2 className="font-extrabold text-ink">방문 전 확인해 주세요</h2><p className="mt-2">겨울철 날씨·도로 상태와 시설 운영일, 휴무, 예약 및 요금은 달라질 수 있습니다. 각 장소의 공식 안내를 확인하고 이동 경로를 조정해 주세요.</p><p className="mt-2">장소와 코스 정보는 한국관광공사의 저장 자료를 바탕으로 작성했습니다. 자료 수집 시점이 현재 운영 상태를 보장하지는 않습니다.</p>{(course.sources || []).map((source) => { const url = safeSourceUrl(source.url); return url ? <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all font-semibold text-brandblue underline">{source.title} ↗</a> : null; })}</aside>
    <Link href="/winter-travel" className="mt-7 inline-flex min-h-11 items-center font-bold text-brandblue">← 겨울 여행코스 목록</Link>
  </article>;
}
