"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 버스트 21 — 한 명씩 카드를 뽑아 합을 쌓아요. 합이 21을 넘기는 순간 그 사람이 독박.
// 숫자가 차오를수록 조여오는 스릴. 블랙잭의 '버스트' 오마주.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

export default function BustGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "play" | "drawing" | "done">("setup");
  const [sum, setSum] = useState(0);
  const [turn, setTurn] = useState(0);
  const [card, setCard] = useState<number | null>(null);
  const [loser, setLoser] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { if (t.current) clearTimeout(t.current); setPhase("setup"); setSum(0); setTurn(0); setCard(null); setLoser(null); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setSum(0); setTurn(0); setCard(null); setLoser(null); setPhase("play");
  }
  function draw() {
    if (phase !== "play") return;
    setPhase("drawing");
    sfx.suspense();
    const c = 1 + Math.floor(Math.random() * 11); // 1~11
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => {
      setCard(c);
      const ns = sum + c;
      setSum(ns);
      if (ns > 21) { setLoser(names[turn]); setPhase("done"); sfx.boom(); }
      else { sfx.pop(); setPhase("play"); setTurn((x) => (x + 1) % n); }
    }, 650);
  }

  const danger = Math.min(sum / 21, 1);
  const sumColor = loser ? "#ff2e88" : `hsl(${Math.round(140 - danger * 140)}, 90%, 55%)`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          한 명씩 카드(1~11)를 뽑아 합을 쌓아요 · <b className="text-white">합이 21을 넘기면 독박!</b>
        </p>
        <p className="mt-4 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-amber-400 text-black shadow-[0_0_20px_rgba(255,176,32,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-amber-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,176,32,0.45)] transition hover:brightness-110">게임 시작 🎴</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
      </div>

      {/* 플레이 */}
      <div className={`flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 ${loser ? "game-shake" : ""}`}>
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "BUST 💥" : phase === "setup" ? "SET NAMES" : "카드를 뽑아요"}</span>
          <span className="text-amber-300">21 넘기면 독박</span>
        </div>

        {/* 합계 게이지 */}
        {phase !== "setup" && (
          <div className="mt-4 w-full">
            <div className="text-center">
              <span className="text-[13px] font-bold text-white/50">현재 합</span>
              <p className="text-[64px] font-black leading-none tabular-nums" style={{ color: sumColor, textShadow: `0 0 20px ${sumColor}77` }}>{sum}</p>
              <span className="text-[13px] font-bold text-white/40">/ 21</span>
            </div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${danger * 100}%`, background: sumColor }} />
            </div>
          </div>
        )}

        {loser ? (
          <div className="mt-5 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
            <p className="text-[13px] font-bold text-white/70">{card && `+${card} → ${sum}`} · 21 초과! 오늘의 독박은</p>
            <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-10 flex flex-col items-center text-center">
            <div className="text-[46px]">🎴</div>
            <p className="mt-2 text-[15px] font-black text-white">합이 21을 넘기면 독박</p>
            <p className="mt-1 text-[13px] text-white/55">뒤로 갈수록 조여오는 스릴!</p>
          </div>
        ) : (
          <div className="mt-5 flex w-full flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례</p>
            <p className="text-[22px] font-black" style={{ color: COLORS[turn % COLORS.length] }}>{names[turn]}</p>
            <div className="my-4 flex h-24 w-16 items-center justify-center rounded-xl bg-white text-[34px] font-black text-black ring-2 ring-amber-300">
              {phase === "drawing" ? "🎴" : card ?? "?"}
            </div>
            <button onClick={draw} disabled={phase === "drawing"}
              className="w-full max-w-[260px] rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,176,32,0.5)] transition hover:brightness-110 disabled:opacity-60">
              {phase === "drawing" ? "뽑는 중… 🎴" : `${names[turn]} 카드 뽑기 🎴`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
