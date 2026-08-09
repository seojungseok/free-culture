"use client";

import { useRef, useState, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 손가락 뱀 룰렛 — 다 같이 손가락을 올리면 가운데서 뱀이 나와 손가락 사이를 돌아다니다가 한 명을 콱! 물어요.
// 물린 사람이 독박. 참가 인원이 많을수록 뱀이 더 오래(10초+) 돌아다녀 긴장감 UP.
// 기기 최대치(아이패드 11개 등)까지 각자 다른 색이 나오도록 넉넉히. 인위적 인원 제한 없음.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6", "#ff6b35", "#18e0d8"];
type Finger = { x: number; y: number; color: string };
type Pt = [number, number];

function shuffle<T>(a: T[]): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
const jit = (v: number, d = 26) => v + (Math.random() - 0.5) * d;

export default function FingerRoulette() {
  const [fingers, setFingers] = useState<Record<number, Finger>>({});
  const [phase, setPhase] = useState<"idle" | "counting" | "hunting" | "bitten">("idle");
  const [count, setCount] = useState(3);
  const [head, setHead] = useState<Pt | null>(null);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [frozen, setFrozen] = useState<Record<number, Finger>>({});

  const areaRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const countT = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);
  const order = useRef(0);
  const fingersRef = useRef<Record<number, Finger>>({}); // 비동기 콜백용 최신 손가락
  const phaseRef = useRef<"idle" | "counting" | "hunting" | "bitten">("idle");
  function setPh(p: "idle" | "counting" | "hunting" | "bitten") { phaseRef.current = p; setPhase(p); }

  const n = Object.keys(fingers).length;
  useEffect(() => () => stopAll(), []);
  function stopAll() {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (countT.current) clearInterval(countT.current);
    if (beatT.current) clearTimeout(beatT.current);
    if (biteT.current) clearTimeout(biteT.current);
  }

  function pos(e: React.PointerEvent): Pt { const r = areaRef.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function down(e: React.PointerEvent) {
    if (phaseRef.current === "hunting" || phaseRef.current === "bitten") return;
    e.preventDefault();
    const [x, y] = pos(e);
    setFingers((cur) => {
      const next = { ...cur, [e.pointerId]: { x, y, color: COLORS[order.current++ % COLORS.length] } };
      fingersRef.current = next;
      if (Object.keys(next).length >= 2 && phaseRef.current === "idle") setTimeout(startCount, 0);
      return next;
    });
  }
  function move(e: React.PointerEvent) {
    if (phaseRef.current === "hunting" || phaseRef.current === "bitten" || !fingersRef.current[e.pointerId]) return;
    const [x, y] = pos(e);
    setFingers((cur) => { const next = cur[e.pointerId] ? { ...cur, [e.pointerId]: { ...cur[e.pointerId], x, y } } : cur; fingersRef.current = next; return next; });
  }
  function up(e: React.PointerEvent) {
    if (phaseRef.current === "hunting" || phaseRef.current === "bitten") return;
    setFingers((cur) => {
      const next = { ...cur }; delete next[e.pointerId];
      fingersRef.current = next;
      if (Object.keys(next).length < 2 && phaseRef.current === "counting") { if (countT.current) clearInterval(countT.current); setPh("idle"); }
      return next;
    });
  }

  function startCount() {
    if (phaseRef.current !== "idle" && phaseRef.current !== "counting") return;
    if (countT.current) clearInterval(countT.current);
    setPh("counting"); setCount(3); sfx.count();
    let c = 3;
    countT.current = setInterval(() => {
      c -= 1;
      if (c > 0) { setCount(c); sfx.count(); }
      else { if (countT.current) clearInterval(countT.current); startHunt(); }
    }, 1000);
  }

  function startHunt() {
    const snap = { ...fingersRef.current };
    const ids = Object.keys(snap).map(Number);
    if (ids.length < 2) { setPh("idle"); return; }
    setFrozen(snap);
    const rect = areaRef.current!.getBoundingClientRect();
    const center: Pt = [rect.width / 2, rect.height / 2];
    const target = ids[Math.floor(Math.random() * ids.length)];
    const near = (id: number): Pt => [jit(snap[id].x, 42), jit(snap[id].y, 42)]; // 근처만(정확히 안 앉음)

    // 전원(타깃 포함)을 골고루 근처까지 훑어 누가 걸릴지 못 알아채게. 인원 많을수록 더 오래.
    const rounds = Math.max(8, ids.length * 3);
    let seq: number[] = [];
    while (seq.length < rounds) seq = seq.concat(shuffle(ids));
    seq = seq.slice(0, rounds);
    // 마지막 로밍이 곧장 타깃이 되지 않도록: 끝에서 두 번째는 타깃이 아닌 손가락으로
    if (ids.length > 1 && seq[seq.length - 1] === target) {
      const alt = seq[seq.length - 2] !== target ? seq[seq.length - 2] : ids.find((i) => i !== target)!;
      seq[seq.length - 1] = alt;
    }
    const way: Pt[] = [center];
    for (let i = 0; i < seq.length; i++) {
      way.push(near(seq[i]));
      if (i % 3 === 2) way.push([jit(center[0], 60), jit(center[1], 60)]);
    }
    way.push(near(target), [snap[target].x, snap[target].y]); // 마지막에만 정확히 물기

    // 세그먼트 길이
    const seg: number[] = [0]; let total = 0;
    for (let i = 1; i < way.length; i++) { total += Math.hypot(way[i][0] - way[i - 1][0], way[i][1] - way[i - 1][1]); seg.push(total); }

    // 10초 + 인원당 증가
    const DUR = 10000 + ids.length * 1400;
    setPh("hunting"); setChosen(null); setTrail([]);
    doneRef.current = false;
    sfx.hiss();
    const t0 = performance.now();
    const trailArr: Pt[] = [];

    // 물기 확정(중복 방지) — rAF 종료 또는 시간 fallback 중 먼저 온 쪽이 실행
    const finalize = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (raf.current) cancelAnimationFrame(raf.current);
      if (beatT.current) clearTimeout(beatT.current);
      setHead([snap[target].x, snap[target].y]);
      setChosen(target); setPh("bitten");
      sfx.bite(); setTimeout(() => sfx.boom(), 90);
    };
    biteT.current = setTimeout(finalize, DUR + 300); // 절전·백그라운드에서도 확실히 종료

    // 가속 심장박동
    const beat = () => {
      const prog = Math.min(1, (performance.now() - t0) / DUR);
      sfx.heartbeat();
      if (prog > 0.5 && Math.random() < 0.5) sfx.hiss();
      const delay = 560 - prog * 400; // 560ms → 160ms
      beatT.current = setTimeout(beat, Math.max(155, delay));
    };
    beat();

    const step = (now: number) => {
      let prog = Math.min(1, (now - t0) / DUR);
      const eased = prog < 0.9 ? prog : 0.9 + (prog - 0.9); // 마지막 구간 그대로(돌진)
      const d = eased * total;
      let i = 1; while (i < seg.length && seg[i] < d) i++;
      const a = way[i - 1], b = way[Math.min(i, way.length - 1)];
      const sl = seg[i] - seg[i - 1] || 1;
      const k = Math.min(1, (d - seg[i - 1]) / sl);
      const h: Pt = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      trailArr.push(h); if (trailArr.length > 24) trailArr.shift();
      setHead(h); setTrail([...trailArr]);
      if (prog < 1) { raf.current = requestAnimationFrame(step); }
      else { finalize(); }
    };
    raf.current = requestAnimationFrame(step);
  }

  function reset() { stopAll(); setFingers({}); fingersRef.current = {}; setFrozen({}); setHead(null); setTrail([]); setChosen(null); setPh("idle"); order.current = 0; }

  const shown = phase === "hunting" || phase === "bitten" ? frozen : fingers;
  const dir = trail.length >= 2 ? Math.atan2(trail[trail.length - 1][1] - trail[trail.length - 2][1], trail[trail.length - 1][0] - trail[trail.length - 2][0]) : 0;

  return (
    <div className="mx-auto max-w-[520px]">
      <div
        ref={areaRef}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
        className={`relative aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-3xl border border-white/12 bg-[radial-gradient(circle_at_50%_45%,rgba(40,120,60,0.28),transparent_62%)] ring-1 ring-white/10 ${phase === "bitten" ? "game-shake" : ""}`}
        style={{ touchAction: "none" }}
      >
        {/* 안내 */}
        {n === 0 && phase === "idle" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="text-[46px]">🐍</div>
            <p className="mt-2 text-[16px] font-black text-white">여기에 다 같이 손가락을 올려요</p>
            <p className="mt-1 text-[13px] text-white/55">2명 이상 올리면 뱀이 나와<br /><b className="text-white">돌아다니다 한 명을 콱! 물어요</b> (기기가 되는 만큼)</p>
          </div>
        )}
        {phase === "counting" && (
          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-center">
            <div className="text-[52px] font-black text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.5)]">{count}</div>
            <p className="text-[13px] font-bold text-white/70">손 떼지 마세요! 뱀이 깨어나요…</p>
          </div>
        )}
        {phase === "hunting" && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-center">
            <p className="text-[14px] font-black text-emerald-300 drop-shadow-[0_0_10px_rgba(0,255,157,0.6)]">🐍 뱀이 노리는 중… 손 떼지 마!</p>
          </div>
        )}

        {/* SVG: 손가락 + 뱀 (px 좌표계) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {/* 손가락 */}
          {Object.entries(shown).map(([id, f]) => {
            const on = Number(id) === chosen;
            const dim = phase === "bitten" && !on;
            return (
              <g key={id} opacity={dim ? 0.25 : 1}>
                <circle cx={f.x} cy={f.y} r={on ? 40 : 30} fill={`${f.color}${on ? "55" : "22"}`} stroke={f.color} strokeWidth={on ? 5 : 3} />
                {on && <text x={f.x} y={f.y + 1} fontSize="30" textAnchor="middle" dominantBaseline="middle">💀</text>}
              </g>
            );
          })}

          {/* 뱀 몸통(트레일) */}
          {trail.length > 1 && (
            <polyline
              points={trail.map((p) => p.join(",")).join(" ")}
              fill="none" stroke="#2fe07a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"
              opacity="0.9" style={{ filter: "drop-shadow(0 0 8px rgba(47,224,122,0.6))" }}
            />
          )}
          {/* 뱀 머리 */}
          {head && (
            <g transform={`translate(${head[0]},${head[1]}) rotate(${(dir * 180) / Math.PI})`}>
              <circle r="12" fill="#2fe07a" stroke="#0b0b18" strokeWidth="2" />
              <circle cx="4" cy="-4" r="2.2" fill="#0b0b18" />
              <circle cx="4" cy="4" r="2.2" fill="#0b0b18" />
              {phase === "hunting" && <path d="M12 0 l10 -4 M12 0 l10 4" stroke="#ff2e88" strokeWidth="2" fill="none" />}
            </g>
          )}
        </svg>

        {phase === "bitten" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
            <p className="text-[15px] font-black text-white">🐍 콱! 물렸어요!</p>
            <p className="text-[13px] text-white/60">💀 표시된 손가락의 주인이 독박</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button onClick={reset} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">
          {phase === "bitten" ? "다시 하기" : "초기화"}
        </button>
      </div>
      <p className="mt-3 text-center text-[12px] text-white/40">현재 {n}명 올림 · 2명부터 시작 · 인원 많을수록 뱀이 더 오래 돌아다녀요</p>
      <div className="mx-auto mt-2 max-w-[440px] rounded-xl bg-white/[0.03] px-3 py-2 text-center ring-1 ring-white/10">
        <p className="text-[11px] font-bold text-white/50">📱 기기별 동시에 올릴 수 있는 손가락 수</p>
        <p className="mt-0.5 text-[11px] text-white/40">아이폰 <b className="text-white/70">5개</b> · 아이패드 <b className="text-white/70">최대 11개</b> · 안드로이드 대부분 <b className="text-white/70">10개</b> · PC 터치스크린은 기기마다 달라요</p>
        <p className="mt-0.5 text-[10.5px] text-white/30">※ 하드웨어 제한이라 그 수만큼만 동시에 인식돼요(사이트로는 못 늘려요)</p>
      </div>
    </div>
  );
}
