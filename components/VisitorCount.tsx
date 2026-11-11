"use client";
import {useEffect,useState} from 'react';

type Counts={today:number;total:number;day:string};
export default function VisitorCount(){
 const [data,setData]=useState<Counts|null>(null);
 useEffect(()=>{
  let active=true;
  const day=new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10).replaceAll('-','');
  const flag=`vc_${day}`;
  const countingEnabled=['mwohaji.kr','www.mwohaji.kr'].includes(window.location.hostname);
  let first=false;
  try{if(countingEnabled&&!sessionStorage.getItem(flag)){sessionStorage.setItem(flag,'1');first=true;}}catch{}
  const read=async(method:'GET'|'POST')=>{
   const response=await fetch('/api/visitors',{method,cache:'no-store'});
   if(!response.ok)throw Error('Visitor count unavailable');
   const value=await response.json();
   if(!Number.isSafeInteger(value?.today)||!Number.isSafeInteger(value?.total)||value.today<0||value.total<0)throw Error('Invalid count');
   if(active)setData(value);
  };
  // A failed/uncertain increment is never repeated. Reading cannot inflate history.
  read(first?'POST':'GET').catch(()=>{if(first&&active)void read('GET').catch(()=>{});});
  return ()=>{active=false;};
 },[]);
 return <span className="tabular-nums" aria-live="polite" data-visitor-counter="daily-total">{data?`오늘 ${data.today.toLocaleString()} · 전체 ${data.total.toLocaleString()}`:'방문자 수 집계 중'}</span>;
}
