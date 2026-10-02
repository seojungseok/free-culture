"use client";

import { useEffect, useState } from "react";
import type { VisitCheck } from "@/lib/visitPlanning";

export default function VisitChecklist({ pageId, items }: { pageId: string; items: VisitCheck[] }) {
  const [checked, setChecked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const key = `mwohaji:visit-checks:v1:${pageId}`;
  const signature = JSON.stringify(items);
  useEffect(() => {
    let saved: string[] = [];
    try {
      const data = JSON.parse(localStorage.getItem(key) || "null");
      if (data?.signature === signature && Array.isArray(data.checked)) saved = data.checked.filter((id: unknown) => typeof id === "string" && items.some((item) => item.id === id));
    } catch { /* Checks still work when storage is unavailable. */ }
    setChecked(saved);
    setLoaded(true);
  }, [key, signature, items]);
  function update(next: string[]) {
    setChecked(next);
    try { localStorage.setItem(key, JSON.stringify({ signature, checked: next })); } catch { /* Optional persistence. */ }
  }
  return <section className="mt-6 rounded-2xl border border-free/20 bg-tint/40 p-4 sm:p-5" aria-label="방문 전 체크리스트">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-[17px] font-extrabold text-ink">방문 전 체크리스트</h2>
      <span className="text-[12px] font-semibold text-ink-faint" aria-live="polite">{checked.length}/{items.length} 확인</span>
    </div>
    <p className="mt-1 text-[12px] leading-5 text-ink-soft">안내 정보를 읽고 필요한 조건을 확인한 뒤 체크하세요. 체크 기록은 이 브라우저에 저장됩니다.</p>
    <div className="mt-3 space-y-2">
      {items.map((item) => <label key={item.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-white p-3">
        <input type="checkbox" checked={checked.includes(item.id)} disabled={!loaded} onChange={(event) => update(event.target.checked ? [...checked, item.id] : checked.filter((id) => id !== item.id))} className="mt-1 h-5 w-5 shrink-0 accent-[#07856f]" />
        <span className="min-w-0"><span className="block text-[14px] font-bold text-ink">{item.title}</span><span className="mt-1 block whitespace-pre-line break-words text-[13px] leading-6 text-ink-soft">{item.detail}</span></span>
      </label>)}
    </div>
    {checked.length > 0 && <button type="button" onClick={() => update([])} className="mt-2 min-h-11 px-2 text-[12px] font-semibold text-ink-faint underline underline-offset-2">체크 초기화</button>}
  </section>;
}
