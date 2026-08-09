"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 연타 대결 — 한 명씩 5초 안에 버튼을 최대한 많이 눌러요. 모두 같은 조건, 순수 실력·노력으로 순위 결정.
// 가장 적게 누른 사람이 독박(제일 많이 누른 사람 🏆). 턴 순서 운이 없는 '정직한' 게임.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const DURATIONS = [5, 10, 20, 30];

export default function TapBattleGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [phase, setPhase] = useState<"setup" | "ready" | "tapping" | "between" | "done">("setup");
  const [cur, setCur] = useState(0);
  const [counts, setCounts] = useState<number[]>([]);
  const [live, setLive] = useState(0);
  const [remain, setRemain] = useState(10);
  const [durSec, setDurSec] = useState(10);
  const [cool, setCool] = useState(false); // 종료 직후 잠금(다음버튼 오터치 방지)
  const tapRef = useRef(0);
  const raf = useRef<number | null>(null);
  const endT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coolT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); if (endT.current) clearTimeout(endT.current); if (coolT.current) clearTimeout(coolT.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { if (raf.current) cancelAnimationFrame(raf.current); if (endT.current) clearTimeout(endT.current); if (coolT.current) clearTimeout(coolT.current); setPhase("setup"); setCur(0); setCounts([]); setLive(0); setCool(false); }
  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setCounts([]); setCur(0); setPhase("ready");
  }
  function begin() {
    if (phase !== "ready") return;
    setPhase("tapping"); tapRef.current = 0; setLive(0); setRemain(durSec); setCool(false);
    sfx.go();
    const t0 = performance.now();
    const loop = () => {
      const left = Math.max(0, durSec * 1000 - (performance.now() - t0));
      setRemain(Math.ceil(left / 1000));
      if (left > 0) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    endT.current = setTimeout(() => {
      if (raf.current) cancelAnimationFrame(raf.current);
      const c = tapRef.current;
      setCounts((s) => { const a = [...s]; a[cur] = c; return a; });
      setPhase("between"); setCool(true);
      if (coolT.current) clearTimeout(coolT.current);
      coolT.current = setTimeout(() => setCool(false), 1000); // 1초 잠금 후 다음버튼 노출
    }, durSec * 1000);
  }
  function tap() {
    if (phase !== "tapping") return;
    tapRef.current += 1;
    setLive(tapRef.current);
  }
  function next() {
    if (coolT.current) clearTimeout(coolT.current); setCool(false);
    if (cur + 1 < n) { setCur(cur + 1); setPhase("ready"); setLive(0); return; }
    setPhase("done"); sfx.boom();
  }

  const rank = phase === "done" ? names.map((_, i) => i).sort((a, b) => counts[b] - counts[a]) : [];
  const loserIdx = rank.length ? rank[rank.length - 1] : -1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-orange-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 등록</h2>
        <p className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[12.5px] font-bold text-white/70 ring-1 ring-white/10">
          모두 <b className="text-white">같은 5초</b> 동안 버튼 연타 · <b className="text-white">가장 적게 누른 사람이 독박!</b> (순서 운 없음)
        </p>
        <p className="mt-4 text-[13px] font-bold text-white/60">시간 (길수록 힘 빠져서 더 재밌어요)</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => phase === "setup" && setDurSec(d)} disabled={phase !== "setup"}
              className={`rounded-xl py-2.5 text-[14px] font-black transition disabled:opacity-40 ${durSec === d ? "bg-orange-400 text-black shadow-[0_0_20px_rgba(255,140,32,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{d}초</button>
          ))}
        </div>

        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)} className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-orange-400 text-black shadow-[0_0_20px_rgba(255,140,32,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-orange-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,140,32,0.45)] transition hover:brightness-110">대결 시작 🔥</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {/* 기록 */}
        {counts.some((c) => c !== undefined) && phase !== "done" && (
          <div className="mt-4 space-y-1">
            {names.map((nm, i) => counts[i] !== undefined && (
              <div key={i} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
                <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{nm}</span>
                <span className="font-black text-white/80">{counts[i]}회</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 연타 영역 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{phase === "done" ? "결과" : phase === "tapping" ? "TAP TAP TAP!" : phase === "setup" ? "SET" : "차례대로"}</span>
          <span className="text-orange-300">최소 연타 = 독박</span>
        </div>

        {phase === "done" ? (
          <div className="mt-4 w-full space-y-1.5">
            {rank.map((i, r) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13.5px] ring-1 ${r === 0 ? "bg-amber-500/20 ring-amber-400/50" : i === loserIdx ? "bg-fuchsia-600/20 ring-fuchsia-400/40" : "bg-black/25 ring-white/10"}`}>
                <span className="font-black" style={{ color: COLORS[i % COLORS.length] }}>{r === 0 ? "🏆 " : i === loserIdx ? "💀 " : `${r + 1}위 `}{names[i]}</span>
                <span className="font-black text-white/85">{counts[i]}회</span>
              </div>
            ))}
            <p className="pt-2 text-center text-[13px] font-bold text-white/60">가장 적게 누른 <b className="text-fuchsia-300">{names[loserIdx]}</b>님이 독박!</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-10 flex flex-col items-center text-center">
            <div className="text-[46px]">🔥</div>
            <p className="mt-2 text-[15px] font-black text-white">5초 안에 최대한 많이 누르기</p>
            <p className="mt-1 text-[13px] text-white/55">모두 같은 조건 · 노력한 만큼 정직하게 순위 결정</p>
          </div>
        ) : (
          <div className="mt-3 flex w-full flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례 ({cur + 1}/{n})</p>
            <p className="text-[22px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>

            <div className="my-3 text-center">
              <p className="text-[60px] font-black leading-none tabular-nums text-orange-300" style={{ textShadow: "0 0 22px rgba(255,140,32,0.5)" }}>{live}</p>
              <p className="text-[13px] font-bold text-white/40">연타 수</p>
            </div>

            {phase === "ready" && (
              <button onClick={begin} className="w-full max-w-[280px] rounded-2xl bg-orange-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,140,32,0.5)] transition hover:brightness-110">{names[cur]} 시작! (5초)</button>
            )}
            {phase === "tapping" && (
              <>
                <button onPointerDown={tap}
                  className="flex aspect-square w-full max-w-[240px] select-none items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-[24px] font-black text-black shadow-[0_0_40px_rgba(255,140,32,0.6)] transition active:scale-90"
                  style={{ touchAction: "manipulation" }}>
                  연타! 👊
                </button>
                <p className="mt-3 text-[18px] font-black text-orange-300">{remain}초 남음 — 계속 눌러!</p>
              </>
            )}
            {phase === "between" && (cool ? (
              <p className="mt-4 text-[17px] font-black text-orange-300">끝! {live}회 — 손 떼세요 ✋</p>
            ) : (
              <button onClick={next} className="mt-6 rounded-2xl bg-orange-400 px-10 py-4 text-[15px] font-black text-black shadow-[0_0_18px_rgba(255,140,32,0.4)] transition hover:brightness-110">
                {cur + 1 < n ? "다음 사람 →" : "결과 보기 🏁"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
