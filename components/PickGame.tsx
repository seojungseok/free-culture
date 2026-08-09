"use client";

import { useState } from "react";

// 제비뽑기(폭탄 카드) — 순서대로 카드를 한 장씩 뒤집고, 💣 폭탄을 뽑은 사람이 독박.
// 카드 수 = 인원 수, 폭탄 1장 → 누군가는 반드시 걸림. 회식·술자리 벌칙용.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function PickGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [order, setOrder] = useState<number[] | null>(null); // 뽑는 순서(플레이어 인덱스)
  const [bomb, setBomb] = useState(-1); // 폭탄 카드 위치
  const [flipped, setFlipped] = useState<Record<number, number>>({}); // 카드 위치 → 뽑은 순번
  const [turn, setTurn] = useState(0);
  const [loser, setLoser] = useState<string | null>(null);

  const n = names.length;
  const inPlay = order !== null;

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { setOrder(null); setBomb(-1); setFlipped({}); setTurn(0); setLoser(null); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean);
    setOrder(shuffle(clean.map((_, i) => i)));
    setBomb(Math.floor(Math.random() * clean.length));
    setFlipped({}); setTurn(0); setLoser(null);
  }

  function flip(pos: number) {
    if (!order || loser || flipped[pos] !== undefined) return;
    const player = order[turn];
    setFlipped((f) => ({ ...f, [pos]: turn }));
    if (pos === bomb) setLoser(names[player]);
    else setTurn((t) => t + 1);
  }

  const curPlayer = order && !loser ? names[order[turn]] : null;
  const curColor = order && !loser ? COLORS[order[turn] % COLORS.length] : "#fff";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-amber-400 text-black shadow-[0_0_20px_rgba(255,176,32,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-amber-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,176,32,0.45)] transition hover:brightness-110">카드 섞기 →</button>
        ) : (
          <div className="mt-5 flex gap-2">
            <button onClick={start} className="flex-1 rounded-2xl bg-amber-400 py-3 text-[14px] font-black text-black transition hover:brightness-110">다시 섞기</button>
            <button onClick={reset} className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
          </div>
        )}
      </div>

      {/* 카드 */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser ? "GAME OVER" : inPlay ? "카드를 골라 뒤집어요" : "SET NAMES"}</span>
          <span className="text-amber-300">💣 폭탄 1장</span>
        </div>

        {inPlay && !loser && (
          <div className="mt-3 rounded-2xl bg-black/30 p-3 text-center ring-1 ring-white/10">
            <span className="text-[13px] text-white/50">지금 뽑을 차례</span>
            <p className="mt-0.5 text-[20px] font-black" style={{ color: curColor }}>👉 {curPlayer}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {Array.from({ length: n }, (_, pos) => {
            const fl = flipped[pos] !== undefined;
            const isBomb = pos === bomb;
            const drewBy = fl ? names[order![flipped[pos]]] : null;
            return (
              <button key={pos} onClick={() => flip(pos)} disabled={fl || !!loser}
                className="relative aspect-[3/4] rounded-2xl border transition"
                style={{
                  transform: fl ? "rotateY(0deg)" : "none",
                  background: fl ? (isBomb ? "linear-gradient(135deg,#ff2e88,#7a1030)" : "#15152a") : "linear-gradient(135deg,#1e1e3a,#12122a)",
                  borderColor: fl ? (isBomb ? "#ff2e88" : "#2a2a45") : "rgba(255,255,255,0.12)",
                  boxShadow: fl && isBomb ? "0 0 24px rgba(255,46,136,0.6)" : "none",
                  cursor: fl || loser ? "default" : "pointer",
                }}>
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  {fl ? (
                    <>
                      <span className="text-[30px]">{isBomb ? "💣" : "😌"}</span>
                      <span className={`mt-1 text-[11px] font-black ${isBomb ? "text-white" : "text-white/50"}`}>{isBomb ? "폭탄!" : "통과"}</span>
                      {drewBy && <span className="mt-0.5 text-[9px] text-white/40">{drewBy}</span>}
                    </>
                  ) : (
                    <span className="text-[26px] font-black text-white/25">?</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {loser ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">💣 폭탄을 뽑은 오늘의 독박은…</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {loser}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
              {inPlay ? "한 명씩 순서대로 카드를 뒤집어요. 💣 폭탄을 뽑는 사람이 독박!" : "이름 적고 '카드 섞기'"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
