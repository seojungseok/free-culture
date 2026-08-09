"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 뱀 잡기 — 구불구불 도망치는 뱀을 5초 안에 최대한 많이 탭해서 잡아요. 잡을 때마다 뱀이 방향을 홱 바꿔 도망.
// 모두 같은 5초, 순수 반응·조준 실력 → 가장 적게 잡은 사람이 독박.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
type Pt = [number, number];
const DUR = 5000, SPEED = 3.6, HITR = 40;

export default function SnakeCatchGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "ready" | "playing" | "between" | "done">("setup");
  const [cur, setCur] = useState(0);
  const [catches, setCatches] = useState<number[]>([]);
  const [live, setLive] = useState(0);
  const [remain, setRemain] = useState(5);
  const [head, setHead] = useState<Pt | null>(null);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [flash, setFlash] = useState(false);

  const areaRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const endT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headRef = useRef<Pt>([0, 0]);
  const targetRef = useRef<Pt>([0, 0]);
  const trailRef = useRef<Pt[]>([]);
  const hitRef = useRef(0);
  const dim = useRef({ w: 300, h: 400 });

  const n = names.length;
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); if (endT.current) clearTimeout(endT.current); }, []);

  function rand() { const { w, h } = dim.current; return [40 + Math.random() * (w - 80), 40 + Math.random() * (h - 80)] as Pt; }

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { if (raf.current) cancelAnimationFrame(raf.current); if (endT.current) clearTimeout(endT.current); setPhase("setup"); setCur(0); setCatches([]); setLive(0); setHead(null); setTrail([]); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setCatches([]); setCur(0); setPhase("ready"); setHead(null);
  }
  function begin() {
    if (phase !== "ready") return;
    const r = areaRef.current!.getBoundingClientRect();
    dim.current = { w: r.width, h: r.height };
    const c: Pt = [r.width / 2, r.height / 2];
    headRef.current = c; targetRef.current = rand(); trailRef.current = [c]; hitRef.current = 0;
    setHead(c); setTrail([c]); setLive(0); setRemain(5); setPhase("playing"); sfx.go();
    const t0 = performance.now();
    const loop = () => {
      const [hx, hy] = headRef.current, [tx, ty] = targetRef.current;
      const dx = tx - hx, dy = ty - hy, dist = Math.hypot(dx, dy);
      if (dist < 8) targetRef.current = rand();
      else headRef.current = [hx + (dx / dist) * SPEED, hy + (dy / dist) * SPEED];
      trailRef.current.push(headRef.current); if (trailRef.current.length > 26) trailRef.current.shift();
      setHead(headRef.current); setTrail([...trailRef.current]);
      setRemain(Math.ceil(Math.max(0, DUR - (performance.now() - t0)) / 1000));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    endT.current = setTimeout(() => {
      if (raf.current) cancelAnimationFrame(raf.current);
      setCatches((s) => { const a = [...s]; a[cur] = hitRef.current; return a; });
      setPhase("between");
    }, DUR);
  }
  function tap(e: React.PointerEvent) {
    if (phase !== "playing") return;
    const r = areaRef.current!.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const [hx, hy] = headRef.current;
    if (Math.hypot(px - hx, py - hy) < HITR) {
      hitRef.current += 1; setLive(hitRef.current); sfx.pop();
      setFlash(true); setTimeout(() => setFlash(false), 120);
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(25);
      // 잡히면 반대쪽으로 홱 도망
      const { w, h } = dim.current;
      targetRef.current = [Math.min(w - 40, Math.max(40, hx - (px - hx) * 2 + (Math.random() - 0.5) * 120)), Math.min(h - 40, Math.max(40, hy - (py - hy) * 2 + (Math.random() - 0.5) * 120))];
    }
  }
  function next() {
    if (cur + 1 < n) { setCur(cur + 1); setPhase("ready"); setLive(0); setHead(null); return; }
    setPhase("done"); sfx.boom();
  }

  const rank = phase === "done" ? names.map((_, i) => i).sort((a, b) => catches[b] - catches[a]) : [];
  const loserIdx = rank.length ? rank[rank.length - 1] : -1;
  const dir = trail.length >= 2 ? Math.atan2(trail[trail.length - 1][1] - trail[trail.length - 2][1], trail[trail.length - 1][0] - trail[trail.length - 2][0]) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          도망치는 뱀을 <b className="text-white">5초 안에 많이 탭</b>! 모두 같은 조건 · <b className="text-white">가장 적게 잡으면 독박</b>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-emerald-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(0,255,157,0.45)] transition hover:brightness-110">대결 시작 🐍</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {catches.some((c) => c !== undefined) && phase !== "done" && (
          <div className="mt-4 space-y-1">
            {names.map((nm, i) => catches[i] !== undefined && (
              <div key={i} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
                <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{nm}</span>
                <span className="font-black text-white/80">{catches[i]}마리</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 플레이 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{phase === "done" ? "결과" : phase === "playing" ? `잡아! ${remain}초` : phase === "setup" ? "SET" : "차례대로"}</span>
          <span className="text-emerald-300">최소 포획 = 독박</span>
        </div>

        {phase === "done" ? (
          <div className="mt-4 w-full space-y-1.5">
            {rank.map((i, r) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13.5px] ring-1 ${r === 0 ? "bg-amber-500/20 ring-amber-400/50" : i === loserIdx ? "bg-fuchsia-600/20 ring-fuchsia-400/40" : "bg-black/25 ring-white/10"}`}>
                <span className="font-black" style={{ color: COLORS[i % COLORS.length] }}>{r === 0 ? "🏆 " : i === loserIdx ? "💀 " : `${r + 1}위 `}{names[i]}</span>
                <span className="font-black text-white/85">{catches[i]}마리</span>
              </div>
            ))}
            <p className="pt-2 text-center text-[13px] font-bold text-white/60">가장 적게 잡은 <b className="text-fuchsia-300">{names[loserIdx]}</b>님이 독박!</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-8 flex flex-col items-center text-center">
            <div className="text-[46px]">🐍</div>
            <p className="mt-2 text-[15px] font-black text-white">도망치는 뱀을 탭해서 잡기</p>
            <p className="mt-1 text-[13px] text-white/55">잡을 때마다 홱 도망가요 · 모두 같은 5초</p>
          </div>
        ) : (
          <div className="mt-3 flex w-full flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례 ({cur + 1}/{n})</p>
            <p className="text-[20px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>
            <p className="mt-1 text-[34px] font-black tabular-nums text-emerald-300">{live}<span className="text-[14px] text-white/40"> 마리</span></p>

            {/* 아레나 */}
            <div ref={areaRef} onPointerDown={tap}
              className={`relative mt-3 aspect-[3/4] w-full max-w-[320px] touch-none select-none overflow-hidden rounded-3xl border border-white/12 ring-1 ring-white/10 ${flash ? "bg-emerald-500/20" : "bg-[radial-gradient(circle_at_50%_45%,rgba(40,120,60,0.28),transparent_62%)]"}`}
              style={{ touchAction: "none" }}>
              {phase === "ready" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
                  <p className="text-[15px] font-black text-white">준비되면 ‘시작’ → 뱀을 탭해서 잡아요!</p>
                </div>
              )}
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                {trail.length > 1 && (
                  <polyline points={trail.map((p) => p.join(",")).join(" ")} fill="none" stroke="#2fe07a" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" style={{ filter: "drop-shadow(0 0 8px rgba(47,224,122,0.6))" }} />
                )}
                {head && (
                  <g transform={`translate(${head[0]},${head[1]}) rotate(${(dir * 180) / Math.PI})`}>
                    <circle r="15" fill="#2fe07a" stroke="#0b0b18" strokeWidth="2" />
                    <circle cx="5" cy="-5" r="2.6" fill="#0b0b18" /><circle cx="5" cy="5" r="2.6" fill="#0b0b18" />
                    <path d="M15 0 l11 -4 M15 0 l11 4" stroke="#ff2e88" strokeWidth="2" fill="none" />
                  </g>
                )}
              </svg>
            </div>

            {phase === "ready" && (
              <button onClick={begin} className="mt-4 w-full max-w-[280px] rounded-2xl bg-emerald-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(0,255,157,0.5)] transition hover:brightness-110">{names[cur]} 시작! (5초)</button>
            )}
            {phase === "between" && (
              <button onClick={next} className="mt-4 rounded-2xl bg-emerald-400 px-6 py-3 text-[15px] font-black text-black transition hover:brightness-110">{cur + 1 < n ? "다음 사람 →" : "결과 보기 🏁"}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
