"use client";

import { useEffect, useState } from "react";
import { isMuted, toggleMuted, sfx } from "@/lib/sfx";

// 게임 사운드 on/off 토글 — localStorage로 유지.
export default function SoundToggle() {
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(isMuted()), []);

  return (
    <button
      onClick={() => { const m = toggleMuted(); setMuted(m); if (!m) sfx.pop(); }}
      aria-label={muted ? "소리 켜기" : "소리 끄기"}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-[13px] font-black text-white/80 transition hover:bg-white/10"
    >
      {muted ? "🔇" : "🔊"}<span className="hidden sm:inline">{muted ? "소리 꺼짐" : "소리 켜짐"}</span>
    </button>
  );
}
