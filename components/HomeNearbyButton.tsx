"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {NEAR_SESSION,requestNearLocation} from '@/lib/nearClient';
export default function HomeNearbyButton(){
 const [busy,setBusy]=useState(false);const router=useRouter();
 async function find(){
  if(busy)return;setBusy(true);
  let state;
  try{state={point:await requestNearLocation(),area:'',radius:10,kind:'all',page:1};}catch(e){state={point:null,area:'',radius:10,kind:'all',page:1,error:(e as Error).message};}
  try{sessionStorage.setItem(NEAR_SESSION,JSON.stringify(state));sessionStorage.removeItem('near-return');}catch{}
  router.push('/near');setBusy(false);
 }
 return <button type="button" onClick={find} disabled={busy} className="mt-3 min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brandblue shadow-sm disabled:opacity-60">{busy?'위치 확인 중…':'📍 내 주변 갈 만한 곳'}</button>;
}
