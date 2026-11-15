'use client';
import Image from 'next/image';
import {useState} from 'react';
import type {ProgrammeCoverData} from '@/lib/programmeMedia';
import styles from './ExperienceBrowser.module.css';
export default function ProgrammeCover({cover,detail=false,priority=false}:{cover:ProgrammeCoverData;detail?:boolean;priority?:boolean}){
 const [failed,setFailed]=useState(false),topic=failed||cover.kind==='topic',src=failed?cover.fallbackSrc:cover.src;
 return <><div className={`${styles.programmeCover} ${detail?styles.coverDetail:''} ${!topic&&cover.kind==='poster'?styles.coverPoster:''}`} data-programme-cover={topic?'topic':cover.kind}>
  <Image src={src} alt={failed?cover.fallbackCredit:cover.alt} fill unoptimized priority={priority} sizes={detail?'(max-width:1000px) 100vw,760px':'(max-width:640px) 50vw,(max-width:1000px) 33vw,280px'} onError={()=>{if(!failed)setFailed(true);}}/>
  <span className={styles.coverLabel}>{topic?'주제 이미지':cover.kind==='poster'?'공식 안내 이미지':'기관 제공 사진'}</span>
  {topic&&<div className={styles.coverWords}><strong>{cover.heading}</strong><span>활동 내용 · 일정 · 참여 안내</span></div>}
 </div>{detail&&<figcaption>{failed?cover.fallbackCredit:cover.credit}{topic?' · 해당 프로그램의 현장 사진이 아닌 주제 안내 이미지입니다.':''} · <a href={failed?cover.fallbackSource:cover.source} target="_blank" rel="noopener noreferrer">이미지 출처</a>{!topic&&cover.kind==='poster'&&<> · <a href={src} target="_blank" rel="noopener noreferrer">포스터 크게 보기</a></>}</figcaption>}</>;
}
