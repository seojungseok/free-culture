"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 숫자 폭탄 — 각자 1~3 중 원하는 수를 정하고, 목표(합의로 정함)까지 1번→N번 순서로 합이 차근차근 올라가요.
// 합이 목표를 넘는 순간, '목표에 가장 근접한 사람'이 독박. 과정을 눈으로 보며 조마조마.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const TARGETS = [20, 30, 40, 50];

export default function NumberBombGame() {
  const [count, setCount] = useState(5);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4", "참가자5"]);
  const [nums, setNums] = useState<number[]>([2, 2, 2, 2, 2]);
  const [target, setTarget] = useState(30);
  const [phase, setPhase] = useState<"setup" | "rolling" | "done">("setup");
  const [sum, setSum] = useState(0);
  const [active, setActive] = useState(-1);      // 지금 더해지는 사람
  const [over, setOver] = useState(false);       // 목표 초과 순간
  const [loser, setLoser] = useState<number | null>(null);
  const [loserSum, setLoserSum] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = names.length;
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    setNums((p) => Array.from({ length: k }, (_, i) => p[i] || 2));
    reset();
  }
  function reset() { if (timer.current) clearTimeout(timer.current); setPhase("setup"); setSum(0); setActive(-1); setOver(false); setLoser(null); }

  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setSum(0); setActive(-1); setOver(false); setLoser(null);
    setPhase("rolling");

    // 착지 시퀀스 미리 계산(합이 목표 이상이 되면 종료)
    const seq: { player: number; total: number }[] = [];
    let s = 0, i = 0;
    while (seq.length < 500) { s += nums[i]; seq.push({ player: i, total: s }); if (s >= target) break; i = (i + 1) % n; }

    // 한 스텝씩 애니메이션(끝으로 갈수록 감속)
    let k = 0;
    const stepFn = () => {
      const { player, total } = seq[k];
      setSum(total); setActive(player);
      const crossed = total >= target;
      if (crossed) setOver(true);
      sfx.tick();
      if (k >= seq.length - 1) {
        // 목표에 가장 근접한 사람 = 독박
        const overL = seq[seq.length - 1];
        const underL = seq.length >= 2 ? seq[seq.length - 2] : null;
        const pick = (!underL || Math.abs(overL.total - target) < Math.abs(underL.total - target)) ? overL : underL;
        timer.current = setTimeout(() => { setLoser(pick.player); setLoserSum(pick.total); setPhase("done"); sfx.boom(); }, 700);
        return;
      }
      const remain = seq.length - 1 - k;
      const delay = remain > 4 ? 430 : [520, 640, 780, 900][Math.min(4 - remain, 3)] || 500; // 마지막 4스텝 감속
      k++;
      timer.current = setTimeout(stepFn, delay);
    };
    timer.current = setTimeout(stepFn, 500);
  }

  const pct = Math.min(100, Math.round((sum / target) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">인원 · 목표 · 각자 숫자</h2>

        <p className="mt-4 text-[13px] font-bold text-white/60">목표 숫자 (합의로 정해요)</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {TARGETS.map((t) => (
            <button key={t} onClick={() => phase === "setup" && setTarget(t)} disabled={phase !== "setup"}
              className={`rounded-xl py-2.5 text-[14px] font-black transition disabled:opacity-40 ${target === t ? "bg-amber-400 text-black shadow-[0_0_20px_rgba(255,176,32,0.5)]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{t}</button>
          ))}
        </div>

        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)} className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-amber-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
          ))}
        </div>

        <p className="mt-5 text-[13px] font-bold text-white/60">이름 · 각자 더할 숫자(1~3)</p>
        <div className="mt-2 space-y-2">
          {names.map((nm, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[13px] font-black text-black" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))} maxLength={8} disabled={phase !== "setup"}
                className="w-full min-w-0 flex-1 bg-transparent text-[14px] font-bold text-white outline-none disabled:opacity-60" />
              <div className="flex flex-none gap-1">
                {[1, 2, 3].map((v) => (
                  <button key={v} onClick={() => phase === "setup" && setNums((p) => p.map((x, j) => (j === i ? v : x)))} disabled={phase !== "setup"}
                    className={`h-7 w-7 rounded-lg text-[13px] font-black transition disabled:opacity-50 ${nums[i] === v ? "bg-white text-black" : "bg-white/8 text-white/60 hover:bg-white/15"}`}>{v}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {phase === "setup" ? (
          <button onClick={start} className="mt-5 w-full rounded-2xl bg-amber-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,176,32,0.45)] transition hover:brightness-110">폭탄 굴리기 🔢</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
      </div>

      {/* 진행 */}
      <div className={`rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 ${loser !== null ? "game-shake" : ""}`}>
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loser !== null ? "BOOM 💥" : phase === "rolling" ? "차근차근 올라가는 중…" : "SET"}</span>
          <span className="text-amber-300">목표에 근접 = 독박</span>
        </div>

        {/* 합산 숫자 + 목표 */}
        <div className="mt-4 text-center">
          <span className="text-[12px] font-bold text-white/50">현재 합</span>
          <p className={`text-[68px] font-black leading-none tabular-nums transition-colors ${over ? "text-rose-400" : "text-amber-300"}`} style={{ textShadow: over ? "0 0 24px rgba(255,46,136,0.5)" : "0 0 24px rgba(255,176,32,0.4)" }}>{sum}</p>
          <span className="text-[14px] font-bold text-white/40">목표 {target}</span>
          <div className="mx-auto mt-3 h-3 max-w-[320px] overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
            <div className="h-full rounded-full transition-all duration-200" style={{ width: `${pct}%`, background: over ? "#ff2e88" : "#ffb020" }} />
          </div>
        </div>

        {/* 참가자 칩 */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {names.map((nm, i) => {
            const isActive = phase === "rolling" && active === i;
            const isLoser = loser === i;
            return (
              <div key={i} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-black ring-1 transition ${isLoser ? "bg-fuchsia-600/30 ring-fuchsia-400/50 scale-110" : isActive ? "scale-110 ring-2" : "bg-black/25 ring-white/10"}`}
                style={isActive && !isLoser ? { background: `${COLORS[i % COLORS.length]}33`, borderColor: COLORS[i % COLORS.length], boxShadow: `0 0 14px ${COLORS[i % COLORS.length]}` } : {}}>
                <span style={{ color: isLoser ? "#fff" : COLORS[i % COLORS.length] }}>{isLoser ? "💀 " : ""}{nm}</span>
                <span className="rounded-md bg-black/40 px-1.5 text-white/70">+{nums[i]}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          {loser !== null ? (
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-4 text-center ring-1 ring-fuchsia-400/40">
              <p className="text-[13px] font-bold text-white/70">목표 {target}에 가장 가까운({loserSum}) 오늘의 독박은</p>
              <p className="mt-1 text-[26px] font-black text-white drop-shadow-[0_0_12px_rgba(255,46,136,0.7)]">💀 {names[loser]}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-black/30 p-3 text-center text-[13px] text-white/60 ring-1 ring-white/10">
              {phase === "rolling" ? "합이 목표를 넘는 순간, 가장 근접한 사람이 독박!" : "목표·숫자를 정하고 ‘폭탄 굴리기’"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
