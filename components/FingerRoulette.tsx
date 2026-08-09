"use client";

import { useRef, useState, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 손가락 룰렛 — 다 같이 화면에 손가락을 올리면 3초 뒤 랜덤으로 한 명 지목(독박). 모바일 멀티터치.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];

type Finger = { x: number; y: number; color: string };

export default function FingerRoulette() {
  const [fingers, setFingers] = useState<Record<number, Finger>>({});
  const [phase, setPhase] = useState<"idle" | "counting" | "picked">("idle");
  const [count, setCount] = useState(3);
  const [chosen, setChosen] = useState<number | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const order = useRef(0);

  const n = Object.keys(fingers).length;

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function clearTimer() { if (timer.current) { clearInterval(timer.current); timer.current = null; } }

  function startCount() {
    clearTimer();
    setPhase("counting");
    setCount(3);
    let c = 3;
    sfx.count();
    timer.current = setInterval(() => {
      c -= 1;
      if (c > 0) { setCount(c); sfx.count(); }
      else {
        clearTimer();
        // 지목
        setFingers((cur) => {
          const ids = Object.keys(cur).map(Number);
          if (ids.length < 2) { setPhase("idle"); return cur; }
          const pick = ids[Math.floor(Math.random() * ids.length)];
          setChosen(pick);
          setPhase("picked");
          sfx.boom();
          return cur;
        });
      }
    }, 1000);
  }

  function pos(e: React.PointerEvent) {
    const r = areaRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function down(e: React.PointerEvent) {
    if (phase === "picked") return;
    e.preventDefault();
    const { x, y } = pos(e);
    setFingers((cur) => {
      const next = { ...cur, [e.pointerId]: { x, y, color: COLORS[order.current++ % COLORS.length] } };
      if (Object.keys(next).length >= 2 && phase === "idle") setTimeout(startCount, 0);
      return next;
    });
  }
  function move(e: React.PointerEvent) {
    if (!fingers[e.pointerId] || phase === "picked") return;
    const { x, y } = pos(e);
    setFingers((cur) => (cur[e.pointerId] ? { ...cur, [e.pointerId]: { ...cur[e.pointerId], x, y } } : cur));
  }
  function up(e: React.PointerEvent) {
    if (phase === "picked") return;
    setFingers((cur) => {
      const next = { ...cur };
      delete next[e.pointerId];
      if (Object.keys(next).length < 2 && phase === "counting") { clearTimer(); setPhase("idle"); }
      return next;
    });
  }
  function reset() { clearTimer(); setFingers({}); setChosen(null); setPhase("idle"); order.current = 0; }

  return (
    <div className="mx-auto max-w-[520px]">
      <div
        ref={areaRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        className="relative aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-3xl border border-white/12 bg-[radial-gradient(circle_at_50%_40%,rgba(120,60,200,0.25),transparent_60%)] ring-1 ring-white/10"
        style={{ touchAction: "none" }}
      >
        {/* 안내 */}
        {n === 0 && phase === "idle" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="text-[46px]">👆</div>
            <p className="mt-2 text-[16px] font-black text-white">여기에 다 같이 손가락을 올려요</p>
            <p className="mt-1 text-[13px] text-white/55">2명 이상 올리면 3초 뒤 <b className="text-white">한 명 지목!</b><br />(휴대폰에서 여러 손가락으로)</p>
          </div>
        )}

        {/* 카운트다운 */}
        {phase === "counting" && (
          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-center">
            <div className="text-[52px] font-black text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.5)]">{count}</div>
            <p className="text-[13px] font-bold text-white/70">손 떼지 마세요!</p>
          </div>
        )}

        {/* 손가락들 */}
        {Object.entries(fingers).map(([id, f]) => {
          const isChosen = Number(id) === chosen;
          const dim = phase === "picked" && !isChosen;
          return (
            <div key={id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-all"
              style={{ left: f.x, top: f.y }}>
              <div className="rounded-full" style={{
                width: isChosen ? 108 : 72, height: isChosen ? 108 : 72,
                border: `${isChosen ? 6 : 4}px solid ${f.color}`,
                background: `${f.color}${isChosen ? "55" : "22"}`,
                boxShadow: isChosen ? `0 0 32px ${f.color}` : `0 0 14px ${f.color}88`,
                opacity: dim ? 0.25 : 1,
                marginLeft: isChosen ? -54 : -36, marginTop: isChosen ? -54 : -36,
              }} />
              {isChosen && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[34px]">💀</div>}
            </div>
          );
        })}

        {/* 결과 */}
        {phase === "picked" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
            <p className="text-[15px] font-bold text-white/80">오늘의 독박이 지목됐어요!</p>
            <p className="text-[13px] text-white/50">💀 표시된 손가락의 주인공</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button onClick={reset} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">
          {phase === "picked" ? "다시 하기" : "초기화"}
        </button>
      </div>
      <p className="mt-3 text-center text-[12px] text-white/40">현재 {n}명 올림 · 2명 이상이면 자동으로 시작해요</p>
    </div>
  );
}
