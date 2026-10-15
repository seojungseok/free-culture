'use client';
import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import type {TossFeed} from '@/lib/sharelink';

type FeedState={feed:TossFeed;now:number;loading:boolean};
const FeedContext=createContext<FeedState|null>(null);
// One feed and refresh loop for every placement, retained during client navigation.
export function TossFeedProvider({initial,children}:{initial:TossFeed;children:ReactNode}){
 // Cached HTML must never resurrect a deal that expired since the build.
 const [feed,setFeed]=useState(initial),[now,setNow]=useState(0),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true,inFlight=false,lastAttempt=0;
  let request:AbortController|undefined;
  const tick=()=>{if(!document.hidden)setNow(Date.now());};
  const refresh=async()=>{
   if(document.hidden||inFlight||Date.now()-lastAttempt<60000)return;
   inFlight=true;lastAttempt=Date.now();
   request=new AbortController();const timeout=setTimeout(()=>request?.abort(),10000);
   try{
    const response=await fetch('/api/affiliate/toss',{cache:'no-store',signal:request.signal});
    if(!response.ok)return;
    const value=await response.json();
    if(active&&value?.version===1&&Array.isArray(value.products)&&Number.isFinite(Date.parse(value.checkedAt)))setFeed(value);
   }catch{}finally{clearTimeout(timeout);inFlight=false;if(active)setLoading(false);}
  };
  const wake=()=>{tick();void refresh();};
  wake();const clock=setInterval(tick,30000),timer=setInterval(refresh,300000);
  window.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);
  return()=>{active=false;request?.abort();clearInterval(clock);clearInterval(timer);window.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake);};
 },[]);
 const value=useMemo(()=>({feed,now,loading}),[feed,now,loading]);
 return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}
export function useTossFeed(){const value=useContext(FeedContext);if(!value)throw new Error('TossFeedProvider is required');return value;}
