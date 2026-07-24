"use client";

import { useEffect, useState } from "react";

// 무료 키리스 카운터(abacus.jasoncameron.dev) 사용.
// - 개인정보/IP 저장하지 않음 (익명 카운트만)
// - 같은 세션 내 새로고침은 중복 집계하지 않음 (sessionStorage 플래그)
// - 카운터 서비스가 죽어도 렌더링 실패 없이 조용히 숨김
// 나중에 신뢰도가 필요하면 Supabase/Vercel KV로 교체 가능.

const NS = "weekendpick-kr";
const BASE = "https://abacus.jasoncameron.dev";

export default function VisitorCount() {
  const [data, setData] = useState<{ today: number; total: number } | null>(null);

  useEffect(() => {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const day = now.toISOString().slice(0, 10).replace(/-/g, "");
    const flag = `vc_${day}`;
    const firstThisSession = !sessionStorage.getItem(flag);
    const verb = firstThisSession ? "hit" : "get"; // hit=증가, get=조회만

    Promise.all([
      fetch(`${BASE}/${verb}/${NS}/total`).then((r) => r.json()),
      fetch(`${BASE}/${verb}/${NS}/d${day}`).then((r) => r.json()),
    ])
      .then(([t, d]) => {
        if (firstThisSession) sessionStorage.setItem(flag, "1");
        if (typeof t?.value === "number" && typeof d?.value === "number")
          setData({ total: t.value, today: d.value });
      })
      .catch(() => {
        /* 카운터 실패 시 조용히 숨김 */
      });
  }, []);

  if (!data) return null;
  return (
    <span className="tabular-nums">
      오늘 {data.today.toLocaleString()} · 전체 {data.total.toLocaleString()}
    </span>
  );
}
