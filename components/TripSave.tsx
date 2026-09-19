"use client";
import { useEffect, useState } from "react";
import { SAVED_KEY, parseSaved, type SavedTrip } from "@/lib/planner";
export default function TripSave({trip, className = "mt-3", variant = "button"}: {trip: SavedTrip; className?: string; variant?: "button" | "heart"}) {
  const [saved,setSaved] = useState(false), [message,setMessage] = useState("");
  useEffect(()=>{
    const sync=()=>{try {setSaved(parseSaved(localStorage.getItem(SAVED_KEY)).some(t=>t.id===trip.id));} catch {setSaved(false);}};
    sync(); window.addEventListener("storage",sync); window.addEventListener("trip-saved",sync);
    return ()=>{window.removeEventListener("storage",sync);window.removeEventListener("trip-saved",sync);};
  },[trip.id]);
  function save() {
    try {
      const entries = parseSaved(localStorage.getItem(SAVED_KEY));
      if (entries.some(t=>t.id===trip.id)) {
        if (variant === "heart") {
          localStorage.setItem(SAVED_KEY,JSON.stringify(entries.filter(t=>t.id!==trip.id)));
          window.dispatchEvent(new Event("trip-saved"));setMessage("보관함에서 해제했습니다.");
        } else setMessage("보관함에 이미 저장되어 있습니다.");
        return;
      }
      if (entries.length>=100) {setMessage("최대 100개까지 저장할 수 있습니다. 보관함에서 먼저 정리해 주세요.");return;}
      localStorage.setItem(SAVED_KEY,JSON.stringify([trip,...entries]));
      window.dispatchEvent(new Event("trip-saved"));setMessage("이 브라우저 보관함에 저장했습니다.");
    } catch {setMessage("브라우저 저장 공간을 사용할 수 없습니다. 저장 설정을 확인해 주세요.");}
  }
  if (variant === "heart") return <div className={className}>
    <button type="button" onClick={save} aria-pressed={saved} aria-label={`${trip.title} ${saved ? "보관함에서 해제" : "보관함에 담기"}`} title={saved ? "보관함에서 해제" : "보관함에 담기"} className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-md transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandblue ${saved ? "text-rose-600" : "text-slate-600"}`}>
      <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
    </button>
    <span role="status" className={message ? "absolute right-0 top-12 z-20 w-36 rounded-lg bg-white p-2 text-xs leading-5 text-ink shadow-md" : "sr-only"}>{message}</span>
  </div>;
  return <div className={`min-w-0 max-w-full shrink-0 ${className}`}>
    <button type="button" onClick={save} aria-pressed={saved} className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandblue ${saved ? "border-brandblue/25 bg-blue-50 text-brandblue" : "border-brandblue bg-brandblue text-white hover:brightness-95"}`}>
      <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
      <span>{saved ? "보관함에 저장됨" : "보관함에 담기"}</span>
    </button>
    <span role="status" className="mt-1 block max-w-[20rem] text-xs leading-relaxed text-ink-soft empty:hidden">{message}</span>
  </div>;
}
