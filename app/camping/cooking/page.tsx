import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/Band';
import CampingCookingGuide from '@/components/CampingCookingGuide';
import { COOKING_CATEGORIES, cookingCategory, getPrepArticles, isCookingPrepArticle, type CookingCategory } from '@/lib/weekend-prep/data';
import type { PrepArticle } from '@/lib/weekend-prep/types';

export const revalidate = 86400;
export const metadata: Metadata = {
  title: '캠핑요리 준비하기 | 국물요리·볶음요리·볶음밥·찌개',
  description: '캠핑에서 만들 요리를 국물요리·볶음요리·볶음밥·찌개로 나누어 재료 체크리스트와 조리 가이드를 확인하세요.',
  alternates: { canonical: '/camping/cooking' },
};

const CATEGORIES: CookingCategory[] = COOKING_CATEGORIES;

function CookingCard({ article }: { article: PrepArticle }) {
  return <Link href={`/weekend-prep/${article.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <img src={article.cover.url} alt={article.cover.alt} loading="lazy" className="aspect-[3/2] w-full object-cover" />
    <div className="p-4"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">{cookingCategory(article)}</span><h2 className="mt-3 text-[16px] font-black leading-6 text-ink group-hover:text-free">{article.title}</h2><p className="mt-2 line-clamp-2 text-[13px] leading-5 text-ink-soft">{article.description}</p><span className="mt-3 block text-[13px] font-bold text-free">준비가이드에서 확인 →</span></div>
  </Link>;
}

export default function CampingCookingPage() {
  const articles = getPrepArticles().filter(isCookingPrepArticle);
  return <main className="min-h-screen bg-[#fffdfa] pb-16"><Container className="pt-6"><nav className="mb-4 text-[12.5px] text-ink-faint"><Link href="/camping" className="hover:text-free">캠핑</Link><span className="mx-1.5">›</span><span>캠핑요리 준비하기</span></nav><h1 className="text-[28px] font-black tracking-[-0.03em] text-ink sm:text-[36px]">캠핑요리 준비하기</h1><p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">캠핑 음식은 메뉴를 먼저 정하고, 필요한 재료와 조리 도구를 함께 챙기면 준비가 쉬워져요. 메뉴별 체크리스트는 주말 준비가이드에서 이어서 확인할 수 있습니다.</p><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">{CATEGORIES.map(category => <a key={category} href={`#${category}`} className="rounded-xl border border-amber-200 bg-white px-3 py-3 text-center text-[13px] font-extrabold text-amber-900 hover:bg-amber-50">{category}<span className="mt-1 block text-[11px] font-normal text-ink-faint">{articles.filter(a => cookingCategory(a) === category).length}개</span></a>)}</div></Container><div className="mx-auto mt-7 max-w-[1180px] px-4 sm:px-6">{CATEGORIES.map(category => { const list = articles.filter(a => cookingCategory(a) === category); return <section id={category} key={category} className="mb-10 scroll-mt-6"><h2 className="mb-3 text-[21px] font-black text-ink">{category}</h2>{list.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(article => <CookingCard key={article.slug} article={article} />)}</div> : <p className="rounded-xl border border-dashed border-line p-5 text-sm text-ink-faint">이 분류의 준비가이드를 준비하고 있어요.</p>}</section>; })}</div><CampingCookingGuide compact /></main>;
}
