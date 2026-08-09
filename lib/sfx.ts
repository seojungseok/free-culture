// 게임 효과음 — 오디오 파일 없이 Web Audio로 짧고 은은하게 생성. 과하지 않게.
let _ctx: AudioContext | null = null;
let _muted = false;

if (typeof window !== "undefined") {
  try { _muted = localStorage.getItem("game-muted") === "1"; } catch { /* ignore */ }
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    _ctx = new AC();
  }
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

export function isMuted() { return _muted; }
export function toggleMuted() {
  _muted = !_muted;
  try { localStorage.setItem("game-muted", _muted ? "1" : "0"); } catch { /* ignore */ }
  if (!_muted) ctx(); // 켤 때 오디오 컨텍스트 준비(사용자 제스처 내)
  return _muted;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12, when = 0) {
  const c = ctx();
  if (!c || _muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  tick: () => tone(1150, 0.035, "square", 0.05),
  click: () => tone(560, 0.05, "triangle", 0.08),
  pop: () => { tone(760, 0.06, "triangle", 0.11); tone(1180, 0.05, "sine", 0.06, 0.03); },
  whoosh: () => { tone(240, 0.45, "sawtooth", 0.045); tone(180, 0.45, "sine", 0.04, 0.02); },
  suspense: () => tone(130, 0.11, "sawtooth", 0.07),
  count: () => tone(680, 0.09, "square", 0.09),
  go: () => tone(1240, 0.2, "square", 0.13),
  // 짧은 승리 아르페지오
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.17, "triangle", 0.12, i * 0.085)),
  // 낮은 '펑' — 폭탄/독박
  boom: () => { tone(95, 0.45, "sawtooth", 0.2); tone(62, 0.5, "square", 0.16, 0.02); tone(150, 0.2, "triangle", 0.1, 0); },
  roll: () => tone(300 + Math.random() * 400, 0.03, "square", 0.05),
};
