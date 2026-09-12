'use client';
import {useEffect,useState} from 'react';
import type {TicketArticle} from '@/lib/tickets';

export default function useTicketClock(article:TicketArticle) {
  const [now,setNow]=useState(()=>Date.parse(article.renderedAt||article.checkedAt));
  useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
  return {now,day:new Date(now).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})};
}
