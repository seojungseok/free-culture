"use client";

import { useState } from "react";

// 사다리게임 — 이름 입력 → 사다리 타고 내려와 한 명이 '벌칙(독박)'에 당첨.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const ROWS = 8;

type Ladder = boolean[][]; // rungs[row][col] = col과 col+1 사이 가로줄

function makeLadder(n: number): Ladder {
  const rows: Ladder = [];
  for (let r = 0; r < ROWS; r++) {
    const row: boolean[] = Array(n - 1).fill(false);
    for (let c = 0; c < n - 1; c++) {
      if (row[c - 1]) continue; // 인접 가로줄 겹침 방지
      if (Math.random() < 0.45) row[c] = true;
    }
    rows.push(row);
  }
  return rows;
}
// 시작 열 → 도착 열, 지나온 (row,col) 경로
function trace(ladder: Ladder, start: number): { end: number; path: [number, number][] } {
  let c = start;
  const path: [number, number][] = [[0, c]];
  for (let r = 0; r < ROWS; r++) {
    if (c > 0 && ladder[r][c - 1]) c -= 1;
    else if (c < ladder[r].length && ladder[r][c]) c += 1;
    path.push([r + 1, c]);
  }
  return { end: c, path };
}

export default function LadderGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [penaltyCol, setPenaltyCol] = useState(0);
  const [active, setActive] = useState<number | null>(null); // 추적 중인 시작 열
  const [revealed, setRevealed] = useState<Record<number, number>>({}); // start→end
  const [loser, setLoser] = useState<string | null>(null);

  function setN(n: number) {
    setCount(n);
    setNames((p) => Array.from({ length: n }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { setLadder(null); setActive(null); setRevealed({}); setLoser(null); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setLadder(makeLadder(clean.length));
    setPenaltyCol(Math.floor(Math.random() * clean.length));
    setActive(null); setRevealed({}); setLoser(null);
  }

  const n = names.length;
  const W = 320, H = 360, padX = W / (n * 2), colX = (c: number) => padX + (c * (W - padX * 2)) / (n - 1);
  const rowY = (r: number) => 20 + (r * (H - 40)) / ROWS;

  function tracePlayer(startCol: number) {
    if (!ladder) return;
    setActive(startCol);
    const { end } = trace(ladder, startCol);
    setRevealed((p) => ({ ...p, [startCol]: end }));
    if (end === penaltyCol) setLoser(names[startCol]);
  }

  const inPlay = ladder !== null;
  const tracePath = active !== null && ladder ? trace(ladder, active).path : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-cyan-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>

        <p className="mt-5 text-[13px] font-bold text-white/60">몇 명이 함께하나요? (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,229,255,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
          ))}
        </div>

        <p className="mt-5 text-[13px] font-bold text-white/60">참가자 이름</p>
        <div className="mt-2 space-y-2">
          {names.map((nm, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[13px] font-black text-black" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))} maxLength={10} disabled={inPlay}
                className="w-full bg-transparent text-[15px] font-bold text-white outline-none disabled:opacity-60" />
            </div>
          ))}
        </div>

        {!inPlay ? (
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-cyan-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(0,229,255,0.45)] transition hover:brightness-110">사다리 만들기 →</button>
        ) : (
          <div className="mt-5 flex gap-2">
            <button onClick={start} className="flex-1 rounded-2xl bg-cyan-400 py-3 text-[14px] font-black text-black transition hover:brightness-110">사다리 다시</button>
            <button onClick={reset} className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
          </div>
        )}
      </div>

      {/* 사다리 */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : inPlay ? "이름을 눌러 사다리 타기" : "SET NAMES"}</span>
          <span className="text-cyan-300">벌칙 1명</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H + 40}`} className="mx-auto w-full max-w-[420px]">
            {/* 이름(위) */}
            {names.map((nm, c) => (
              <g key={c} onClick={() => inPlay && tracePlayer(c)} style={{ cursor: inPlay ? "pointer" : "default" }}>
                <rect x={colX(c) - padX * 0.8} y={0} width={padX * 1.6} height={16} rx={5} fill={active === c ? COLORS[c % COLORS.length] : "#15152a"} stroke={COLORS[c % COLORS.length]} strokeWidth="1" />
                <text x={colX(c)} y={11} fill={active === c ? "#000" : "#fff"} fontSize="8" fontWeight="900" textAnchor="middle">{nm.length > 4 ? nm.slice(0, 4) : nm}</text>
              </g>
            ))}
            {/* 세로줄 */}
            {names.map((_, c) => (
              <line key={c} x1={colX(c)} y1={20} x2={colX(c)} y2={H} stroke="#2a2a45" strokeWidth="2" />
            ))}
            {/* 가로줄(rung) */}
            {ladder?.map((row, r) => row.map((on, c) => on ? (
              <line key={`${r}-${c}`} x1={colX(c)} y1={rowY(r + 1)} x2={colX(c + 1)} y2={rowY(r + 1)} stroke="#3a3a5c" strokeWidth="2.5" />
            ) : null))}
            {/* 추적 경로 */}
            {tracePath && (
              <polyline
                points={tracePath.map(([r, c]) => `${colX(c)},${r === 0 ? 20 : rowY(r)}`).join(" ")}
                fill="none" stroke={COLORS[(active ?? 0) % COLORS.length]} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
            )}
            {/* 도착 슬롯 */}
            {names.map((_, c) => {
              const isPenalty = c === penaltyCol;
              const hit = Object.values(revealed).includes(c) || (loser && trace(ladder!, names.indexOf(loser)).end === c);
              return (
                <g key={c}>
                  <rect x={colX(c) - padX * 0.8} y={H + 6} width={padX * 1.6} height={20} rx={6}
                    fill={isPenalty && (loser || Object.keys(revealed).length) ? "#ff2e88" : "#15152a"} stroke={isPenalty && (loser || Object.keys(revealed).length) ? "#ff2e88" : "#2a2a45"} strokeWidth="1.5" />
                  <text x={colX(c)} y={H + 19} fill={isPenalty && (loser || Object.keys(revealed).length) ? "#fff" : "#7a7a99"} fontSize="9" fontWeight="900" textAnchor="middle">
                    {isPenalty && (loser || Object.keys(revealed).length) ? "벌칙" : hit ? "통과" : "?"}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4">
          {loser ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">오늘의 독박은…</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
              {inPlay ? "위의 이름을 눌러 사다리를 타보세요! 벌칙 칸에 도착하면 독박 🎯" : "이름 적고 '사다리 만들기'"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
