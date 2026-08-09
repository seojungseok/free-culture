"use client";

import { useState, useRef, useEffect } from "react";
import { sfx } from "@/lib/sfx";

// 데시벨 배틀 — 한 명씩 3초간 소리 지르고 최고 데시벨(근사치)을 측정. 가장 작게 지른 사람이 독박.
// 마이크 감도가 기기마다 달라 '근사치'예요(상대 비교용).
const COLORS = ["#ff2e88", "#00e5ff", "#a6ff00", "#ffb020", "#b14bff", "#00ff9d", "#ff5252", "#40a9ff", "#ffd23f", "#ff7ac6"];
const MEASURE_MS = 3000;

export default function VoiceGame() {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(["참가자1", "참가자2", "참가자3", "참가자4"]);
  const [mic, setMic] = useState<"idle" | "asking" | "ready" | "denied">("idle");
  const [phase, setPhase] = useState<"setup" | "ready" | "measuring" | "between" | "done">("setup");
  const [cur, setCur] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [live, setLive] = useState(0);   // 현재 dB(근사치)
  const [peak, setPeak] = useState(0);   // 이번 차례 최고
  const [remain, setRemain] = useState(3);
  const [loser, setLoser] = useState<string | null>(null);

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
  function reset() { if (raf.current) cancelAnimationFrame(raf.current); if (endT.current) clearTimeout(endT.current); setPhase("setup"); setCur(0); setScores([]); setLoser(null); setLive(0); setPeak(0); }

  async function askMic() {
    setMic("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      streamRef.current = stream;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      analyserRef.current = an;
      setMic("ready");
    } catch {
      setMic("denied");
    }
  }

  function levelDb(): number {
    const an = analyserRef.current;
    if (!an) return 0;
    const buf = new Uint8Array(an.fftSize);
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
    const rms = Math.sqrt(sum / buf.length);
    const db = 20 * Math.log10(rms || 1e-6); // dBFS(음수)
    return Math.max(0, Math.min(120, Math.round(db + 100))); // 근사치 0~120
  }

  function start() {
    const clean = names.map((s, i) => s.trim() || `참가자${i + 1}`);
    setNames(clean); setScores([]); setCur(0); setLoser(null); setPhase("ready");
  }
  function measure() {
    if (phase !== "ready" && phase !== "between") return;
    setPhase("measuring"); setPeak(0); setLive(0); peakRef.current = 0; setRemain(3);
    ctxRef.current?.resume().catch(() => {});
    const t0 = performance.now();
    const loop = () => {
      const v = levelDb();
      setLive(v);
      if (v > peakRef.current) { peakRef.current = v; setPeak(v); }
      const left = Math.max(0, MEASURE_MS - (performance.now() - t0));
      setRemain(Math.ceil(left / 1000));
      if (left > 0) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    endT.current = setTimeout(() => {
      if (raf.current) cancelAnimationFrame(raf.current);
      const p = peakRef.current;
      setScores((s) => { const c = [...s]; c[cur] = p; return c; });
      setLive(0); setPhase("between");
    }, MEASURE_MS);
  }
  function next() {
    if (cur + 1 < n) { setCur(cur + 1); setPhase("ready"); setPeak(0); return; }
    // 가장 작게 지른 사람이 독박
    let worst = 999, wi = 0;
    scores.forEach((v, i) => { if (v < worst) { worst = v; wi = i; } });
    setCur(wi); setPhase("done"); sfx.boom();
  }

  const loserName = phase === "done" ? names[cur] : null;
  const best = scores.length === n ? scores.reduce((bi, v, i, a) => (v > a[bi] ? i : bi), 0) : -1;
  const meterPct = Math.max(0, Math.min(100, ((live - 40) / 70) * 100));
  const meterColor = live > 95 ? "#ff2e88" : live > 80 ? "#ffb020" : "#00ff9d";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* 설정 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-rose-300">STEP 1</p>
        <h2 className="mt-1 text-[22px] font-black text-white">참가자 · 마이크</h2>

        {/* 마이크 권한 */}
        <div className="mt-4">
          {mic === "ready" ? (
            <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-[12.5px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">🎤 마이크 준비 완료!</p>
          ) : mic === "denied" ? (
            <div className="rounded-xl bg-rose-500/15 px-3 py-2 text-[12.5px] font-bold text-rose-300 ring-1 ring-rose-400/30">
              마이크 권한이 필요해요. 브라우저 주소창의 🎤 아이콘에서 허용 후 <button onClick={askMic} className="underline">다시 시도</button>
            </div>
          ) : (
            <button onClick={askMic} disabled={mic === "asking"} className="w-full rounded-2xl bg-rose-400 py-3 text-[15px] font-black text-black shadow-[0_0_20px_rgba(255,82,82,0.4)] transition hover:brightness-110 disabled:opacity-60">
              {mic === "asking" ? "요청 중…" : "🎤 마이크 켜기 (권한 허용)"}
            </button>
          )}
        </div>

        <p className="mt-5 text-[13px] font-bold text-white/60">인원 (최대 10명)</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 2).map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-xl py-2.5 text-[14px] font-black transition ${count === k ? "bg-rose-400 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{k}</button>
          ))}
        </div>
        <p className="mt-5 text-[13px] font-bold text-white/60">참가자 이름</p>
        <div className="mt-2 space-y-2">
          {names.map((nm, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[13px] font-black text-black" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
              <input value={nm} onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))} maxLength={10} disabled={phase !== "setup"}
                className="w-full bg-transparent text-[15px] font-bold text-white outline-none disabled:opacity-60" />
            </div>
          ))}
        </div>
        {phase === "setup" ? (
          <button onClick={start} disabled={mic !== "ready"} className="mt-5 w-full rounded-2xl bg-rose-400 py-3.5 text-[16px] font-black text-black shadow-[0_0_24px_rgba(255,82,82,0.45)] transition hover:brightness-110 disabled:opacity-40">
            {mic !== "ready" ? "먼저 마이크를 켜주세요" : "대결 시작 🎤"}
          </button>
        ) : (
          <button onClick={reset} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-[14px] font-bold text-white/80 transition hover:bg-white/10">처음부터</button>
        )}
        {/* 기록 */}
        {scores.some((s) => s !== undefined) && (
          <div className="mt-4 space-y-1">
            {names.map((nm, i) => scores[i] !== undefined && (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-[13px] ${best === i ? "bg-amber-500/15 ring-1 ring-amber-400/40" : "bg-black/25"}`}>
                <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{nm}{best === i ? " 🏆" : ""}</span>
                <span className="font-black text-white/80">{scores[i]} dB</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 측정 영역 */}
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <span>{loserName ? "GAME OVER" : phase === "measuring" ? "SCREAM!" : phase === "setup" ? "SET" : "차례대로"}</span>
          <span className="text-rose-300">가장 작게 = 독박</span>
        </div>

        {loserName ? (
          <div className="my-8 rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 p-6 text-center ring-1 ring-fuchsia-400/40">
            <p className="text-[13px] font-bold text-white/70">가장 작게 지른… 오늘의 독박은</p>
            <p className="mt-1 text-[30px] font-black text-white drop-shadow-[0_0_14px_rgba(255,46,136,0.7)]">💀 {loserName}</p>
            <p className="mt-2 text-[13px] text-white/60">{scores[cur]} dB (근사치)</p>
          </div>
        ) : phase === "setup" ? (
          <div className="my-10 flex flex-col items-center text-center">
            <div className="text-[46px]">🎤</div>
            <p className="mt-2 text-[15px] font-black text-white">한 명씩 3초간 소리 질러요</p>
            <p className="mt-1 text-[13px] text-white/55">최고 데시벨(근사치)을 재서 제일 작은 사람이 독박</p>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center">
            <p className="mt-2 text-[13px] font-bold text-white/60">지금 차례 ({cur + 1}/{n})</p>
            <p className="text-[22px] font-black" style={{ color: COLORS[cur % COLORS.length] }}>{names[cur]}</p>

            {/* dB 미터 */}
            <div className="my-4 text-center">
              <p className="text-[52px] font-black leading-none tabular-nums" style={{ color: meterColor, textShadow: `0 0 22px ${meterColor}66` }}>
                {phase === "measuring" ? live : phase === "between" ? peak : "0"}
              </p>
              <p className="text-[13px] font-bold text-white/40">dB (근사치){phase === "between" ? " · 최고" : ""}</p>
            </div>
            <div className="h-4 w-full max-w-[280px] overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
              <div className="h-full rounded-full transition-all duration-75" style={{ width: `${phase === "measuring" ? meterPct : 0}%`, background: meterColor }} />
            </div>

            {phase === "ready" && (
              <button onClick={measure} className="mt-5 w-full max-w-[260px] rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 py-4 text-[17px] font-black text-black shadow-[0_0_24px_rgba(255,82,82,0.5)] transition hover:brightness-110">
                {names[cur]} 소리 지르기 🎤
              </button>
            )}
            {phase === "measuring" && (
              <p className="mt-5 text-[18px] font-black text-rose-300">지금! 크게 질러요 — {remain}초</p>
            )}
            {phase === "between" && (
              <button onClick={next} className="mt-5 rounded-2xl bg-rose-400 px-6 py-3 text-[15px] font-black text-black transition hover:brightness-110">
                {cur + 1 < n ? "다음 사람 →" : "결과 보기 🏁"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
