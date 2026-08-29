type GuidanceProps = {
  recommended: string[];
  checks: string[];
  tips: string[];
};

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-7 rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-3 text-[17px] font-extrabold text-ink">{title}</h2>
      <ul className="space-y-2 text-[14px] leading-[1.75] text-ink-soft">
        {items.map((item) => <li key={item} className="flex gap-2"><span className="text-free">•</span><span>{item}</span></li>)}
      </ul>
    </section>
  );
}

export default function DetailGuidance({ recommended, checks, tips }: GuidanceProps) {
  return <><Block title="이런 분께 추천해요" items={recommended} /><Block title="방문 전 체크" items={checks} /><Block title="이용 팁" items={tips} /></>;
}
