'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { WinterCourse } from '@/lib/winterCourses';
import { winterCourseImage } from '@/lib/winterCourseImage.mjs';

export default function WinterCourseBrowser({ courses }: { courses: WinterCourse[] }) {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('');
  const [duration, setDuration] = useState('');
  const areas = useMemo(() => [...new Set(courses.map((course) => course.area))].sort((a, b) => a.localeCompare(b, 'ko')), [courses]);
  const matching = courses.filter((course) => {
    const term = query.trim().toLowerCase();
    const text = [course.title, course.area, ...course.stops.map((stop) => stop.name)].join(' ').toLowerCase();
    return (!term || text.includes(term)) && (!area || course.area === area) && (!duration || course.duration === duration);
  });
  return <section aria-labelledby="winter-list-title" className="mx-auto max-w-[1120px] px-5 pb-16 pt-8 sm:px-6">
    <h2 id="winter-list-title" className="text-xl font-black text-ink">겨울 여행코스 찾기</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <label className="text-sm font-bold text-ink">지역·장소 검색<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="예: 강릉, 박물관" className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal" /></label>
      <label className="text-sm font-bold text-ink">지역<select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal"><option value="">전체 지역</option>{areas.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="text-sm font-bold text-ink">여행 기간<select value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal"><option value="">전체 기간</option><option value="당일">당일치기</option><option value="1박2일">1박 2일</option></select></label>
    </div>
    <p role="status" aria-live="polite" className="mt-5 text-sm font-semibold text-ink-soft">{courses.length ? `조건에 맞는 코스 ${matching.length}개` : '검토를 마친 겨울 여행코스를 준비하고 있습니다.'}</p>
    {matching.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{matching.map((course) => { const photo = winterCourseImage(course); return <article key={course.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{photo && <figure><Link href={`/winter-travel/${course.slug}`} tabIndex={-1} aria-hidden="true"><img src={photo.src} alt="" width={photo.width} height={photo.height} loading="lazy" className="h-auto w-full" /></Link><figcaption className="px-5 pt-2 text-xs text-ink-soft">{photo.kind === 'ai' ? 'AI 연출 · ' : ''}{photo.caption} · {photo.credit}</figcaption></figure>}<div className="p-5"><p className="text-xs font-bold text-brandblue">{course.area} · {course.duration === '당일' ? '당일치기' : '1박 2일'}</p><h3 className="mt-2 text-lg font-extrabold leading-snug text-ink"><Link href={`/winter-travel/${course.slug}`} className="hover:underline">{course.title}</Link></h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-soft">{course.intro}</p><p className="mt-4 text-sm leading-6 text-ink-soft">{course.stops.map((stop) => stop.name).join(' → ')}</p><Link href={`/winter-travel/${course.slug}`} className="mt-3 inline-flex min-h-11 items-center font-bold text-brandblue">코스 자세히 보기 →</Link></div></article>; })}</div> : courses.length ? <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-ink-soft">조건에 맞는 코스가 없습니다. 지역이나 기간을 바꿔 보세요.</p> : <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-ink-soft"><p>운영 정보와 이동 동선을 확인한 뒤 이곳에 공개합니다.</p><Link href="/course" className="mt-2 inline-flex min-h-11 items-center font-bold text-brandblue">기존 여행코스 둘러보기 →</Link></div>}
  </section>;
}
