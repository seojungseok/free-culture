"use client";
import {useEffect} from 'react';
export default function useListReturn(key:string,ready=true) {
 useEffect(()=>{
  if(!ready)return;
  let frame=0;
  try{const raw=sessionStorage.getItem(key);if(!raw)return;const saved=JSON.parse(raw);if(saved.url!==location.pathname+location.search)return;sessionStorage.removeItem(key);frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>window.scrollTo(0,saved.y));});}catch{}
  return ()=>cancelAnimationFrame(frame);
 },[key,ready]);
 return ()=>{try{sessionStorage.setItem(key,JSON.stringify({url:location.pathname+location.search,y:window.scrollY}));}catch{}};
}
