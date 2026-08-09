"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 반응속도 대결 — 한 명씩 '땡!' 순간 탭. 가장 느린(또는 부정출발) 사람이 독박.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const EARLY = 999999;

export default function ReactionGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "arming" | "go" | "between" | "done">("setup");
  const [cur, setCur] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [last, setLast] = useState<number | null>(null);
  const greenAt = useRef(0);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;

  useEffect(() => () => { if (armTimer.current) clearTimeout(armTimer.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() {
    if (armTimer.current) clearTimeout(armTimer.current);
    setPhase("setup"); setCur(0); setTimes([]); setLast(null);
  }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setTimes([]); setCur(0); setLast(null);
    arm(0);
  }
  function arm(i: number) {
    setCur(i); setLast(null); setPhase("arming");
    if (armTimer.current) clearTimeout(armTimer.current);
    const delay = 1300 + Math.random() * 2700;
    armTimer.current = setTimeout(() => {
      greenAt.current = performance.now();
      setPhase("go");
      sfx.go();
    }, delay);
  }
  function tap() {
    if (phase === "arming") {
      // 부정출발
      if (armTimer.current) clearTimeout(armTimer.current);
      sfx.boom();
      setTimes((t) => { const c = [...t]; c[cur] = EARLY; return c; });
      setLast(EARLY);
      setPhase("between");
    } else if (phase === "go") {
      const ms = Math.round(performance.now() - greenAt.current);
      sfx.click();
      setTimes((t) => { const c = [...t]; c[cur] = ms; return c; });
      setLast(ms);
      setPhase("between");
    }
  }
  function next() {
    if (cur + 1 < n) arm(cur + 1);
    else {
      // 결과: 가장 느린(값 큰) 사람이 독박
      let worst = -1, wi = 0;
      times.forEach((ms, i) => { if (ms > worst) { worst = ms; wi = i; } });
      setCur(wi);
      setPhase("done");
      sfx.win();
    }
  }

  const loser = phase === "done" ? names[cur] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-lime-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-lime-400 text-black shadow-[0_0_20px_rgba(166,255,0,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-lime-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(166,255,0,0.45)] transition hover:brightness-110">대결 시작 ⚡</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {/* 기록 */}
        {times.some((t) => t !== undefined) && (
          <div className="mt-4 space-y-1">
            {names.map((nm, i) => times[i] !== undefined && (
              <div key={i} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
                <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{nm}</span>
                <span className="font-black text-white/80">{times[i] === EARLY ? "부정출발 🚫" : `${times[i]}ms`}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 반응 영역 */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        {phase === "setup" ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
            <div className="text-[46px]">⚡</div>
            <p className="mt-2 text-[16px] font-black text-white">화면이 초록으로 바뀌면 탭!</p>
            <p className="mt-1 text-[13px] text-white/55">가장 느린 사람이 독박 · 미리 누르면 부정출발</p>
          </div>
        ) : loser ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center">
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-6 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">가장 느린 반응… 오늘의 독박은</p>
              <p className="mt-1 text-[30px] font-black text-white drop-shadow-[0_0_14px_rgba(255,46,136,0.7)]">💀 {loser}</p>
              <p className="mt-2 text-[13px] text-white/60">{times[cur] === EARLY ? "부정출발!" : `${times[cur]}ms`}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례</p>
            <p className="text-[20px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>
            <button onClick={tap} disabled={phase === "between"}
              className="mt-4 flex aspect-square w-full max-w-[260px] items-center justify-center rounded-3xl text-[22px] font-black transition"
              style={{
                background: phase === "go" ? "#22c55e" : phase === "arming" ? "#b91c1c" : "#1a1a30",
                color: phase === "go" ? "#04210f" : "#fff",
                boxShadow: phase === "go" ? "0 0 40px rgba(34,197,94,0.7)" : "none",
              }}>
              {phase === "arming" ? "준비… 기다려!" : phase === "go" ? "지금 탭! ⚡" : last === EARLY ? "부정출발 🚫" : `${last}ms`}
            </button>
            {phase === "between" && (
              <button onClick={next} className="mt-4 rounded-2xl bg-lime-400 px-6 py-3 text-[15px] font-black text-black transition hover:brightness-110">
                {cur + 1 < n ? "다음 사람 →" : "결과 보기 🏁"}
              </button>
            )}
            <p className="mt-3 text-[12px] text-white/40">{cur + 1} / {n}명</p>
          </div>
        )}
      </div>
    </div>
  );
}
