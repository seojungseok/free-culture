"use client";
import { useEffect, useState } from "react";
import { SAVED_KEY, parseSaved, type SavedTrip } from "@/lib/planner";
export default function TripSave({trip}: {trip: SavedTrip}) {
  const [saved,setSaved] = useState(false), [message,setMessage] = useState("");
  useEffect(()=>{
    const sync=()=>{try {setSaved(parseSaved(localStorage.getItem(SAVED_KEY)).some(t=>t.id===trip.id));} catch {setSaved(false);}};
    sync(); window.addEventListener("storage",sync); window.addEventListener("trip-saved",sync);
    return ()=>{window.removeEventListener("storage",sync);window.removeEventListener("trip-saved",sync);};
  },[trip.id]);
  function save() {
    try {
      const entries = parseSaved(localStorage.getItem(SAVED_KEY));
      if (entries.some(t=>t.id===trip.id)) {setMessage("보관함에 이미 저장되어 있습니다.");return;}
      if (entries.length>=100) {setMessage("최대 100개까지 저장할 수 있습니다. 보관함에서 먼저 정리해 주세요.");return;}
      localStorage.setItem(SAVED_KEY,JSON.stringify([trip,...entries]));
      window.dispatchEvent(new Event("trip-saved"));setMessage("이 브라우저 보관함에 저장했습니다.");
    } catch {setMessage("브라우저 저장 공간을 사용할 수 없습니다. 저장 설정을 확인해 주세요.");}
  }
  return <div className="mt-3"><button type="button" onClick={save} aria-pressed={saved} className="min-h-11 rounded-xl border border-brandblue/30 bg-white px-4 py-2 text-sm font-bold text-brandblue">{saved ? "✓ 보관함에 저장됨" : "＋ 보관함에 담기"}</button><span role="status" className="mt-1 block text-xs text-ink-soft">{message}</span></div>;
}
