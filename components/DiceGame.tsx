"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 주사위 대결 — 다 함께 굴려 가장 낮은 눈이 독박. 동점이면 그 사람들끼리 자동 재대결.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Die({ v, color, dim }: { v: number; color: string; dim?: boolean }) {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full" style={{ opacity: dim ? 0.35 : 1 }}>
      <rect x="4" y="4" width="52" height="52" rx="12" fill="#fff" stroke={color} strokeWidth="3" />
      {PIPS[v].map(([r, c], i) => (
        <circle key={i} cx={16 + c * 14} cy={16 + r * 14} r="4.5" fill={color} />
      ))}
    </svg>
  );
}

export default function DiceGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [started, setStarted] = useState(false);
  const [dice, setDice] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [alive, setAlive] = useState<number[]>([]); // 재대결 대상(동점 처리)
  const [loser, setLoser] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const n = names.length;

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() {
    if (timer.current) clearInterval(timer.current);
    setStarted(false); setDice([]); setRolling(false); setAlive([]); setLoser(null); setMsg("");
  }

  function roll(targets: number[]) {
    setRolling(true);
    setLoser(null);
    setMsg(targets.length < n ? "동점! 재대결 🎲" : "주사위 굴리는 중…");
    const final = names.map((_, i) => (targets.includes(i) ? 1 + Math.floor(Math.random() * 6) : dice[i] ?? 0));
    let ticks = 0;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      ticks++;
      setDice(names.map((_, i) => (targets.includes(i) ? 1 + Math.floor(Math.random() * 6) : final[i])));
      if (ticks % 2 === 0) sfx.roll();
      if (ticks >= 14) {
        clearInterval(timer.current!);
        setDice(final);
        setRolling(false);
        // 최저값 찾기
        let min = 7;
        for (const i of targets) min = Math.min(min, final[i]);
        const low = targets.filter((i) => final[i] === min);
        if (low.length === 1) {
          setLoser(names[low[0]]);
          setMsg(`최저 ${min} — 독박 결정!`);
          setAlive([]);
          sfx.boom();
        } else {
          setAlive(low);
          setMsg(`${min} 동점 ${low.length}명! 잠시 후 재대결`);
          sfx.suspense();
          setTimeout(() => roll(low), 1100);
        }
      }
    }, 90);
  }

  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setStarted(true);
    const all = clean.map((_, i) => i);
    setAlive(all);
    setDice(clean.map(() => 1));
    setTimeout(() => roll(all), 60);
  }

  const showDice = started && dice.length === n;

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
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))} maxLength={10} disabled={started}
                className="w-full bg-transparent text-[15px] font-bold text-white outline-none disabled:opacity-60" />
            </div>
          ))}
        </div>
        {!started ? (
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-violet-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(167,139,250,0.45)] transition hover:brightness-110">주사위 굴리기 🎲</button>
        ) : (
          <div className="mt-5 flex gap-2">
            <button onClick={start} disabled={rolling} className="flex-1 rounded-2xl bg-violet-400 py-3 text-[14px] font-black text-black transition hover:brightness-110 disabled:opacity-40">다시 굴리기</button>
            <button onClick={reset} className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
          </div>
        )}
      </div>

      {/* 주사위 */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : rolling ? "ROLLING…" : started ? "결과" : "SET NAMES"}</span>
          <span className="text-violet-300">가장 낮은 눈 = 독박</span>
        </div>

        {showDice ? (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {names.map((nm, i) => {
              const isLoser = loser === nm;
              const inRound = alive.length === 0 || alive.includes(i) || (loser && true);
              return (
                <div key={i} className={`rounded-2xl p-2.5 text-center ring-1 transition ${isLoser ? "bg-fuchsia-600/25 ring-fuchsia-400/50" : "bg-black/25 ring-white/10"}`}>
                  <div className="mx-auto h-12 w-12">
                    <Die v={dice[i] || 1} color={COLORS[i % COLORS.length]} dim={!rolling && alive.length > 0 && !alive.includes(i) && !isLoser} />
                  </div>
                  <p className="mt-1.5 truncate text-[12px] font-black" style={{ color: COLORS[i % COLORS.length] }}>{nm}</p>
                  <p className="text-[11px] font-bold text-white/50">{rolling ? "…" : `${dice[i] || "-"}`}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 flex h-40 items-center justify-center rounded-2xl bg-black/20 text-[14px] text-white/40 ring-1 ring-white/10">
            이름 넣고 ‘주사위 굴리기’를 눌러요
          </div>
        )}

        <div className="mt-4">
          {loser ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">{msg}</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
              {msg || (started ? "" : "동점이면 그 사람들끼리 자동으로 재대결해요!")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
