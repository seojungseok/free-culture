"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { todayYmd } from "@/lib/dates";

const RenderDateContext = createContext<string | null>(null);

// Keep the date embedded in the HTML for hydration, even when ISR serves yesterday's page.
export function RenderDateProvider({ day, children }: { day: string; children: ReactNode }) {
  return <RenderDateContext.Provider value={day}>{children}</RenderDateContext.Provider>;
}

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
function notify() { for (const listener of listeners) listener(); }
function schedule() {
  const now = Date.now();
  const untilKstMidnight = 86400000 - ((now + 9 * 3600000) % 86400000);
  timer = setTimeout(() => { notify(); schedule(); }, untilKstMidnight + 100);
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("focus", notify);
    document.addEventListener("visibilitychange", notify);
    schedule();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener("focus", notify);
      document.removeEventListener("visibilitychange", notify);
      clearTimeout(timer);
    }
  };
}

export function useRenderDay() {
  const day = useContext(RenderDateContext);
  if (!day) throw new Error("RenderDateProvider is required");
  // React uses the serialized server snapshot for the first hydration render.
  return useSyncExternalStore(subscribe, todayYmd, () => day);
}
