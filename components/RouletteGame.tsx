"use client";

import { useState, useMemo, useRef } from "react";

// 독박 룰렛 — 이름 입력 → 돌려서 한 명씩 "세이프"로 빠지고, 최후 1인이 독박(벌칙).
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

const TAU = Math.PI * 2;
function polar(cx: number, cy: number, r: number, angFromTopDeg: number) {
  const a = ((angFromTopDeg - 90) * Math.PI) / 180; // 위(12시)=0도, 시계방향
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}
function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
}

export default function RouletteGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [alive, setAlive] = useState<number[] | null>(null); // 적용 후: 살아있는 원본 인덱스
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [loser, setLoser] = useState<string | null>(null);
  const rotRef = useRef(0);

  function setCountAndNames(n: number) {
    setCount(n);
    setNames((prev) => Array.from({ length: n }, (_, i) => prev[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() {
    setAlive(null); setLog([]); setLoser(null); setRot(0); rotRef.current = 0; setSpinning(false);
  }
  function apply() {
    const cleaned = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(cleaned);
    setAlive(cleaned.map((_, i) => i));
    setLog([]); setLoser(null); setRot(0); rotRef.current = 0;
  }

  const seg = alive && alive.length ? 360 / alive.length : 90;

  function spin() {
    if (!alive || spinning || alive.length <= 1) return;
    setSpinning(true);
    const winPos = Math.floor(Math.random() * alive.length); // 이번에 "세이프"로 빠질 자리
    const center = winPos * seg + seg / 2;
    const target = rotRef.current + 360 * (5 + Math.floor(Math.random() * 3)) + ((360 - (center % 360)) - (rotRef.current % 360) + 720) % 360;
    rotRef.current = target;
    setRot(target);
    window.setTimeout(() => {
      const safeIdx = alive[winPos];
      const safeName = names[safeIdx];
      const remain = alive.filter((_, i) => i !== winPos);
      setLog((l) => [...l, `✅ ${safeName} 세이프!`]);
      if (remain.length === 1) {
        setLoser(names[remain[0]]);
        setLog((l) => [...l, `💀 ${names[remain[0]]} 독박! (벌칙 당첨)`]);
      }
      setAlive(remain);
      setSpinning(false);
    }, 4200);
  }

  const inPlay = alive !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-lime-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>

        <p className="mt-5 text-[13px] font-bold text-white/60">몇 명이 함께하나요? (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
            <button key={n} onClick={() => setCountAndNames(n)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === n ? "bg-lime-400 text-black shadow-[0_0_20px_rgba(166,255,0,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
              {n}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[13px] font-bold text-white/60">참가자 이름</p>
          <span className="text-[12px] font-bold text-lime-300">{count}명</span>
        </div>
        <div className="mt-2 space-y-2">
          {names.map((nm, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[13px] font-black text-black" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                maxLength={10} disabled={inPlay}
                className="w-full bg-transparent text-[15px] font-bold text-white outline-none placeholder:text-white/30 disabled:opacity-60" />
            </div>
          ))}
        </div>

        {!inPlay ? (
          <button onClick={apply} className="mt-5 w-full rounded-2xl bg-lime-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(166,255,0,0.45)] transition hover:brightness-110">
            룰렛에 적용하기 →
          </button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3.5 text-[15px] font-bold text-white/80 transition hover:bg-white/10">
            처음부터 다시
          </button>
        )}
      </div>

      {/* 룰렛 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : inPlay ? "READY" : "SET NAMES"}</span>
          <span className="text-fuchsia-400">{alive ? `${alive.length}명 남음` : ""}</span>
        </div>

        <div className="relative mt-4 aspect-square w-full max-w-[380px]">
          {/* 포인터 */}
          <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
            <div className="h-0 w-0 border-x-[12px] border-t-[20px] border-x-transparent border-t-lime-400 drop-shadow-[0_0_8px_rgba(166,255,0,0.7)]" />
          </div>
          <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-[0_0_30px_rgba(80,0,120,0.5)]">
            <circle cx="100" cy="100" r="99" fill="#0b0b18" stroke="#1c1c33" strokeWidth="2" />
            <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: "100px 100px", transition: spinning ? "transform 4.2s cubic-bezier(0.15,0.9,0.2,1)" : "none" }}>
              {(alive ?? names.map((_, i) => i)).map((origIdx, i, arr) => {
                const s = 360 / arr.length;
                const start = i * s, end = (i + 1) * s;
                const [tx, ty] = polar(100, 100, 62, start + s / 2);
                return (
                  <g key={origIdx}>
                    <path d={slicePath(100, 100, 96, start, end)} fill={COLORS[origIdx % COLORS.length]} stroke="#0b0b18" strokeWidth="1.5" />
                    <text x={tx} y={ty} fill="#0b0b18" fontSize={arr.length > 7 ? 8 : 10} fontWeight="900" textAnchor="middle" dominantBaseline="middle"
                      transform={`rotate(${start + s / 2}, ${tx}, ${ty})`}>
                      {names[origIdx].length > 5 ? names[origIdx].slice(0, 5) : names[origIdx]}
                    </text>
                  </g>
                );
              })}
            </g>
            <circle cx="100" cy="100" r="20" fill="#0b0b18" stroke="#a6ff00" strokeWidth="2" />
          </svg>
          {/* GO 버튼 */}
          <button onClick={spin} disabled={!inPlay || spinning || !!loser || (alive?.length ?? 0) <= 1}
            className="absolute left-1/2 top-1/2 z-10 flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-lime-400 text-[15px] font-black italic text-black shadow-[0_0_20px_rgba(166,255,0,0.6)] transition enabled:hover:scale-105 disabled:opacity-50">
            GO
          </button>
        </div>

        {/* 결과 */}
        <div className="mt-5 w-full">
          {loser ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">오늘의 독박은…</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-black/30 p-4 text-center ring-1 ring-white/10">
              <p className="text-[15px] font-black text-white">{inPlay ? "GO를 눌러 돌려요!" : "이름 적고 '적용하기'"}</p>
              <p className="mt-0.5 text-[12px] text-white/50">한 명씩 세이프로 빠지고, 마지막 1인이 독박!</p>
            </div>
          )}
          {log.length > 0 && (
            <ul className="mt-3 max-h-28 space-y-1 overflow-auto text-[13px]">
              {log.map((l, i) => <li key={i} className="text-white/70">{l}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
