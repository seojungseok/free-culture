"use client";

import { useState, useRef } from "react";
import { sfx } from "@/lib/sfx";

// 벌칙 룰렛 — 누가 걸렸는지 정했다면, '무슨 벌칙'인지 돌려서 뽑기. 순한맛/매운맛.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

const MILD = ["🍺 원샷!", "😙 애교 3초", "🎤 노래 한 소절", "🤝 러브샷", "😂 3초 웃기기", "🙅 이번엔 통과!", "🗣️ 성대모사", "👉 옆사람 지목", "🧊 얼음(1턴)", "💃 개인기 하나"];
const SPICY = ["🍺🍺 두 잔 원샷", "💋 러브샷 필수", "🎤 노래 완창", "😳 흑역사 고백", "🕺 막춤 10초", "😘 옆사람 애교", "🫣 비밀 공개", "🍺 원샷+지목", "📸 셀카 벌칙샷", "🤪 벌칙 2배"];

const SEG = (n: number) => 360 / n;
const R = 140, CX = 150, CY = 150;

function slicePath(i: number, n: number) {
  const seg = SEG(n);
  const a0 = ((i * seg - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
  const x0 = CX + R * Math.cos(a0), y0 = CY + R * Math.sin(a0);
  const x1 = CX + R * Math.cos(a1), y1 = CY + R * Math.sin(a1);
  return `M${CX},${CY} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${seg > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}
function labelPos(i: number, n: number) {
  const seg = SEG(n);
  const a = (((i + 0.5) * seg - 90) * Math.PI) / 180;
  return { x: CX + R * 0.62 * Math.cos(a), y: CY + R * 0.62 * Math.sin(a), rot: (i + 0.5) * seg };
}

export default function MissionRoulette() {
  const [spicy, setSpicy] = useState(false);
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const base = useRef(0);

  const list = spicy ? SPICY : MILD;
  const n = list.length;

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    sfx.whoosh();
    const i = Math.floor(Math.random() * n);
    const seg = SEG(n);
    // 슬라이스 i 중심이 상단 포인터(-90)에 오도록: 회전 = 5바퀴 - 중심각
    const target = base.current + 360 * 5 - (i * seg + seg / 2);
    base.current = target;
    setRot(target);
    setTimeout(() => { setResult(list[i]); setSpinning(false); sfx.win(); }, 4200);
  }

  return (
    <div className="mx-auto max-w-[460px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
      {/* 맛 선택 */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <button onClick={() => !spinning && setSpicy(false)} className={`rounded-full px-4 py-2 text-[13px] font-black transition ${!spicy ? "bg-cyan-400 text-black" : "bg-white/5 text-white/60"}`}>😊 순한맛</button>
        <button onClick={() => !spinning && setSpicy(true)} className={`rounded-full px-4 py-2 text-[13px] font-black transition ${spicy ? "bg-rose-400 text-black" : "bg-white/5 text-white/60"}`}>🌶️ 매운맛</button>
      </div>

      {/* 룰렛 */}
      <div className="relative mx-auto aspect-square w-full max-w-[320px]">
        {/* 포인터 */}
        <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[11px] border-t-[18px] border-x-transparent border-t-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        </div>
        <svg viewBox="0 0 300 300" className="w-full" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? "transform 4.2s cubic-bezier(0.17,0.67,0.14,1)" : "none" }}>
          {list.map((m, i) => (
            <g key={i}>
              <path d={slicePath(i, n)} fill={COLORS[i % COLORS.length]} stroke="#0b0b18" strokeWidth="2" opacity="0.92" />
              <text {...labelPos(i, n)} fill="#0b0b18" fontSize="10" fontWeight="900" textAnchor="middle"
                transform={`rotate(${labelPos(i, n).rot}, ${labelPos(i, n).x}, ${labelPos(i, n).y})`}>
                {m.length > 8 ? m.slice(0, 8) : m}
              </text>
            </g>
          ))}
          <circle cx={CX} cy={CY} r="20" fill="#0b0b18" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      <button onClick={spin} disabled={spinning}
        className="mx-auto mt-5 block w-full max-w-[280px] rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,176,32,0.5)] transition hover:brightness-110 disabled:opacity-60">
        {spinning ? "돌리는 중… 🎡" : "벌칙 돌리기 🎡"}
      </button>

      <div className="mt-4">
        {result ? (
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/25 to-rose-500/25 p-4 text-center ring-1 ring-amber-400/40">
            <p className="text-[13px] font-bold text-white/70">오늘의 벌칙은…</p>
            <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,176,32,0.6)]">{result}</p>
          </div>
        ) : (
          <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
            룰렛·사다리로 걸린 사람이 정해졌다면, 무슨 벌칙일지 돌려보세요!
          </p>
        )}
      </div>
    </div>
  );
}
