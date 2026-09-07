"use client";
import {useState} from "react";
export default function TripStopPhoto({src,title}:{src?:string;title:string}) {
  const [failed,setFailed]=useState<string>();
  const usable=typeof src==="string" && /^https?:\/\//.test(src) && src!==failed;
  return <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24">
    {usable ? <img src={src} alt={title} width={96} height={96} loading="lazy" decoding="async" onError={()=>setFailed(src)} className="h-full w-full object-cover"/> : <span className="px-2 text-center text-[11px] leading-5 text-slate-500">사진 준비 중</span>}
  </span>;
}
