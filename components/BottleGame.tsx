"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 병 돌리기 — 참가자들이 '터치'로 총 횟수를 쌓고, 시작하면 병이 그 횟수만큼 칸을 돌아 멈춰요.
// 착지 = (총 터치 수) % 인원 → 횟수가 바뀌면 결과도 바뀜. 마지막에 감속하며 스릴.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const CX = 150, CY = 150, R = 118;

export default function BottleGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "count" | "spin" | "done">("setup");
  const [touches, setTouches] = useState(0);
  const [rot, setRot] = useState(0);
  const [loser, setLoser] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;
  const seg = 360 / n;
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    hardReset();
  }
  function hardReset() { if (timer.current) clearTimeout(timer.current); setPhase("setup"); setTouches(0); setRot(0); setLoser(null); }
  function begin() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setPhase("count"); setTouches(0); setRot(0); setLoser(null);
  }
  function tap() {
    if (phase !== "count") return;
    setTouches((t) => t + 1);
    setRot((r) => r + 14); // 누를 때마다 살짝 돌아 반응감
    sfx.tick();
  }
  function again() { if (timer.current) clearTimeout(timer.current); setPhase("count"); setTouches(0); setRot(0); setLoser(null); }

  function start() {
    if (phase !== "count" || touches < 1) return;
    setPhase("spin");
    sfx.whoosh();
    const total = touches;
    let step = 0;
    const run = () => {
      step++;
      setRot(step * seg); // 한 칸씩 전진
      sfx.tick();
      if (step >= total) {
        const idx = total % n;
        setRot(total * seg);
        timer.current = setTimeout(() => { setLoser(names[idx]); setPhase("done"); sfx.boom(); }, 260);
        return;
      }
      // 끝으로 갈수록 감속(스릴)
      const remain = total - step;
      const delay = remain > 7 ? 45 : [90, 130, 180, 240, 320, 430, 560][7 - remain] || 60;
      timer.current = setTimeout(run, delay);
    };
    run();
  }

  const namePos = (i: number) => {
    const a = ((i * seg - 90) * Math.PI) / 180;
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
  };
  const chosenIdx = loser ? touches % n : -1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          다 같이 <b className="text-white">터치</b>로 횟수를 쌓고 시작! 병이 그 횟수만큼 돌아 멈춰요. <span className="text-emerald-300">횟수가 바뀌면 결과도 바뀜.</span>
        </p>
        <p className="mt-4 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
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
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))} maxLength={10} disabled={phase !== "setup"}
                className="w-full bg-transparent text-[15px] font-bold text-white outline-none disabled:opacity-60" />
            </div>
          ))}
        </div>
        {phase === "setup" ? (
          <button onClick={begin} className="mt-5 w-full rounded-2xl bg-emerald-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(0,255,157,0.45)] transition hover:brightness-110">병 준비 🍾</button>
        ) : (
          <button onClick={hardReset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
      </div>

      {/* 병 */}
      <div className={`flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 ${loser ? "game-shake" : ""}`}>
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : phase === "spin" ? "드르륵…" : phase === "count" ? "터치로 횟수 쌓기" : "SET NAMES"}</span>
          <span className="text-emerald-300">가리킨 사람이 독박</span>
        </div>

        {/* 터치 카운터 */}
        {(phase === "count" || phase === "spin") && (
          <div className="mt-3 rounded-2xl bg-black/30 px-6 py-2 text-center ring-1 ring-white/10">
            <span className="text-[12px] text-white/50">터치 카운트</span>
            <p className="text-[28px] font-black leading-none text-emerald-300 tabular-nums">{touches}<span className="text-[15px] text-white/40"> 회</span></p>
          </div>
        )}

        <div className="relative mt-3 aspect-square w-full max-w-[320px]">
          <svg viewBox="0 0 300 300" className="w-full">
            <circle cx={CX} cy={CY} r={R + 16} fill="none" stroke="#1c1c33" strokeWidth="2" />
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
            <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: "150px 150px", transition: phase === "count" ? "transform 0.12s ease-out" : "none" }}>
              <rect x="145" y="70" width="10" height="80" rx="5" fill="#00ff9d" />
              <path d="M150 52 l11 26 h-22 z" fill="#00ff9d" />
              <circle cx="150" cy="150" r="16" fill="#0b0b18" stroke="#00ff9d" strokeWidth="2" />
              <rect x="145" y="150" width="10" height="34" rx="5" fill="#00ff9d" opacity="0.5" />
            </g>
          </svg>
        </div>

        {/* 컨트롤 */}
        {phase === "count" && (
          <div className="mt-3 w-full max-w-[320px] space-y-2">
            <button onClick={tap}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-5 text-[20px] font-black text-black shadow-[0_0_24px_rgba(0,255,157,0.5)] transition hover:brightness-110 active:scale-95">
              터치 +1 👆
            </button>
            <button onClick={start} disabled={touches < 1}
              className="w-full rounded-2xl bg-white/10 py-3.5 text-[16px] font-black text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-40">
              시작 🍾 ({touches}번 돌리기)
            </button>
          </div>
        )}

        <div className="mt-4 w-full">
          {loser ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">{touches}번 돌아 멈춘 곳… 오늘의 독박은</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
              <button onClick={again} className="mt-3 rounded-xl bg-emerald-400 px-5 py-2 text-[13px] font-black text-black transition hover:brightness-110">다시 (터치부터)</button>
            </div>
          ) : phase === "count" ? (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[12.5px] text-white/60 ring-1 ring-white/10">
              다 같이 원하는 만큼 눌러요. 몇 번 눌렀는지에 따라 병이 도는 횟수·결과가 달라져요!
            </p>
          ) : phase === "spin" ? (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">병이 {touches}칸을 도는 중…</p>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">이름 넣고 ‘병 준비’</p>
          )}
        </div>
      </div>
    </div>
  );
}
