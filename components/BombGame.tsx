"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 폭탄 돌리기 — 순서대로 폭탄을 넘기다 터지는 순간 들고 있던 사람이 독박.
// 넘길 때마다 짧은 '치지직' 서스펜스로 심장 쫄깃. 남은 시간(넘김 횟수)은 숨김.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

export default function BombGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [started, setStarted] = useState(false);
  const [holder, setHolder] = useState(0);
  const [fuse, setFuse] = useState(0); // 남은 넘김(숨김)
  const [suspense, setSuspense] = useState(false);
  const [boom, setBoom] = useState<string | null>(null);
  const [passes, setPasses] = useState(0);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);

  const n = names.length;

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() {
    if (t.current) clearTimeout(t.current);
    setStarted(false); setHolder(0); setFuse(0); setSuspense(false); setBoom(null); setPasses(0);
  }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setStarted(true);
    setHolder(Math.floor(Math.random() * clean.length));
    // 총 넘김 횟수: 최소 한 바퀴 이상, 예측 불가
    setFuse(clean.length + 2 + Math.floor(Math.random() * clean.length * 2));
    setSuspense(false); setBoom(null); setPasses(0);
  }

  function pass() {
    if (!started || boom || suspense) return;
    setSuspense(true);
    sfx.suspense();
    const delay = 450 + Math.floor(Math.random() * 750); // 치지직 서스펜스
    t.current = setTimeout(() => {
      setFuse((f) => {
        const nf = f - 1;
        if (nf <= 0) {
          setBoom(names[holder]); // 지금 들고 있던 사람이 터짐
          setSuspense(false);
          sfx.boom();
          return 0;
        }
        setHolder((h) => (h + 1) % n);
        setPasses((p) => p + 1);
        setSuspense(false);
        sfx.tick();
        return nf;
      });
    }, delay);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-rose-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
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
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))} maxLength={10} disabled={started}
                className="w-full bg-transparent text-[15px] font-bold text-white outline-none disabled:opacity-60" />
            </div>
          ))}
        </div>
        {!started ? (
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-rose-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,82,82,0.45)] transition hover:brightness-110">폭탄 점화 💣</button>
        ) : (
          <div className="mt-5 flex gap-2">
            <button onClick={start} className="flex-1 rounded-2xl bg-rose-400 py-3 text-[14px] font-black text-black transition hover:brightness-110">새 폭탄</button>
            <button onClick={reset} className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
          </div>
        )}
      </div>

      {/* 폭탄 */}
      <div className={`rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 ${suspense ? "animate-pulse" : ""}`}>
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{boom ? "BOOM 💥" : started ? "폭탄을 넘겨요" : "SET NAMES"}</span>
          <span className="text-rose-300">언제 터질지 몰라요</span>
        </div>

        {boom ? (
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-rose-600/40 to-fuchsia-700/30 p-6 text-center ring-1 ring-rose-400/50">
            <div className="text-[64px] leading-none">💥</div>
            <p className="mt-2 text-[13px] font-bold text-white/80">폭탄이 터졌어요! 오늘의 독박은…</p>
            <p className="mt-1 text-[30px] font-black text-white drop-shadow-[0_0_14px_rgba(255,82,82,0.8)]">💀 {boom}</p>
          </div>
        ) : started ? (
          <div className="mt-4 flex flex-col items-center">
            <div className="rounded-2xl bg-black/30 px-6 py-3 text-center ring-1 ring-white/10">
              <span className="text-[13px] text-white/50">지금 폭탄을 든 사람</span>
              <p className="mt-0.5 text-[26px] font-black" style={{ color: COLORS[holder % COLORS.length] }}>{names[holder]}</p>
            </div>
            <div className={`my-6 text-[80px] leading-none transition ${suspense ? "scale-110" : "scale-100"}`}>💣</div>
            <button onClick={pass} disabled={suspense}
              className="w-full max-w-[280px] rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,82,82,0.5)] transition hover:brightness-110 disabled:opacity-70">
              {suspense ? "치지직… 🔥" : "폭탄 넘기기 💣"}
            </button>
            <p className="mt-3 text-[12px] text-white/40">넘긴 횟수 {passes} · 폭탄을 든 채 터지면 독박!</p>
          </div>
        ) : (
          <div className="mt-4 flex h-52 items-center justify-center rounded-2xl bg-black/20 text-[14px] text-white/40 ring-1 ring-white/10">
            이름 넣고 ‘폭탄 점화’를 눌러요
          </div>
        )}
      </div>
    </div>
  );
}
