import Image from 'next/image';
import Link from 'next/link';
import { getPrepArticles } from '@/lib/weekend-prep/data';

const CHECKLIST_SLUGS = new Set([
  'autumn-flower-crab-soup-ingredient-checklist',
  'camping-fishcake-soup-ingredient-checklist',
  'camping-budae-jjigae-ingredient-checklist',
  'camping-beef-mushroom-hotpot-ingredient-checklist',
  'camping-seafood-hotpot-ingredient-checklist',
]);

export default function CampingSoupChecklistLinks({ compact = false }: { compact?: boolean }) {
  const articles = getPrepArticles().filter((article) => CHECKLIST_SLUGS.has(article.slug));
  if (!articles.length) return null;

  if (compact) {
    return (
      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <h2 className="text-[16px] font-extrabold text-ink">🍲 캠핑 가기 전, 국물요리 재료 확인</h2>
        <p className="mt-1 text-[13px] leading-6 text-ink-soft">체크한 재료는 지워지고, 빠진 재료만 바로 주문할 수 있어요.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {articles.map((article) => (
            <Link key={article.slug} href={`/weekend-prep/${article.slug}`} className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[12.5px] font-bold text-ink-soft transition hover:border-amber-400 hover:text-amber-800">
              {article.coverLabel || article.title} →
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-amber-100 bg-amber-50/50">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-black tracking-[-0.02em] text-ink">가을 캠핑 국물요리 준비물</h2>
            <p className="mt-1 text-[13px] text-ink-soft">요리재료부터 냄비까지, 출발 전에 체크하세요.</p>
          </div>
          <Link href="/weekend-prep?category=%EC%9A%94%EB%A6%AC+%EC%A4%80%EB%B9%84%EB%AC%BC" className="shrink-0 text-[12.5px] font-bold text-amber-800">전체 보기 →</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {articles.map((article) => (
            <Link key={article.slug} href={`/weekend-prep/${article.slug}`} className="group overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <Image src={article.cover.url} alt={article.cover.alt} width={article.cover.width} height={article.cover.height} sizes="(max-width:640px) 50vw,220px" className="aspect-[3/2] w-full object-cover" />
              <span className="block px-3 py-2.5 text-[13px] font-extrabold leading-5 text-ink group-hover:text-amber-800">{article.coverLabel || article.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
