"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 벌칙 뽑기 — 세로 슬롯 릴이 드르륵 내려오다 가운데 칸에 '딱' 멈춰요. 멈춘 칸 = 오늘의 벌칙(무조건 일치).
// 원형 룰렛은 각도마다 글씨가 뒤집혀 읽기 어려워서, 글자가 항상 가로로 반듯한 릴 방식으로 설계.
type Pen = { e: string; t: string };
const MILD: Pen[] = [
  { e: "🍺", t: "원샷!" }, { e: "😙", t: "애교 3초" }, { e: "🎤", t: "노래 한 소절" }, { e: "🤝", t: "러브샷" },
  { e: "😂", t: "3초 웃기기" }, { e: "🙅", t: "이번엔 통과!" }, { e: "🗣️", t: "성대모사" }, { e: "👉", t: "옆사람 지목" },
  { e: "🧊", t: "얼음 (1턴 정지)" }, { e: "💃", t: "개인기 하나" },
];
const SPICY: Pen[] = [
  { e: "🍺", t: "두 잔 원샷" }, { e: "💋", t: "러브샷 필수" }, { e: "🎤", t: "노래 완창" }, { e: "😳", t: "흑역사 고백" },
  { e: "🕺", t: "막춤 10초" }, { e: "😘", t: "옆사람 애교" }, { e: "🫣", t: "비밀 하나 공개" }, { e: "🍺", t: "원샷 + 지목" },
  { e: "📸", t: "셀카 벌칙샷" }, { e: "💌", t: "첫사랑 이야기" },
];

const ITEM_H = 62;
const REPEAT = 24;

export default function MissionRoulette() {
  const [spicy, setSpicy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Pen | null>(null);
  const [trans, setTrans] = useState(true);

  const list = spicy ? SPICY : MILD;
  const n = list.length;
  const center = Math.floor(REPEAT / 2) * n;
  const [pos, setPos] = useState(center);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 맛 변경 시 중앙으로 리셋
  useEffect(() => { setTrans(false); setPos(center); setResult(null); requestAnimationFrame(() => setTrans(true)); /* eslint-disable-next-line */ }, [spicy]);
  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); if (doneRef.current) clearTimeout(doneRef.current); }, []);

  const items: Pen[] = [];
  for (let r = 0; r < REPEAT; r++) for (let m = 0; m < n; m++) items.push(list[m]);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    sfx.whoosh();
    const base = pos;
    const i = Math.floor(Math.random() * n);
    const spins = 4 + Math.floor(Math.random() * 3);
    const delta = ((i - (base % n)) + n) % n;
    const pEnd = base + spins * n + delta;
    setTrans(true);
    setPos(pEnd);
    // 드르륵 틱 소리
    if (tickRef.current) clearInterval(tickRef.current);
    let t = 0;
    tickRef.current = setInterval(() => { sfx.tick(); if (++t > 22) tickRef.current && clearInterval(tickRef.current); }, 140);
    if (doneRef.current) clearTimeout(doneRef.current);
    doneRef.current = setTimeout(() => {
      setResult(list[i]);
      setSpinning(false);
      sfx.win();
      // 무한 릴 유지: 중앙 등가 위치로 무전환 리셋(같은 벌칙이라 화면은 그대로)
      setTrans(false);
      setPos(center + i);
      requestAnimationFrame(() => requestAnimationFrame(() => setTrans(true)));
    }, 3600);
  }

  return (
    <div className="mx-auto max-w-[420px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 sm:p-6">
      {/* 맛 선택 */}
      <div className="mb-5 flex items-center justify-center gap-2">
        <button onClick={() => !spinning && setSpicy(false)} className={`rounded-full px-5 py-2 text-[13px] font-black transition ${!spicy ? "bg-cyan-400 text-black" : "bg-white/5 text-white/60"}`}>😊 순한맛</button>
        <button onClick={() => !spinning && setSpicy(true)} className={`rounded-full px-5 py-2 text-[13px] font-black transition ${spicy ? "bg-rose-400 text-black" : "bg-white/5 text-white/60"}`}>🌶️ 매운맛</button>
      </div>

      {/* 슬롯 릴 */}
      <div className="relative mx-auto overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10" style={{ height: ITEM_H * 3 }}>
        {/* 위/아래 페이드 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[62px] bg-gradient-to-b from-[#0b0b18] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[62px] bg-gradient-to-t from-[#0b0b18] to-transparent" />
        {/* 가운데 당첨 프레임 */}
        <div className="pointer-events-none absolute inset-x-2 z-10 rounded-xl ring-2 ring-amber-300/80" style={{ top: ITEM_H, height: ITEM_H }} />
        <div className="pointer-events-none absolute left-0 z-20 -translate-y-1/2" style={{ top: ITEM_H * 1.5 }}>
          <div className="h-0 w-0 border-y-[9px] border-l-[12px] border-y-transparent border-l-amber-300" />
        </div>
        <div className="pointer-events-none absolute right-0 z-20 -translate-y-1/2" style={{ top: ITEM_H * 1.5 }}>
          <div className="h-0 w-0 border-y-[9px] border-r-[12px] border-y-transparent border-r-amber-300" />
        </div>

        {/* 스트립 */}
        <div style={{ transform: `translateY(${-(pos - 1) * ITEM_H}px)`, transition: trans ? "transform 3.6s cubic-bezier(0.12,0.72,0.16,1)" : "none" }}>
          {items.map((p, k) => {
            const isCenter = !spinning && result && (k % n) === (pos % n);
            return (
              <div key={k} className="flex items-center justify-center gap-2 px-3" style={{ height: ITEM_H }}>
                <span className="text-[24px]">{p.e}</span>
                <span className={`text-[17px] font-black ${isCenter ? "text-amber-300" : "text-white/85"}`}>{p.t}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={spin} disabled={spinning}
        className="mx-auto mt-5 block w-full rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,176,32,0.5)] transition hover:brightness-110 disabled:opacity-60">
        {spinning ? "드르륵… 🎰" : "벌칙 뽑기 🎡"}
      </button>

      <div className="mt-4">
        {result ? (
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/25 to-rose-500/25 p-4 text-center ring-1 ring-amber-400/40">
            <p className="text-[13px] font-bold text-white/70">오늘의 벌칙은…</p>
            <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,176,32,0.6)]">{result.e} {result.t}</p>
          </div>
        ) : (
          <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
            룰렛·사다리로 걸린 사람이 정해졌다면, 무슨 벌칙일지 뽑아보세요! 가운데 칸에 멈춘 게 벌칙이에요.
          </p>
        )}
      </div>
    </div>
  );
}
