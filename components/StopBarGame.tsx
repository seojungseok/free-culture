"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 멈춰! 바 스톱 — 바늘이 좌우로 빠르게 왕복. 한가운데 과녁(50)에 정확히 멈추기.
// 모두 같은 조건(순수 타이밍 실력) → 가장 부정확한 사람이 독박. 정직한 참여형.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const PERIOD = 1400; // 0→100→0 왕복(ms)

// 삼각파: 시간→위치(0~100). 시각적 rAF와 무관하게 '정지 순간'을 정확히 계산.
function posAt(elapsed: number) {
  const p = (elapsed % PERIOD) / PERIOD;
  return p < 0.5 ? p * 2 * 100 : (1 - (p - 0.5) * 2) * 100;
}
const accOf = (pos: number) => Math.max(0, Math.round(100 - Math.abs(pos - 50) * 2)); // 50=100점

export default function StopBarGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "ready" | "running" | "stopped" | "done">("setup");
  const [cur, setCur] = useState(0);
  const [scores, setScores] = useState<number[]>([]);   // 정확도 점수(높을수록 좋음)
  const [needle, setNeedle] = useState(50);              // 화면 표시용 위치
  const [stopPos, setStopPos] = useState(50);
  const t0 = useRef(0);
  const raf = useRef<number | null>(null);

  const n = names.length;
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { if (raf.current) cancelAnimationFrame(raf.current); setPhase("setup"); setCur(0); setScores([]); setNeedle(50); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setScores([]); setCur(0); setPhase("ready"); setNeedle(50);
  }
  function begin() {
    if (phase !== "ready") return;
    setPhase("running"); t0.current = performance.now(); sfx.go();
    const loop = () => { setNeedle(posAt(performance.now() - t0.current)); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
  }
  function stop() {
    if (phase !== "running") return;
    if (raf.current) cancelAnimationFrame(raf.current);
    const pos = posAt(performance.now() - t0.current);
    setStopPos(pos); setNeedle(pos);
    const acc = accOf(pos);
    setScores((s) => { const a = [...s]; a[cur] = acc; return a; });
    setPhase("stopped");
    if (acc >= 95) sfx.win(); else sfx.click();
  }
  function next() {
    if (cur + 1 < n) { setCur(cur + 1); setPhase("ready"); setNeedle(50); return; }
    setPhase("done"); sfx.boom();
  }

  const rank = phase === "done" ? names.map((_, i) => i).sort((a, b) => scores[b] - scores[a]) : [];
  const loserIdx = rank.length ? rank[rank.length - 1] : -1;
  const stopAcc = accOf(stopPos);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          바늘을 <b className="text-white">한가운데 과녁</b>에 멈추기 · 모두 같은 조건 · <b className="text-white">가장 부정확한 사람이 독박!</b>
        </p>
        <p className="mt-4 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)} className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-emerald-400 text-black shadow-[0_0_20px_rgba(0,255,157,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
          ))}
        </div>
        <p className="mt-5 text-[13px] font-bold text-white/60">참가자 이름</p>
        <div className="mt-2 space-y-2">
          {names.map((nm, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[13px] font-black text-black" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))} maxLength={10} disabled={phase !== "setup"} className="w-full bg-transparent text-[15px] font-bold text-white outline-none disabled:opacity-60" />
            </div>
          ))}
        </div>
        {phase === "setup" ? (
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-emerald-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(0,255,157,0.45)] transition hover:brightness-110">대결 시작 🎯</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {counts_note(scores, phase) && (
          <div className="mt-4 space-y-1">
            {names.map((nm, i) => scores[i] !== undefined && (
              <div key={i} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
                <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{nm}</span>
                <span className="font-black text-white/80">{scores[i]}점</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 게이지 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{phase === "done" ? "결과" : phase === "running" ? "지금 멈춰!" : phase === "setup" ? "SET" : "차례대로"}</span>
          <span className="text-emerald-300">과녁 명중 = 100점</span>
        </div>

        {phase === "done" ? (
          <div className="mt-4 w-full space-y-1.5">
            {rank.map((i, r) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13.5px] ring-1 ${r === 0 ? "bg-amber-500/20 ring-amber-400/50" : i === loserIdx ? "bg-fuchsia-600/20 ring-fuchsia-400/40" : "bg-black/25 ring-white/10"}`}>
                <span className="font-black" style={{ color: COLORS[i % COLORS.length] }}>{r === 0 ? "🏆 " : i === loserIdx ? "💀 " : `${r + 1}위 `}{names[i]}</span>
                <span className="font-black text-white/85">{scores[i]}점</span>
              </div>
            ))}
            <p className="pt-2 text-center text-[13px] font-bold text-white/60">가장 부정확한 <b className="text-fuchsia-300">{names[loserIdx]}</b>님이 독박!</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-10 flex flex-col items-center text-center">
            <div className="text-[46px]">🎯</div>
            <p className="mt-2 text-[15px] font-black text-white">움직이는 바늘을 과녁에 멈추기</p>
            <p className="mt-1 text-[13px] text-white/55">순수 타이밍 실력 · 모두 같은 조건</p>
          </div>
        ) : (
          <div className="mt-4 flex w-full flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례 ({cur + 1}/{n})</p>
            <p className="text-[22px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>

            {/* 게이지 바 */}
            <div className="relative mt-6 h-12 w-full max-w-[340px] overflow-hidden rounded-full ring-1 ring-white/15"
              style={{ background: "linear-gradient(90deg,#ff2e88 0%,#ffb020 30%,#00ff9d 50%,#ffb020 70%,#ff2e88 100%)" }}>
              {/* 과녁 중앙선 */}
              <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/80" />
              <div className="absolute left-1/2 top-1 -translate-x-1/2 text-[12px]">🎯</div>
              {/* 바늘 */}
              <div className="absolute inset-y-0 w-[5px] rounded-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.6)]"
                style={{ left: `calc(${needle}% - 2.5px)`, transition: phase === "stopped" ? "none" : "none" }} />
            </div>
            <div className="mt-2 flex w-full max-w-[340px] justify-between text-[10px] font-bold text-white/30"><span>0</span><span>과녁</span><span>100</span></div>

            {phase === "ready" && (
              <button onClick={begin} className="mt-6 w-full max-w-[280px] rounded-2xl bg-emerald-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(0,255,157,0.5)] transition hover:brightness-110">{names[cur]} 시작 ▶</button>
            )}
            {phase === "running" && (
              <button onClick={stop} className="mt-6 w-full max-w-[280px] rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 py-5 text-[20px] font-black text-black shadow-[0_0_28px_rgba(255,82,82,0.6)] transition active:scale-95">멈춰! ✋</button>
            )}
            {phase === "stopped" && (
              <div className="mt-5 flex flex-col items-center">
                <p className="text-[15px] font-bold text-white/70">정확도 <b className="text-[22px] text-emerald-300">{stopAcc}점</b> {stopAcc >= 95 ? "🎯 명중!" : stopAcc >= 70 ? "👍" : "😅"}</p>
                <button onClick={next} className="mt-3 rounded-2xl bg-emerald-400 px-6 py-3 text-[15px] font-black text-black transition hover:brightness-110">{cur + 1 < n ? "다음 사람 →" : "결과 보기 🏁"}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function counts_note(scores: number[], phase: string) { return phase !== "done" && scores.some((s) => s !== undefined); }
