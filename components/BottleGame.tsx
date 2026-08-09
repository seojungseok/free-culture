"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 병 돌리기 — 가운데 병을 돌리면 한 명을 가리키며 멈춰요. 가리킨 사람이 독박. (스핀 더 보틀 오마주)
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const CX = 150, CY = 150, R = 118;

export default function BottleGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [started, setStarted] = useState(false);
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [loser, setLoser] = useState<string | null>(null);
  const base = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;
  const seg = 360 / n;
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { if (timer.current) clearTimeout(timer.current); setStarted(false); setRot(0); base.current = 0; setSpinning(false); setLoser(null); }
  function begin() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setStarted(true); setRot(0); base.current = 0; setLoser(null);
  }

  // 각 이름은 원 둘레 각도 Ai = i*seg (위=0시 기준, 시계방향). 병(위 방향)을 R도 돌리면 R 방향을 가리킴.
  function spin() {
    if (!started || spinning) return;
    setSpinning(true); setLoser(null); sfx.whoosh();
    const i = Math.floor(Math.random() * n);
    const spins = 4 + Math.floor(Math.random() * 3);
    const target = base.current + spins * 360 + (i * seg - (base.current % 360) + 720) % 360;
    base.current = target;
    setRot(target);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setLoser(names[i]); setSpinning(false); sfx.boom(); }, 4000);
  }

  // 이름 라벨 위치(위=12시 시작, 시계방향)
  const namePos = (i: number) => {
    const a = ((i * seg - 90) * Math.PI) / 180;
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
  };
  const chosenIdx = loser ? names.indexOf(loser) : -1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-emerald-400 text-black shadow-[0_0_20px_rgba(0,255,157,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
          ))}
        </div>
        <p className="mt-5 text-[13px] font-bold text-white/60">참가자 이름</p>
        <div className="mt-2 space-y-2">
          {names.map((nm, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[13px] font-black text-black" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))} maxLength={10} disabled={started}
                className="w-full bg-transparent text-[15px] font-bold text-white outline-none disabled:opacity-60" />
            </div>
          ))}
        </div>
        {!started ? (
          <button onClick={begin} className="mt-5 w-full rounded-2xl bg-emerald-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(0,255,157,0.45)] transition hover:brightness-110">병 준비 🍾</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
      </div>

      {/* 병 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : started ? "병을 돌려요" : "SET NAMES"}</span>
          <span className="text-emerald-300">가리킨 사람이 독박</span>
        </div>

        <div className="relative mt-3 aspect-square w-full max-w-[340px]">
          <svg viewBox="0 0 300 300" className="w-full">
            <circle cx={CX} cy={CY} r={R + 16} fill="none" stroke="#1c1c33" strokeWidth="2" />
            {/* 이름들 */}
            {names.map((nm, i) => {
              const { x, y } = namePos(i);
              const on = i === chosenIdx;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={on ? 20 : 15} fill={on ? COLORS[i % COLORS.length] : "#15152a"} stroke={COLORS[i % COLORS.length]} strokeWidth="2" />
                  <text x={x} y={y + 1} fill={on ? "#000" : "#fff"} fontSize={on ? 10 : 8.5} fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                    {nm.length > 4 ? nm.slice(0, 4) : nm}
                  </text>
                </g>
              );
            })}
            {/* 병 (위를 가리키는 화살표형) */}
            <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: "150px 150px", transition: spinning ? "transform 4s cubic-bezier(0.15,0.8,0.15,1)" : "none" }}>
              <rect x="145" y="70" width="10" height="80" rx="5" fill="#00ff9d" />
              <path d="M150 52 l11 26 h-22 z" fill="#00ff9d" />
              <circle cx="150" cy="150" r="16" fill="#0b0b18" stroke="#00ff9d" strokeWidth="2" />
              <rect x="145" y="150" width="10" height="34" rx="5" fill="#00ff9d" opacity="0.5" />
            </g>
          </svg>
        </div>

        <button onClick={spin} disabled={!started || spinning}
          className="mt-4 w-full max-w-[280px] rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(0,255,157,0.5)] transition hover:brightness-110 disabled:opacity-50">
          {spinning ? "빙그르르… 🍾" : "병 돌리기 🍾"}
        </button>

        <div className="mt-4 w-full">
          {loser ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">병이 가리킨 오늘의 독박은…</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
              {started ? "병이 멈추며 가리키는 사람이 독박!" : "이름 넣고 '병 준비'"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
