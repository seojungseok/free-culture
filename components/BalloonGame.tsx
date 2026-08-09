"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 풍선 터뜨리기 — 한 명씩 펌프! 풍선이 점점 커지다 터지는 순간 누른 사람이 독박. (풍선 룰렛 오마주)
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

export default function BalloonGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [pumps, setPumps] = useState(0);
  const [popped, setPopped] = useState<string | null>(null);
  const threshold = useRef(0);

  const n = names.length;

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { setStarted(false); setTurn(0); setPumps(0); setPopped(null); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setStarted(true);
    threshold.current = 6 + Math.floor(Math.random() * 12); // 6~17번 사이 랜덤
    setTurn(0); setPumps(0); setPopped(null);
  }
  function pump() {
    if (!started || popped) return;
    const np = pumps + 1;
    setPumps(np);
    if (np >= threshold.current) {
      setPopped(names[turn]);
      sfx.boom();
    } else {
      // 커질수록 높아지는 긴장 틱
      sfx.tick();
      setTurn((t) => (t + 1) % n);
    }
  }

  const scale = Math.min(1 + pumps * 0.14, 2.6);
  // 커질수록 빨개짐
  const danger = Math.min(pumps / 14, 1);
  const balloonColor = popped ? "#ff2e88" : `hsl(${Math.round(200 - danger * 200)}, 85%, 60%)`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-pink-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-pink-400 text-black shadow-[0_0_20px_rgba(255,122,198,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-pink-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,122,198,0.45)] transition hover:brightness-110">풍선 준비 🎈</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
      </div>

      {/* 풍선 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{popped ? "PANG! 💥" : started ? "펌프!" : "SET NAMES"}</span>
          <span className="text-pink-300">터뜨리면 독박</span>
        </div>

        {started && !popped && (
          <div className="mt-3 rounded-2xl bg-black/30 px-6 py-2 text-center ring-1 ring-white/10">
            <span className="text-[12px] text-white/50">지금 펌프할 차례</span>
            <p className="text-[19px] font-black" style={{ color: COLORS[turn % COLORS.length] }}>{names[turn]}</p>
          </div>
        )}

        {/* 풍선 그림 */}
        <div className="my-4 flex h-48 items-center justify-center">
          {popped ? (
            <div className="text-[90px] leading-none">💥</div>
          ) : (
            <div className="transition-transform duration-200" style={{ transform: `scale(${scale})` }}>
              <svg width="90" height="110" viewBox="0 0 90 110">
                <ellipse cx="45" cy="45" rx="34" ry="40" fill={balloonColor} opacity="0.92" />
                <ellipse cx="34" cy="32" rx="9" ry="13" fill="#fff" opacity="0.35" />
                <path d="M45 85 l-6 8 h12 z" fill={balloonColor} />
                <path d="M45 93 q6 8 0 16" stroke="#ffffff88" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          )}
        </div>

        {started && !popped ? (
          <button onClick={pump}
            className="w-full max-w-[280px] rounded-2xl bg-gradient-to-r from-pink-400 to-rose-500 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,122,198,0.5)] transition hover:brightness-110 active:scale-95">
            펌프! 🎈 (바람 넣기)
          </button>
        ) : null}

        <div className="mt-4 w-full">
          {popped ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">풍선이 터졌어요! 오늘의 독박은…</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {popped}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
              {started ? `펌프 ${pumps}회 · 점점 커지는 풍선… 터뜨리는 사람이 독박!` : "이름 넣고 '풍선 준비'"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
