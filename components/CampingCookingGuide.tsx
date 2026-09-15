import Link from 'next/link';

export default function CampingCookingGuide({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`rounded-2xl border border-amber-200 bg-amber-50/70 ${compact ? 'mt-8 p-4' : 'border-x-0 rounded-none px-4 py-6 sm:px-6'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-black tracking-wide text-amber-800">CAMPING COOKING GUIDE</p>
          <h2 className="mt-1 text-[18px] font-black tracking-[-0.02em] text-ink">캠핑요리 준비하기</h2>
          <p className="mt-1 text-[13px] leading-6 text-ink-soft">국물요리·볶음요리·볶음밥·찌개별 준비물과 조리 순서를 골라보세요.</p>
        </div>
        <Link href="/camping/cooking" className="shrink-0 rounded-full bg-amber-700 px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-amber-800">
          요리 가이드 보기 →
        </Link>
      </div>
    </section>
  );
}
