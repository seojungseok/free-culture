"use client";
import {useEffect,useState} from 'react';

type Counts={today:number;total:number;day:string};
export default function VisitorCount(){
 const [data,setData]=useState<Counts|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let active=true,inFlight=false,retries=0,timer:ReturnType<typeof setTimeout>|undefined,request:AbortController|undefined;
  const countingEnabled=['mwohaji.kr','www.mwohaji.kr'].includes(window.location.hostname);
  function session(day:string){
   if(!countingEnabled)return null;
   try{
    if(sessionStorage.getItem(`vc_${day}`))return null;
    let id=sessionStorage.getItem('vc_session_id');
    if(!id){id=crypto.randomUUID();sessionStorage.setItem('vc_session_id',id);}
    return id;
   }catch{return null;}
  }
  async function refresh(){
   if(!active||document.hidden||inFlight)return;
   inFlight=true;
   const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10).replaceAll('-',''),visitId=session(day);
   request=new AbortController();const timeout=setTimeout(()=>request?.abort(),8000);
   try{
    const response=await fetch('/api/visitors',{method:visitId?'POST':'GET',cache:'no-store',signal:request.signal,...(visitId?{headers:{'Content-Type':'application/json'},body:JSON.stringify({visitId})}:{})});
    if(!response.ok)throw Error('Visitor count unavailable');
    const value=await response.json();
    if(!/^\d{8}$/.test(value?.day)||!Number.isSafeInteger(value?.today)||!Number.isSafeInteger(value?.total)||value.today<0||value.total<value.today)throw Error('Invalid count');
    // Mark only acknowledged writes. A lost response retries the same id,
    // and the server journal counts that id only once for the Korean day.
    if(visitId)try{sessionStorage.setItem(`vc_${value.day}`,'1');}catch{}
    retries=0;if(active){setData(value);setFailed(false);}
   }catch{retries++;if(active)setFailed(true);}
   finally{
    clearTimeout(timeout);inFlight=false;
    if(active){clearTimeout(timer);timer=setTimeout(()=>void refresh(),retries?Math.min(5000*2**Math.min(retries-1,4),60000):60000);}
   }
  }
  const wake=()=>{if(!document.hidden){clearTimeout(timer);void refresh();}};
  void refresh();window.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);
  return()=>{active=false;clearTimeout(timer);request?.abort();window.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake);};
 },[]);
 return <span className="tabular-nums" aria-live="polite" data-visitor-counter="daily-total">{data?`오늘 ${data.today.toLocaleString('ko-KR')} · 전체 ${data.total.toLocaleString('ko-KR')}`:failed?'방문자 집계 확인 중':'방문자 수 불러오는 중'}</span>;
}
