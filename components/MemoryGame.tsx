"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 기억력 순서 — 한 명씩, 점점 길어지는 색 순서를 기억해 그대로 따라쳐요(사이먼식).
// 자기 순서에서 틀릴 때까지 도전 → 성공한 최고 단계가 점수. 가장 짧게 기억한 사람이 독박.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const PADS = ["#22c55e", "#ef4444", "#eab308", "#3b82f6"];
const CAP = 15;

export default function MemoryGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "watch" | "input" | "between" | "done">("setup");
  const [cur, setCur] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [active, setActive] = useState(-1);
  const [inputIdx, setInputIdx] = useState(0);
  const [level, setLevel] = useState(1);
  const seqRef = useRef<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const n = names.length;
  useEffect(() => () => clearTimers(), []);
  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }
  function after(ms: number, fn: () => void) { timers.current.push(setTimeout(fn, ms)); }

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { clearTimers(); setPhase("setup"); setCur(0); setScores([]); setActive(-1); setInputIdx(0); setLevel(1); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setScores([]); beginTurn(0);
  }
  function beginTurn(i: number) {
    clearTimers();
    setCur(i); setInputIdx(0); setActive(-1);
    seqRef.current = [Math.floor(Math.random() * 4)];
    setLevel(1);
    after(500, showSeq);
  }
  function showSeq() {
    setPhase("watch"); setInputIdx(0); setActive(-1);
    const seq = seqRef.current;
    // 단계가 올라갈수록 점점 빨라져요(640ms → 최소 230ms) — 금방 떨어뜨려야 함
    const stepMs = Math.max(230, 640 - (seq.length - 1) * 58);
    const litMs = Math.max(130, stepMs - 150);
    seq.forEach((pad, idx) => {
      after(idx * stepMs + 100, () => { setActive(pad); sfx.pad(pad); });
      after(idx * stepMs + 100 + litMs, () => setActive(-1));
    });
    after(seq.length * stepMs + 250, () => setPhase("input"));
  }
  function tapPad(p: number) {
    if (phase !== "input") return;
    setActive(p); sfx.pad(p);
    after(170, () => setActive(-1));
    const seq = seqRef.current;
    if (p === seq[inputIdx]) {
      const ni = inputIdx + 1;
      setInputIdx(ni);
      if (ni === seq.length) {
        // 이번 단계 성공 → 다음 단계로
        if (seq.length >= CAP) { finishTurn(CAP); return; }
        seqRef.current = [...seq, Math.floor(Math.random() * 4)];
        setLevel(seq.length + 1);
        setPhase("watch");
        after(650, showSeq);
      }
    } else {
      // 틀림 → 성공한 최고 단계 = seq.length - 1
      after(250, () => { sfx.boom(); finishTurn(seq.length - 1); });
    }
  }
  function finishTurn(score: number) {
    setScores((s) => { const a = [...s]; a[cur] = score; return a; });
    setPhase("between");
  }
  function next() {
    if (cur + 1 < n) { beginTurn(cur + 1); return; }
    setPhase("done"); sfx.boom();
  }

  const rank = phase === "done" ? names.map((_, i) => i).sort((a, b) => scores[b] - scores[a]) : [];
  const loserIdx = rank.length ? rank[rank.length - 1] : -1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-violet-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          점점 길어지는 <b className="text-white">색 순서</b>를 기억해 따라쳐요 · <b className="text-white">가장 짧게 기억한 사람이 독박!</b>
        </p>
        <p className="mt-4 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)} className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-violet-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-violet-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(167,139,250,0.45)] transition hover:brightness-110">대결 시작 🧠</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {scores.some((s) => s !== undefined) && phase !== "done" && (
          <div className="mt-4 space-y-1">
            {names.map((nm, i) => scores[i] !== undefined && (
              <div key={i} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
                <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{nm}</span>
                <span className="font-black text-white/80">{scores[i]}단계</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 플레이 */}
      <div className={`flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 ${phase === "done" ? "game-shake" : ""}`}>
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{phase === "done" ? "결과" : phase === "watch" ? "잘 보세요 👀" : phase === "input" ? "따라 하세요 ✋" : phase === "setup" ? "SET" : "차례대로"}</span>
          <span className="text-violet-300">최단 기억 = 독박</span>
        </div>

        {phase === "done" ? (
          <div className="mt-4 w-full space-y-1.5">
            {rank.map((i, r) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13.5px] ring-1 ${r === 0 ? "bg-amber-500/20 ring-amber-400/50" : i === loserIdx ? "bg-fuchsia-600/20 ring-fuchsia-400/40" : "bg-black/25 ring-white/10"}`}>
                <span className="font-black" style={{ color: COLORS[i % COLORS.length] }}>{r === 0 ? "🏆 " : i === loserIdx ? "💀 " : `${r + 1}위 `}{names[i]}</span>
                <span className="font-black text-white/85">{scores[i]}단계</span>
              </div>
            ))}
            <p className="pt-2 text-center text-[13px] font-bold text-white/60">가장 짧게 기억한 <b className="text-fuchsia-300">{names[loserIdx]}</b>님이 독박!</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-8 flex flex-col items-center text-center">
            <div className="text-[46px]">🧠</div>
            <p className="mt-2 text-[15px] font-black text-white">색 순서를 기억해 따라치기</p>
            <p className="mt-1 text-[13px] text-white/55">단계가 오를수록 순서가 길어져요 · 모두 같은 조건</p>
          </div>
        ) : (
          <div className="mt-2 flex w-full flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례 ({cur + 1}/{n}) · <b className="text-violet-300">{level}단계</b></p>
            <p className="text-[20px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>

            {/* 패드 */}
            <div className="my-5 grid grid-cols-2 gap-3">
              {PADS.map((c, i) => (
                <button key={i} onPointerDown={() => tapPad(i)} disabled={phase !== "input"}
                  className="h-28 w-28 rounded-2xl transition-all sm:h-32 sm:w-32"
                  style={{
                    background: c,
                    opacity: active === i ? 1 : phase === "input" ? 0.55 : 0.32,
                    transform: active === i ? "scale(1.06)" : "scale(1)",
                    boxShadow: active === i ? `0 0 30px ${c}` : "none",
                    cursor: phase === "input" ? "pointer" : "default",
                  }} />
              ))}
            </div>

            {phase === "between" ? (
              <div className="flex flex-col items-center">
                <p className="text-[15px] font-bold text-white/80"><b style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</b> — {scores[cur]}단계 성공!</p>
                <button onClick={next} className="mt-3 rounded-2xl bg-violet-400 px-6 py-3 text-[15px] font-black text-black transition hover:brightness-110">{cur + 1 < n ? "다음 사람 →" : "결과 보기 🏁"}</button>
              </div>
            ) : (
              <p className="text-[14px] font-bold text-white/50">{phase === "watch" ? "순서를 외우세요…" : `${inputIdx} / ${seqRef.current.length} 입력`}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
