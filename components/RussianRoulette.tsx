"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 역발상 러시안룰렛 — N명이면 N-1발 장전, 빈 약실(불발) 1개.
// 자기 차례에 '방아쇠 당기기' 또는 '재장전(1회)'으로 운명을 바꿀 수 있어요.
// 재장전 = 실린더를 다시 돌려 불발을 남은 사람에게 무작위 재배치하고 차례를 넘김(이번엔 세이프, 위험은 계속).
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

export default function RussianRoulette() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "play" | "done">("setup");
  const [pool, setPool] = useState<number[]>([]);   // 아직 살아있는(안 뽑고 안 걸린) 사람들
  const [turnPtr, setTurnPtr] = useState(0);         // pool 내 현재 차례
  const [reloads, setReloads] = useState<number[]>([]); // 각자 남은 재장전 횟수
  const [busy, setBusy] = useState(false);           // 방아쇠 서스펜스/재장전 애니 중
  const [feedback, setFeedback] = useState("");      // 탕!/재장전 안내
  const [loser, setLoser] = useState<string | null>(null);
  const [cyl, setCyl] = useState(0);
  const empty = useRef(0);
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;
  useEffect(() => () => { if (t1.current) clearTimeout(t1.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    hardReset();
  }
  function hardReset() { if (t1.current) clearTimeout(t1.current); setPhase("setup"); setPool([]); setTurnPtr(0); setReloads([]); setBusy(false); setFeedback(""); setLoser(null); }

  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    const idx = clean.map((_, i) => i);
    setPool(idx);
    empty.current = Math.floor(Math.random() * clean.length);
    setReloads(clean.map(() => 1));
    setTurnPtr(0); setBusy(false); setFeedback(""); setLoser(null);
    setCyl((c) => c + 720);
    setPhase("play");
    sfx.whoosh();
  }

  const cur = phase === "play" && pool.length ? pool[turnPtr] : -1;

  function pull() {
    if (phase !== "play" || busy) return;
    setBusy(true); setFeedback(""); sfx.suspense();
    if (t1.current) clearTimeout(t1.current);
    t1.current = setTimeout(() => {
      const p = pool[turnPtr];
      if (p === empty.current) {
        setLoser(names[p]); setPhase("done"); sfx.boom(); setBusy(false); return;
      }
      // 탕! 세이프 → 풀에서 빠짐
      sfx.go();
      const next = pool.filter((x) => x !== p);
      if (next.length === 1) {
        // 남은 1명이 곧 불발 보유자 → 독박
        setLoser(names[next[0]]); setPhase("done"); setBusy(false);
        setTimeout(() => sfx.boom(), 300);
        return;
      }
      setFeedback(`탕! ${names[p]} 세이프 🎉`);
      setPool(next);
      setTurnPtr((tp) => tp % next.length);
      setBusy(false);
    }, 550 + Math.random() * 750);
  }

  function reload() {
    if (phase !== "play" || busy) return;
    const p = pool[turnPtr];
    if (reloads[p] <= 0) return;
    setBusy(true); setFeedback("");
    setCyl((c) => c + 720 + Math.floor(Math.random() * 360));
    sfx.whoosh();
    setReloads((r) => r.map((v, i) => (i === p ? v - 1 : v)));
    if (t1.current) clearTimeout(t1.current);
    t1.current = setTimeout(() => {
      empty.current = pool[Math.floor(Math.random() * pool.length)];
      setFeedback(`🔄 ${names[p]} 재장전! 운명을 넘겼어요`);
      setTurnPtr((tp) => (tp + 1) % pool.length);
      setBusy(false);
    }, 1100);
  }

  const bullets = Math.max(n - 1, 0);
  const safeList = phase !== "setup" ? names.map((_, i) => i).filter((i) => !pool.includes(i) && names[i] !== loser) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-rose-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          {n}명 · <span className="text-amber-300">{bullets}발 장전</span> · 빈 약실 1개 — <b className="text-white">불발되는 사람이 독박!</b><br />
          <span className="text-emerald-300">자기 차례에 ‘재장전’으로 운명을 바꿀 수 있어요 (각자 1회).</span>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-rose-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,82,82,0.45)] transition hover:brightness-110">게임 시작 🔫</button>
        ) : (
          <button onClick={hardReset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {/* 세이프/생존 현황 */}
        {phase !== "setup" && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {safeList.map((i) => (
              <span key={i} className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">{names[i]} 세이프</span>
            ))}
          </div>
        )}
      </div>

      {/* 리볼버 */}
      <div className={`flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 ${loser ? "game-shake" : ""}`}>
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "불발… 독박!" : phase === "play" ? "당길까, 재장전할까?" : "SET NAMES"}</span>
          <span className="text-rose-300">불발 = 독박</span>
        </div>

        {/* 실린더 */}
        <div className="relative my-4 aspect-square w-full max-w-[230px]">
          <svg viewBox="0 0 200 200" className="w-full">
            <circle cx="100" cy="100" r="92" fill="#111124" stroke="#2a2a45" strokeWidth="4" />
            <g style={{ transform: `rotate(${cyl}deg)`, transformOrigin: "100px 100px", transition: busy ? "transform 1.1s cubic-bezier(0.2,0.8,0.2,1)" : "transform 0.4s ease-out" }}>
              {Array.from({ length: Math.max(n, 2) }, (_, i) => {
                const a = ((i * (360 / n) - 90) * Math.PI) / 180;
                const x = 100 + 58 * Math.cos(a), y = 100 + 58 * Math.sin(a);
                return <circle key={i} cx={x} cy={y} r="15" fill="#0b0b18" stroke="#3a3a5c" strokeWidth="3" />;
              })}
              <circle cx="100" cy="100" r="16" fill="#0b0b18" stroke="#3a3a5c" strokeWidth="3" />
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[44px]">
            {loser ? "😱" : phase === "play" ? (busy ? "😨" : "🔫") : "🔫"}
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
            <p className="text-[24px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>
            {feedback && <p className="mt-1 text-[13px] font-bold text-emerald-300">{feedback}</p>}

            <div className="mt-4 grid w-full max-w-[300px] grid-cols-2 gap-2">
              <button onClick={pull} disabled={busy}
                className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 py-4 text-[15px] font-black text-black shadow-[0_0_20px_rgba(255,82,82,0.5)] transition hover:brightness-110 disabled:opacity-60">
                {busy ? "…철컥…" : "방아쇠 🔫"}
              </button>
              <button onClick={reload} disabled={busy || reloads[cur] <= 0}
                className="rounded-2xl bg-white/10 py-4 text-[15px] font-black text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-35">
                🔄 재장전<br /><span className="text-[11px] font-bold text-white/60">남음 {reloads[cur] ?? 0}회</span>
              </button>
            </div>
            <p className="mt-3 text-[12px] text-white/40">재장전하면 이번엔 넘어가지만, 위험은 다음 바퀴에 다시 올 수 있어요</p>
          </div>
        ) : (
          <p className="w-full rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">이름 넣고 ‘게임 시작’</p>
        )}
      </div>
    </div>
  );
}
