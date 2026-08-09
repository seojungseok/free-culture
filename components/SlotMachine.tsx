"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 독박 슬롯머신 — 한 명씩 레버를 당겨요. 💀💀💀 잭팟(?)이 뜨는 사람이 독박. (라스베가스 슬롯 오마주)
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const SAFE = ["🍒", "🔔", "⭐", "🍋", "💎", "7️⃣", "🍀", "🍉"];

export default function SlotMachine() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [reels, setReels] = useState<string[]>(["❔", "❔", "❔"]);
  const [spinning, setSpinning] = useState(false);
  const [loser, setLoser] = useState<string | null>(null);
  const [safeCount, setSafeCount] = useState(0);
  const cursed = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const n = names.length;
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() {
    if (timer.current) clearInterval(timer.current);
    setStarted(false); setTurn(0); setReels(["❔", "❔", "❔"]); setSpinning(false); setLoser(null); setSafeCount(0);
  }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setStarted(true);
    cursed.current = Math.floor(Math.random() * clean.length);
    setTurn(0); setReels(["❔", "❔", "❔"]); setLoser(null); setSafeCount(0);
  }

  function pull() {
    if (!started || spinning || loser) return;
    setSpinning(true);
    sfx.whoosh();
    const doomed = turn === cursed.current;
    let ticks = 0;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      ticks++;
      setReels([rnd(), rnd(), rnd()]);
      sfx.roll();
      if (ticks >= 13) {
        clearInterval(timer.current!);
        if (doomed) {
          setReels(["💀", "💀", "💀"]);
          setLoser(names[turn]);
          sfx.boom();
        } else {
          // 안전: 삼연속 아님 보장
          const a = rnd(); let b = rnd(); while (b === a) b = rnd(); let c = rnd(); while (c === a && c === b) c = rnd();
          setReels([a, b, c]);
          setSafeCount((s) => s + 1);
          sfx.pop();
          setTurn((t) => (t + 1) % n);
        }
        setSpinning(false);
      }
    }, 85);
  }
  const rnd = () => SAFE[Math.floor(Math.random() * SAFE.length)];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-yellow-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-yellow-400 text-black shadow-[0_0_20px_rgba(255,210,63,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-yellow-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,210,63,0.45)] transition hover:brightness-110">슬롯 시작 🎰</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
      </div>

      {/* 슬롯 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "JACKPOT 💀" : started ? "레버를 당겨요" : "SET NAMES"}</span>
          <span className="text-yellow-300">💀💀💀 뜨면 독박</span>
        </div>

        {started && !loser && (
          <div className="mt-3 rounded-2xl bg-black/30 px-6 py-2 text-center ring-1 ring-white/10">
            <span className="text-[12px] text-white/50">지금 당길 차례</span>
            <p className="text-[19px] font-black" style={{ color: COLORS[turn % COLORS.length] }}>{names[turn]}</p>
          </div>
        )}

        {/* 릴 */}
        <div className="mt-4 flex gap-2 rounded-2xl bg-gradient-to-b from-yellow-500/20 to-black/40 p-3 ring-2 ring-yellow-400/40">
          {reels.map((r, i) => (
            <div key={i} className={`flex h-20 w-16 items-center justify-center rounded-xl bg-black/60 text-[40px] ring-1 ring-white/15 ${spinning ? "animate-pulse" : ""}`}>{r}</div>
          ))}
        </div>

        {started && !loser ? (
          <button onClick={pull} disabled={spinning}
            className="mt-5 w-full max-w-[280px] rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,210,63,0.5)] transition hover:brightness-110 disabled:opacity-60">
            {spinning ? "빙글빙글… 🎰" : "레버 당기기 🎰"}
          </button>
        ) : null}

        <div className="mt-4 w-full">
          {loser ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">💀 해골 잭팟! 오늘의 독박은…</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
              {started ? `무사 통과 ${safeCount}명 · 💀 세 개가 뜨는 순간 독박!` : "이름 넣고 '슬롯 시작'"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
