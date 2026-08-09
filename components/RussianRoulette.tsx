"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 역발상 러시안룰렛 — N명이면 N-1발 장전, 빈 약실 1개.
// 순서대로 방아쇠를 당기다 '총알이 안 나가는(불발)' 한 명이 독박. 실린더 돌려 섞기 + 여러 번 반복 가능.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

export default function RussianRoulette() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "shuffling" | "play" | "done">("setup");
  const [turn, setTurn] = useState(0);
  const [fired, setFired] = useState<number[]>([]); // 탕! 세이프한 사람들
  const [suspense, setSuspense] = useState(false);
  const [loser, setLoser] = useState<string | null>(null);
  const [cyl, setCyl] = useState(0); // 실린더 회전각
  const empty = useRef(0); // 빈 약실을 가진 사람 index
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;
  useEffect(() => () => { if (t1.current) clearTimeout(t1.current); if (t2.current) clearTimeout(t2.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    hardReset();
  }
  function hardReset() { setPhase("setup"); setTurn(0); setFired([]); setLoser(null); setSuspense(false); }

  function shuffle() {
    // 실린더 돌려 섞기 — 빈 약실 위치 랜덤 재배치 후 새 라운드
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setPhase("shuffling");
    setTurn(0); setFired([]); setLoser(null); setSuspense(false);
    setCyl((c) => c + 720 + Math.floor(Math.random() * 360));
    sfx.whoosh();
    if (t1.current) clearTimeout(t1.current);
    t1.current = setTimeout(() => {
      empty.current = Math.floor(Math.random() * clean.length);
      setPhase("play");
    }, 1200);
  }

  function pull() {
    if (phase !== "play" || suspense) return;
    setSuspense(true);
    sfx.suspense();
    if (t2.current) clearTimeout(t2.current);
    t2.current = setTimeout(() => {
      if (turn === empty.current) {
        setLoser(names[turn]); setPhase("done"); sfx.boom();
      } else {
        setFired((f) => [...f, turn]); setTurn((t) => t + 1); sfx.go();
      }
      setSuspense(false);
    }, 500 + Math.random() * 800);
  }

  const bullets = Math.max(n - 1, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-rose-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          {n}명 · <span className="text-amber-300">{bullets}발 장전</span> · 빈 약실 1개 — <b className="text-white">총알이 안 나가는 사람이 독박!</b>
        </p>
        <p className="mt-4 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-rose-400 text-black shadow-[0_0_20px_rgba(255,82,82,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={shuffle} className="mt-5 w-full rounded-2xl bg-rose-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,82,82,0.45)] transition hover:brightness-110">실린더 장전·돌리기 🔄</button>
        ) : (
          <div className="mt-5 flex gap-2">
            <button onClick={shuffle} disabled={suspense} className="flex-1 rounded-2xl bg-rose-400 py-3 text-[14px] font-black text-black transition hover:brightness-110 disabled:opacity-40">🔄 다시 돌리기</button>
            <button onClick={hardReset} className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
          </div>
        )}
      </div>

      {/* 리볼버 */}
      <div className={`flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 ${loser ? "game-shake" : ""}`}>
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "불발… 독박!" : phase === "shuffling" ? "실린더 돌리는 중" : phase === "play" ? "방아쇠를 당겨요" : "SET NAMES"}</span>
          <span className="text-rose-300">불발 = 독박</span>
        </div>

        {/* 실린더 */}
        <div className="relative my-4 aspect-square w-full max-w-[240px]">
          <svg viewBox="0 0 200 200" className="w-full">
            <circle cx="100" cy="100" r="92" fill="#111124" stroke="#2a2a45" strokeWidth="4" />
            <g style={{ transform: `rotate(${cyl}deg)`, transformOrigin: "100px 100px", transition: phase === "shuffling" ? "transform 1.2s cubic-bezier(0.2,0.8,0.2,1)" : "none" }}>
              {Array.from({ length: Math.max(n, 2) }, (_, i) => {
                const a = ((i * (360 / n) - 90) * Math.PI) / 180;
                const x = 100 + 58 * Math.cos(a), y = 100 + 58 * Math.sin(a);
                return <circle key={i} cx={x} cy={y} r="15" fill="#0b0b18" stroke="#3a3a5c" strokeWidth="3" />;
              })}
              <circle cx="100" cy="100" r="16" fill="#0b0b18" stroke="#3a3a5c" strokeWidth="3" />
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[44px]">
            {loser ? "😱" : phase === "play" ? (suspense ? "😨" : "🔫") : "🔄"}
          </div>
        </div>

        {loser ? (
          <div className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
            <p className="text-[13px] font-bold text-white/70">🔇 찰칵… 총알이 안 나갔어요! 오늘의 독박은</p>
            <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
          </div>
        ) : phase === "play" ? (
          <div className="flex w-full flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례</p>
            <p className="text-[24px] font-black" style={{ color: COLORS[turn % COLORS.length] }}>{names[turn]}</p>
            <button onClick={pull} disabled={suspense}
              className="mt-4 w-full max-w-[280px] rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,82,82,0.5)] transition hover:brightness-110 disabled:opacity-70">
              {suspense ? "…철컥…" : "방아쇠 당기기 🔫"}
            </button>
            <p className="mt-3 text-[12px] text-white/40">탕! 세이프 {fired.length}명 · 불발되면 독박</p>
          </div>
        ) : (
          <p className="w-full rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
            {phase === "shuffling" ? "빈 약실 위치를 섞는 중…" : "이름 넣고 ‘실린더 장전·돌리기’"}
          </p>
        )}
      </div>
    </div>
  );
}
