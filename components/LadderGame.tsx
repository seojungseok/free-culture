"use client";

import { useState, useRef, useEffect } from "react";

// 사다리타기 — 가로줄은 가려두고(안 보임), 클릭하면 공이 쭉쭉 내려가며 길을 그림 → 벌칙 도착 순간 공개.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const ROWS = 9;
const DURATION = 3000; // 내려오는 시간(ms) — 너무 빠르지 않게, 긴장감 유지

type Ladder = boolean[][];
function makeLadder(n: number): Ladder {
  const rows: Ladder = [];
  for (let r = 0; r < ROWS; r++) {
    const row: boolean[] = Array(Math.max(n - 1, 0)).fill(false);
    for (let c = 0; c < n - 1; c++) {
      if (row[c - 1]) continue;
      if (Math.random() < 0.5) row[c] = true;
    }
    rows.push(row);
  }
  return rows;
}

const W = 340, H = 380;
type Pt = [number, number];

export default function LadderGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [penaltyCol, setPenaltyCol] = useState(0);
  const [done, setDone] = useState<Record<number, number>>({}); // start→end (완료된 추적)
  const [trails, setTrails] = useState<Record<number, Pt[]>>({}); // 완료된 색 경로
  const [live, setLive] = useState<Pt[] | null>(null); // 현재 내려오는 경로
  const [ball, setBall] = useState<Pt | null>(null);
  const [animCol, setAnimCol] = useState<number | null>(null);
  const [loser, setLoser] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const raf = useRef<number | null>(null);

  const n = names.length;
  const padX = W / (n * 2);
  const colX = (c: number) => padX + (c * (W - padX * 2)) / Math.max(n - 1, 1);
  const rowY = (r: number) => 24 + (r * (H - 48)) / ROWS;

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() {
    if (raf.current) cancelAnimationFrame(raf.current);
    setLadder(null); setDone({}); setTrails({}); setLive(null); setBall(null); setAnimCol(null); setLoser(null); setShowAll(false);
  }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setLadder(makeLadder(clean.length));
    setPenaltyCol(Math.floor(Math.random() * clean.length));
    setDone({}); setTrails({}); setLive(null); setBall(null); setAnimCol(null); setLoser(null); setShowAll(false);
  }

  // 오른각(직각) 픽셀 경로 + 도착 열
  function pixelPath(lad: Ladder, start: number): { pts: Pt[]; end: number } {
    let c = start;
    const pts: Pt[] = [[colX(c), 24]];
    for (let r = 0; r < ROWS; r++) {
      const y = rowY(r + 1);
      pts.push([colX(c), y]);
      let nc = c;
      if (c > 0 && lad[r][c - 1]) nc = c - 1;
      else if (c < lad[r].length && lad[r][c]) nc = c + 1;
      if (nc !== c) { pts.push([colX(nc), y]); c = nc; }
    }
    pts.push([colX(c), H]);
    return { pts, end: c };
  }

  function play(startCol: number) {
    if (!ladder || animCol !== null || done[startCol] !== undefined) return;
    const { pts, end } = pixelPath(ladder, startCol);
    const seg: number[] = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(total); }
    setAnimCol(startCol);
    const t0 = performance.now();
    const step = (now: number) => {
      const frac = Math.min(1, (now - t0) / DURATION);
      const d = frac * total;
      let i = 1; while (i < seg.length && seg[i] < d) i++;
      const p0 = pts[i - 1], p1 = pts[Math.min(i, pts.length - 1)];
      const segLen = seg[i] - seg[i - 1] || 1;
      const k = Math.min(1, (d - seg[i - 1]) / segLen);
      const cur: Pt = [p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k];
      setBall(cur);
      setLive([...pts.slice(0, i), cur]);
      if (frac < 1) { raf.current = requestAnimationFrame(step); }
      else {
        setTrails((t) => ({ ...t, [startCol]: pts }));
        setDone((dd) => ({ ...dd, [startCol]: end }));
        setLive(null); setBall(null); setAnimCol(null);
        if (end === penaltyCol) setLoser(names[startCol]);
      }
    };
    raf.current = requestAnimationFrame(step);
  }

  function playRandom() {
    if (!ladder || animCol !== null) return;
    const left = names.map((_, i) => i).filter((i) => done[i] === undefined);
    if (!left.length) return;
    play(left[Math.floor(Math.random() * left.length)]);
  }

  const inPlay = ladder !== null;
  const remaining = names.map((_, i) => i).filter((i) => done[i] === undefined);
  const revealSlots = showAll || Object.keys(done).length > 0 || loser;

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
          <div className="mt-5 space-y-2">
            <div className="flex gap-2">
              <button onClick={start} className="flex-1 rounded-2xl bg-cyan-400 py-3 text-[14px] font-black text-black transition hover:brightness-110">새 사다리</button>
              <button onClick={reset} className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
            </div>
            {!showAll && animCol === null && (
              <button onClick={() => setShowAll(true)} className="w-full rounded-2xl border border-white/15 bg-white/5 py-2.5 text-[13px] font-bold text-white/70 transition hover:bg-white/10">전체 공개 👀</button>
            )}
          </div>
        )}
      </div>

      {/* 사다리 */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : animCol !== null ? "두구두구…" : inPlay ? "이름을 눌러 출발!" : "SET NAMES"}</span>
          <span className="text-cyan-300">벌칙 1명 · 가로줄 숨김</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H + 40}`} className="mx-auto w-full max-w-[440px]">
            {/* 이름(위) — 클릭해서 출발 */}
            {names.map((nm, c) => (
              <g key={c} onClick={() => play(c)} style={{ cursor: inPlay && animCol === null && done[c] === undefined ? "pointer" : "default" }}>
                <rect x={colX(c) - padX * 0.82} y={0} width={padX * 1.64} height={17} rx={5}
                  fill={done[c] !== undefined ? COLORS[c % COLORS.length] : "#15152a"} stroke={COLORS[c % COLORS.length]} strokeWidth="1.2" />
                <text x={colX(c)} y={12} fill={done[c] !== undefined ? "#000" : "#fff"} fontSize="8" fontWeight="900" textAnchor="middle">{nm.length > 4 ? nm.slice(0, 4) : nm}</text>
              </g>
            ))}
            {/* 세로줄(항상 보임) */}
            {names.map((_, c) => <line key={c} x1={colX(c)} y1={24} x2={colX(c)} y2={H} stroke="#2a2a45" strokeWidth="2" />)}

            {/* 가로줄 — 기본 숨김. 전체공개 때만 흐리게 노출 */}
            {showAll && ladder?.map((row, r) => row.map((on, c) => on ? (
              <line key={`a${r}-${c}`} x1={colX(c)} y1={rowY(r + 1)} x2={colX(c + 1)} y2={rowY(r + 1)} stroke="#3a3a5c" strokeWidth="2.5" />
            ) : null))}

            {/* 완료된 색 경로(trail) */}
            {Object.entries(trails).map(([sc, pts]) => (
              <polyline key={sc} points={pts.map((p) => p.join(",")).join(" ")} fill="none"
                stroke={COLORS[Number(sc) % COLORS.length]} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            ))}
            {/* 진행 중 경로 + 공 */}
            {live && animCol !== null && (
              <>
                <polyline points={live.map((p) => p.join(",")).join(" ")} fill="none"
                  stroke={COLORS[animCol % COLORS.length]} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
                {ball && <circle cx={ball[0]} cy={ball[1]} r="7" fill={COLORS[animCol % COLORS.length]} stroke="#fff" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 8px currentColor)" }} />}
              </>
            )}

            {/* 도착 슬롯 */}
            {names.map((_, c) => {
              const isPen = c === penaltyCol;
              const reached = Object.values(done).includes(c);
              const reveal = revealSlots && (isPen || reached || showAll);
              return (
                <g key={c}>
                  <rect x={colX(c) - padX * 0.82} y={H + 8} width={padX * 1.64} height={20} rx={6}
                    fill={reveal && isPen ? "#ff2e88" : "#15152a"} stroke={reveal && isPen ? "#ff2e88" : "#2a2a45"} strokeWidth="1.5" />
                  <text x={colX(c)} y={H + 21} fill={reveal && isPen ? "#fff" : reveal ? "#9a9ac0" : "#5a5a7a"} fontSize="9" fontWeight="900" textAnchor="middle">
                    {reveal ? (isPen ? "벌칙" : "통과") : "?"}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 레인 버튼 — 번호로 자동 출발 + 랜덤 */}
        {inPlay && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              {names.map((_, i) => (
                <button key={i} onClick={() => play(i)} disabled={animCol !== null || done[i] !== undefined}
                  className="rounded-xl px-3 py-2 text-[13px] font-black transition disabled:opacity-35"
                  style={{ background: done[i] !== undefined ? "#1a1a30" : "rgba(255,255,255,0.06)", color: done[i] !== undefined ? "#6a6a90" : COLORS[i % COLORS.length], boxShadow: done[i] === undefined && animCol === null ? `inset 0 0 0 1.5px ${COLORS[i % COLORS.length]}55` : "none" }}>
                  {i + 1}번
                </button>
              ))}
              <button onClick={playRandom} disabled={animCol !== null || remaining.length === 0}
                className="ml-auto rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-2 text-[13px] font-black text-black shadow-[0_0_18px_rgba(0,229,255,0.4)] transition hover:brightness-110 disabled:opacity-35">
                🎲 랜덤 출발
              </button>
            </div>
          </div>
        )}

        <div className="mt-3">
          {loser ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">오늘의 독박은…</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
              {animCol !== null ? "공이 내려가는 중… 어디로 갈까?" : inPlay ? "이름을 눌러 사다리를 타보세요. 가로줄은 안 보여요 — 도착해야 알 수 있어요!" : "이름 적고 '사다리 만들기'"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
