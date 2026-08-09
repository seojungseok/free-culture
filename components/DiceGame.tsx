"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 주사위 대결 — 한 명씩 순서대로 굴려요. 가장 낮은 눈이 독박. 동점이면 그 사람들끼리 재대결.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Die({ v, color, big }: { v: number; color: string; big?: boolean }) {
  const s = big ? 96 : 44;
  return (
    <svg viewBox="0 0 60 60" width={s} height={s}>
      <rect x="4" y="4" width="52" height="52" rx="12" fill="#fff" stroke={color} strokeWidth="3" />
      {PIPS[v].map(([r, c], i) => <circle key={i} cx={16 + c * 14} cy={16 + r * 14} r="4.5" fill={color} />)}
    </svg>
  );
}

export default function DiceGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "ready" | "rolling" | "done">("setup");
  const [queue, setQueue] = useState<number[]>([]); // 이번 라운드에 굴릴 사람들
  const [qi, setQi] = useState(0);
  const [vals, setVals] = useState<Record<number, number>>({}); // 이번 라운드 결과
  const [face, setFace] = useState(1);
  const [loser, setLoser] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
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
    setPhase("setup"); setQueue([]); setQi(0); setVals({}); setLoser(null); setMsg("");
  }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setQueue(clean.map((_, i) => i)); setQi(0); setVals({}); setLoser(null);
    setMsg("한 명씩 순서대로 굴려요!"); setPhase("ready");
  }

  function roll() {
    if (phase !== "ready") return;
    setPhase("rolling");
    sfx.whoosh();
    const idx = queue[qi];
    const finalV = 1 + Math.floor(Math.random() * 6);
    let ticks = 0;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      ticks++;
      setFace(1 + Math.floor(Math.random() * 6));
      sfx.roll();
      if (ticks >= 11) {
        clearInterval(timer.current!);
        setFace(finalV);
        sfx.click();
        setVals((v) => ({ ...v, [idx]: finalV }));
        setPhase("ready");
      }
    }, 80);
  }

  function next() {
    if (qi + 1 < queue.length) { setQi(qi + 1); setMsg(""); return; }
    // 라운드 종료 → 최저 판정
    const cur = { ...vals };
    let min = 7;
    for (const i of queue) min = Math.min(min, cur[i]);
    const low = queue.filter((i) => cur[i] === min);
    if (low.length === 1) {
      setLoser(names[low[0]]); setMsg(`최저 ${min} — 독박 결정!`); setPhase("done"); sfx.boom();
    } else {
      setQueue(low); setQi(0); setVals({});
      setMsg(`${min} 동점 ${low.length}명! 그 사람들끼리 재대결 🎲`); setPhase("ready"); sfx.suspense();
    }
  }

  const curIdx = phase !== "setup" && phase !== "done" ? queue[qi] : -1;
  const rolled = curIdx >= 0 && vals[curIdx] !== undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-violet-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-violet-400 text-black shadow-[0_0_20px_rgba(167,139,250,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-violet-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(167,139,250,0.45)] transition hover:brightness-110">대결 시작 🎲</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {/* 이번 라운드 기록 */}
        {phase !== "setup" && (
          <div className="mt-4 space-y-1">
            {queue.map((i) => vals[i] !== undefined && (
              <div key={i} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
                <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{names[i]}</span>
                <span className="font-black text-white/80">{vals[i]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 굴리기 영역 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : phase === "rolling" ? "ROLLING…" : phase === "setup" ? "SET NAMES" : "차례대로 굴려요"}</span>
          <span className="text-violet-300">최저 눈 = 독박</span>
        </div>

        {loser ? (
          <div className="my-8 rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-6 text-center ring-1 ring-fuchsia-400/40">
            <p className="text-[13px] font-bold text-white/70">{msg}</p>
            <p className="mt-1 text-[30px] font-black text-white drop-shadow-[0_0_14px_rgba(255,46,136,0.7)]">💀 {loser}</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-10 flex flex-col items-center text-center">
            <div className="text-[46px]">🎲</div>
            <p className="mt-2 text-[15px] font-black text-white">한 명씩 순서대로 굴려요</p>
            <p className="mt-1 text-[13px] text-white/55">전부 한꺼번에 X · 차례차례 긴장감 O</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="mt-3 text-[13px] font-bold text-white/60">지금 차례 ({qi + 1}/{queue.length})</p>
            <p className="text-[22px] font-black" style={{ color: COLORS[curIdx % COLORS.length] }}>{names[curIdx]}</p>
            <div className="my-5"><Die v={face} color={COLORS[curIdx % COLORS.length]} big /></div>
            {!rolled ? (
              <button onClick={roll} disabled={phase === "rolling"}
                className="w-full max-w-[260px] rounded-2xl bg-gradient-to-r from-violet-400 to-purple-500 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(167,139,250,0.5)] transition hover:brightness-110 disabled:opacity-60">
                {phase === "rolling" ? "데굴데굴… 🎲" : `${names[curIdx]} 굴리기 🎲`}
              </button>
            ) : (
              <button onClick={next}
                className="w-full max-w-[260px] rounded-2xl bg-violet-400 py-4 text-[16px] font-black text-black transition hover:brightness-110">
                {qi + 1 < queue.length ? "다음 사람 →" : "결과 보기 🏁"}
              </button>
            )}
            {msg && <p className="mt-3 text-center text-[12.5px] font-bold text-amber-300">{msg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
