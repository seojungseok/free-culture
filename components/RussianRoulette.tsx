"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 러시안룰렛 — 리볼버에 총알 1발. 순서대로 방아쇠를 당기다 '총알이 든 약실'을 당긴 사람이 독박.
// 자기 차례엔 방아쇠를 반드시 당겨요. 당기기 전에 '실린더 돌리기'로 총알 위치를 랜덤으로 섞을 수 있음(정직한 랜덤).
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

export default function RussianRoulette() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "play" | "done">("setup");
  const [turn, setTurn] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [spun, setSpun] = useState(false);       // 이번 차례에 실린더를 돌렸는지(표시용)
  const [feedback, setFeedback] = useState("");
  const [loser, setLoser] = useState<string | null>(null);
  const [cyl, setCyl] = useState(0);
  const steps = useRef(0); // 총알까지 남은 칸(숨김). 0이면 이번 방아쇠에 발사
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;
  useEffect(() => () => { if (t1.current) clearTimeout(t1.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    hardReset();
  }
  function hardReset() { if (t1.current) clearTimeout(t1.current); setPhase("setup"); setTurn(0); setSafeCount(0); setBusy(false); setSpun(false); setFeedback(""); setLoser(null); }

  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    steps.current = Math.floor(Math.random() * clean.length); // 총알 위치 랜덤
    setTurn(0); setSafeCount(0); setBusy(false); setSpun(false); setFeedback(""); setLoser(null);
    setCyl((c) => c + 720);
    setPhase("play");
    sfx.whoosh();
  }

  function spin() {
    if (phase !== "play" || busy) return;
    setBusy(true); setFeedback("");
    setCyl((c) => c + 720 + Math.floor(Math.random() * 360));
    sfx.whoosh();
    if (t1.current) clearTimeout(t1.current);
    t1.current = setTimeout(() => {
      steps.current = Math.floor(Math.random() * n); // 총알 위치 다시 랜덤
      setSpun(true);
      setFeedback(`🔄 ${names[turn]} 실린더 돌림 — 총알 위치가 섞였어요`);
      setBusy(false);
    }, 1000);
  }

  function pull() {
    if (phase !== "play" || busy) return;
    setBusy(true); setFeedback(""); sfx.suspense();
    if (t1.current) clearTimeout(t1.current);
    t1.current = setTimeout(() => {
      if (steps.current === 0) {
        setLoser(names[turn]); setPhase("done"); sfx.boom();
      } else {
        steps.current -= 1;
        setSafeCount((s) => s + 1);
        setFeedback(`찰칵… ${names[turn]} 세이프 🎉`);
        setSpun(false);
        setTurn((t) => (t + 1) % n);
        sfx.click();
      }
      setBusy(false);
    }, 550 + Math.random() * 750);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-rose-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          리볼버에 <span className="text-amber-300">총알 1발</span> · 순서대로 방아쇠를 당겨 <b className="text-white">총알 든 약실을 당긴 사람이 독박!</b><br />
          <span className="text-emerald-300">차례마다 방아쇠는 필수. 당기기 전 ‘실린더 돌리기’로 총알 위치를 섞을 수 있어요.</span>
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
      </div>

      {/* 리볼버 */}
      <div className={`flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 ${loser ? "game-shake" : ""}`}>
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "탕! 독박!" : phase === "play" ? (busy ? "…" : "돌릴까? 그냥 당길까?") : "SET NAMES"}</span>
          <span className="text-rose-300">총알 = 독박</span>
        </div>

        {/* 실린더 */}
        <div className="relative my-4 aspect-square w-full max-w-[230px]">
          <svg viewBox="0 0 200 200" className="w-full">
            <circle cx="100" cy="100" r="92" fill="#111124" stroke="#2a2a45" strokeWidth="4" />
            <g style={{ transform: `rotate(${cyl}deg)`, transformOrigin: "100px 100px", transition: busy ? "transform 1s cubic-bezier(0.2,0.8,0.2,1)" : "transform 0.4s ease-out" }}>
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
            <p className="text-[13px] font-bold text-white/70">💥 탕! 총알이 든 약실이었어요! 오늘의 독박은</p>
            <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
          </div>
        ) : phase === "play" ? (
          <div className="flex w-full flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례</p>
            <p className="text-[24px] font-black" style={{ color: COLORS[turn % COLORS.length] }}>{names[turn]}</p>
            {feedback && <p className="mt-1 text-[13px] font-bold text-emerald-300">{feedback}</p>}

            <div className="mt-4 grid w-full max-w-[320px] grid-cols-2 gap-2">
              <button onClick={spin} disabled={busy}
                className="rounded-2xl bg-white/10 py-4 text-[15px] font-black text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-45">
                🔄 실린더 돌리기<br /><span className="text-[11px] font-bold text-white/60">{spun ? "돌림 (총알 섞임)" : "총알 위치 섞기(선택)"}</span>
              </button>
              <button onClick={pull} disabled={busy}
                className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 py-4 text-[15px] font-black text-black shadow-[0_0_20px_rgba(255,82,82,0.5)] transition hover:brightness-110 disabled:opacity-60">
                {busy ? "…철컥…" : "🔫 방아쇠 (필수)"}
              </button>
            </div>
            <p className="mt-3 text-[12px] text-white/40">세이프 {safeCount}명 · 방아쇠는 자기 차례에 반드시 당겨야 해요</p>
          </div>
        ) : (
          <p className="w-full rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">이름 넣고 ‘게임 시작’</p>
        )}
      </div>
    </div>
  );
}
