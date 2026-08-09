"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 근접 타이머 — 목표 시간(예: 5초)을 정하고, 시작 후 숨겨진 타이머를 목표에 가장 가깝게 멈추기.
// 한 명씩 순서대로. 목표에서 가장 멀리 벗어난 사람이 독박!
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const TARGETS = [3, 5, 7, 10];

export default function TimerStopGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [target, setTarget] = useState(5);
  const [phase, setPhase] = useState<"setup" | "ready" | "running" | "between" | "done">("setup");
  const [cur, setCur] = useState(0);
  const [times, setTimes] = useState<number[]>([]); // 각자 멈춘 시각(초)
  const [last, setLast] = useState<number | null>(null);
  const startRef = useRef(0);

  const n = names.length;
  useEffect(() => () => { /* no timers to clear (rAF-free) */ }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { setPhase("setup"); setCur(0); setTimes([]); setLast(null); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setTimes([]); setCur(0); setLast(null); setPhase("ready");
  }
  function begin() {
    startRef.current = performance.now();
    setPhase("running");
    sfx.go();
  }
  function stop() {
    const elapsed = (performance.now() - startRef.current) / 1000;
    sfx.click();
    setTimes((t) => { const c = [...t]; c[cur] = elapsed; return c; });
    setLast(elapsed);
    setPhase("between");
  }
  function next() {
    if (cur + 1 < n) { setCur(cur + 1); setLast(null); setPhase("ready"); return; }
    // 가장 멀리 벗어난 사람 = 독박
    let worst = -1, wi = 0;
    times.forEach((t, i) => { const d = Math.abs(t - target); if (d > worst) { worst = d; wi = i; } });
    setCur(wi); setPhase("done"); sfx.boom();
  }

  const loser = phase === "done" ? names[cur] : null;
  const diff = (t: number) => Math.abs(t - target);
  const best = times.length === n ? times.reduce((bi, t, i, arr) => (diff(t) < diff(arr[bi]) ? i : bi), 0) : -1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-cyan-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">목표 시간 · 참가자</h2>

        <p className="mt-5 text-[13px] font-bold text-white/60">목표 시간 (이 시간에 가깝게 멈춰요)</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {TARGETS.map((s) => (
            <button key={s} onClick={() => phase === "setup" && setTarget(s)} disabled={phase !== "setup"}
              className={`rounded-xl py-2.5 text-[14px] font-black transition disabled:opacity-40 ${target === s ? "bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,229,255,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{s}초</button>
          ))}
        </div>

        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-cyan-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-cyan-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(0,229,255,0.45)] transition hover:brightness-110">{target}초 대결 시작 ⏱</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {/* 기록 */}
        {times.some((t) => t !== undefined) && (
          <div className="mt-4 space-y-1">
            {names.map((nm, i) => times[i] !== undefined && (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-[13px] ${best === i ? "bg-emerald-500/15 ring-1 ring-emerald-400/40" : "bg-black/25"}`}>
                <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{nm}{best === i ? " 🏆" : ""}</span>
                <span className="font-black text-white/80">{times[i].toFixed(2)}초 <span className="text-white/40">(±{diff(times[i]).toFixed(2)})</span></span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 플레이 영역 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : phase === "running" ? "STOP!" : phase === "setup" ? "SET" : "차례대로"}</span>
          <span className="text-cyan-300">목표 {target}초에 가깝게</span>
        </div>

        {loser ? (
          <div className="my-8 rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-6 text-center ring-1 ring-fuchsia-400/40">
            <p className="text-[13px] font-bold text-white/70">목표에서 가장 멀리 빗나간… 오늘의 독박은</p>
            <p className="mt-1 text-[30px] font-black text-white drop-shadow-[0_0_14px_rgba(255,46,136,0.7)]">💀 {loser}</p>
            <p className="mt-2 text-[13px] text-white/60">{times[cur].toFixed(2)}초 (목표 {target}초, ±{diff(times[cur]).toFixed(2)})</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-10 flex flex-col items-center text-center">
            <div className="text-[46px]">⏱️</div>
            <p className="mt-2 text-[15px] font-black text-white">{target}초에 가장 가깝게 멈추기</p>
            <p className="mt-1 text-[13px] text-white/55">타이머 숫자는 숨겨져요 · 감으로 승부!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="mt-3 text-[13px] font-bold text-white/60">지금 차례 ({cur + 1}/{n})</p>
            <p className="text-[22px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>

            <div className="my-6 flex h-32 w-32 items-center justify-center rounded-full ring-4"
              style={{ borderColor: "transparent", background: phase === "running" ? "radial-gradient(circle,rgba(0,229,255,0.25),transparent)" : "rgba(255,255,255,0.03)", boxShadow: phase === "running" ? "0 0 40px rgba(0,229,255,0.5)" : "none" }}>
              <span className="text-[40px] font-black text-white">
                {phase === "running" ? "?" : phase === "between" ? `${last?.toFixed(2)}` : "⏱"}
              </span>
            </div>

            {phase === "ready" && (
              <button onClick={begin} className="w-full max-w-[260px] rounded-2xl bg-cyan-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(0,229,255,0.5)] transition hover:brightness-110">시작 ▶</button>
            )}
            {phase === "running" && (
              <button onClick={stop} className="w-full max-w-[260px] rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 py-4 text-[18px] font-black text-black shadow-[0_0_24px_rgba(255,82,82,0.5)] transition hover:brightness-110">멈춰! ⏹</button>
            )}
            {phase === "between" && (
              <div className="flex flex-col items-center">
                <p className="text-[13px] font-bold text-white/70">{names[cur]} — {last?.toFixed(2)}초 (목표 {target}초, ±{diff(last ?? 0).toFixed(2)})</p>
                <button onClick={next} className="mt-3 rounded-2xl bg-cyan-400 px-6 py-3 text-[15px] font-black text-black transition hover:brightness-110">
                  {cur + 1 < n ? "다음 사람 →" : "결과 보기 🏁"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
