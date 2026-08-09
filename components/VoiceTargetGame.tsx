"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 목표 데시벨 맞히기 — 랜덤 기준 데시벨(근사치)을 주고, 한 명씩 그 크기에 맞춰 소리 냄.
// 결과는 숨겨서 저장 → 마지막 사람까지 끝나면 오픈. 가장 근사치인 사람 승리, 제일 먼 사람 독박.
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const MEASURE_MS = 3000;

function refOf(db: number): { emoji: string; text: string } {
  if (db < 58) return { emoji: "🤫", text: "속삭임 정도" };
  if (db < 72) return { emoji: "💬", text: "일상 대화 정도" };
  if (db < 84) return { emoji: "🗣️", text: "큰 목소리 정도" };
  if (db < 94) return { emoji: "📣", text: "외치는 소리 정도" };
  return { emoji: "🔊", text: "목청껏 고함 정도" };
}

export default function VoiceTargetGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [mic, setMic] = useState<"idle" | "asking" | "ready" | "denied">("idle");
  const [phase, setPhase] = useState<"setup" | "ready" | "measuring" | "saved" | "done">("setup");
  const [target, setTarget] = useState(75);
  const [cur, setCur] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [live, setLive] = useState(0);
  const [remain, setRemain] = useState(3);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const raf = useRef<number | null>(null);
  const endT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peakRef = useRef(0);

  const n = names.length;
  useEffect(() => () => cleanup(), []);
  function cleanup() {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (endT.current) clearTimeout(endT.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
  }

  function setN(k: number) {
    setCount(k);
    setNames((p) => Array.from({ length: k }, (_, i) => p[i] || `참가자${i + 1}`));
    reset();
  }
  function reset() { if (raf.current) cancelAnimationFrame(raf.current); if (endT.current) clearTimeout(endT.current); setPhase("setup"); setCur(0); setScores([]); setLive(0); }

  async function askMic() {
    setMic("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      streamRef.current = stream;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC(); ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
      analyserRef.current = an; setMic("ready");
    } catch { setMic("denied"); }
  }

  function levelDb(): number {
    const an = analyserRef.current;
    if (!an) return 0;
    const buf = new Uint8Array(an.fftSize);
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
    const rms = Math.sqrt(sum / buf.length);
    return Math.max(0, Math.min(120, Math.round(20 * Math.log10(rms || 1e-6) + 100)));
  }

  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setScores([]); setCur(0);
    setTarget(55 + Math.floor(Math.random() * 45)); // 55~99, 낮게도 크게도
    setPhase("ready");
  }
  function measure() {
    if (phase !== "ready") return;
    setPhase("measuring"); setLive(0); peakRef.current = 0; setRemain(3);
    ctxRef.current?.resume().catch(() => {});
    const t0 = performance.now();
    const loop = () => {
      const v = levelDb(); setLive(v);
      if (v > peakRef.current) peakRef.current = v;
      const left = Math.max(0, MEASURE_MS - (performance.now() - t0));
      setRemain(Math.ceil(left / 1000));
      if (left > 0) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    endT.current = setTimeout(() => {
      if (raf.current) cancelAnimationFrame(raf.current);
      const p = peakRef.current;
      setScores((s) => { const c = [...s]; c[cur] = p; return c; });
      setLive(0); setPhase("saved"); sfx.pop();
    }, MEASURE_MS);
  }
  function next() {
    if (cur + 1 < n) { setCur(cur + 1); setPhase("ready"); return; }
    setPhase("done"); sfx.win();
  }

  const diff = (i: number) => Math.abs(scores[i] - target);
  const winner = phase === "done" ? scores.reduce((bi, _, i, a) => (Math.abs(a[i] - target) < Math.abs(a[bi] - target) ? i : bi), 0) : -1;
  const loser = phase === "done" ? scores.reduce((wi, _, i, a) => (Math.abs(a[i] - target) > Math.abs(a[wi] - target) ? i : wi), 0) : -1;
  const r = refOf(target);
  const meterPct = Math.max(0, Math.min(100, ((live - 40) / 70) * 100));
  const meterColor = live > 95 ? "#ff2e88" : live > 80 ? "#ffb020" : "#00ff9d";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 · 마이크</h2>
        <div className="mt-4">
          {mic === "ready" ? (
            <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-[12.5px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">🎤 마이크 준비 완료!</p>
          ) : mic === "denied" ? (
            <div className="rounded-xl bg-rose-500/15 px-3 py-2 text-[12.5px] font-bold text-rose-300 ring-1 ring-rose-400/30">마이크 권한이 필요해요. 주소창 🎤에서 허용 후 <button onClick={askMic} className="underline">다시 시도</button></div>
          ) : (
            <button onClick={askMic} disabled={mic === "asking"} className="w-full rounded-2xl bg-amber-400 py-3 text-[15px] font-black text-black shadow-[0_0_20px_rgba(255,176,32,0.4)] transition hover:brightness-110 disabled:opacity-60">{mic === "asking" ? "요청 중…" : "🎤 마이크 켜기 (권한 허용)"}</button>
          )}
        </div>
        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)} className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-amber-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
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
          <button onClick={start} disabled={mic !== "ready"} className="mt-5 w-full rounded-2xl bg-amber-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,176,32,0.45)] transition hover:brightness-110 disabled:opacity-40">{mic !== "ready" ? "먼저 마이크를 켜주세요" : "목표 뽑고 시작 🎯"}</button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
      </div>

      {/* 플레이 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{phase === "done" ? "결과 오픈!" : phase === "measuring" ? "지금!" : phase === "setup" ? "SET" : "목표에 맞춰"}</span>
          <span className="text-amber-300">가장 근사치 = 승리</span>
        </div>

        {/* 목표 데시벨 */}
        {phase !== "setup" && (
          <div className="mt-3 w-full rounded-2xl bg-black/30 p-4 text-center ring-1 ring-amber-400/30">
            <span className="text-[12px] font-bold text-white/50">🎯 목표 데시벨(근사치)</span>
            <p className="text-[40px] font-black leading-none text-amber-300 tabular-nums">{target}<span className="text-[16px] text-white/40"> dB</span></p>
            <p className="mt-1 text-[13px] font-bold text-white/70">{r.emoji} {r.text}로 내보세요</p>
          </div>
        )}

        {phase === "done" ? (
          <div className="mt-4 w-full space-y-1.5">
            {names.map((nm, i) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13.5px] ring-1 ${i === winner ? "bg-amber-500/20 ring-amber-400/50" : i === loser ? "bg-fuchsia-600/20 ring-fuchsia-400/40" : "bg-black/25 ring-white/10"}`}>
                <span className="font-black" style={{ color: COLORS[i % COLORS.length] }}>{i === winner ? "🏆 " : i === loser ? "💀 " : ""}{nm}</span>
                <span className="font-black text-white/85">{scores[i]} dB <span className="text-white/40">(목표 ±{diff(i)})</span></span>
              </div>
            ))}
            <p className="pt-2 text-center text-[13px] font-bold text-white/60">가장 먼 <b className="text-fuchsia-300">{names[loser]}</b>님이 독박!</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-8 flex flex-col items-center text-center">
            <div className="text-[46px]">🎯</div>
            <p className="mt-2 text-[15px] font-black text-white">랜덤 목표 데시벨에 맞춰요</p>
            <p className="mt-1 text-[13px] text-white/55">결과는 숨겨 저장 → 마지막에 오픈! 제일 근사치가 승리</p>
          </div>
        ) : (
          <div className="mt-4 flex w-full flex-col items-center">
            <p className="text-[13px] font-bold text-white/60">지금 차례 ({cur + 1}/{n})</p>
            <p className="text-[22px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>

            {phase === "measuring" ? (
              <>
                <p className="my-3 text-[44px] font-black tabular-nums" style={{ color: meterColor }}>{live}<span className="text-[15px] text-white/40"> dB</span></p>
                <div className="h-4 w-full max-w-[280px] overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10"><div className="h-full rounded-full transition-all duration-75" style={{ width: `${meterPct}%`, background: meterColor }} /></div>
                <p className="mt-4 text-[18px] font-black text-amber-300">목표 {target}에 맞춰 — {remain}초</p>
              </>
            ) : phase === "saved" ? (
              <div className="my-6 flex flex-col items-center">
                <div className="text-[40px]">🔒</div>
                <p className="mt-1 text-[15px] font-black text-white">기록 완료! (결과는 마지막에 오픈)</p>
                <button onClick={next} className="mt-4 rounded-2xl bg-amber-400 px-6 py-3 text-[15px] font-black text-black transition hover:brightness-110">{cur + 1 < n ? "다음 사람 →" : "결과 오픈 🎉"}</button>
              </div>
            ) : (
              <button onClick={measure} className="my-6 w-full max-w-[260px] rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,176,32,0.5)] transition hover:brightness-110">{names[cur]} 소리 내기 🎤</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
