import type {Metadata} from 'next';
import Link from 'next/link';
import WinterCourseBrowser from '@/components/WinterCourseBrowser';
import TossTopDeals from '@/components/TossTopDeals';
import {getPublicWinterCourses} from '@/lib/winterCourses';
import {SITE} from '@/lib/site';

export const revalidate=3600;
export function generateMetadata():Metadata{
 const count=getPublicWinterCourses().length;
 const title='전국 겨울여행'+(count?' '+count+'코스':'')+' · 당일치기와 1박 2일';
 const description='겨울 바다, 궁궐과 미술관, 온천 마을까지. 전국 17개 지역의 당일치기와 1박 2일 겨울여행을 지역·일정별로 고르고, 날짜별 동선과 이동 방법·숙박 권역·공식 안내를 확인하세요.';
 return {title,description,alternates:{canonical:'/winter-travel'},robots:{index:count>0,follow:true},openGraph:{type:'website',title,description,url:'/winter-travel'}};
}
export default function WinterTravelPage(){
 const courses=getPublicWinterCourses();
 const cards=courses.map(({id,slug,title,area,city,duration,durationLabel,intro,image,stops})=>({id,slug,title,area,city,duration,durationLabel,intro,image,stops:stops.map(({name,day})=>({name,day}))}));
 const list={'@context':'https://schema.org','@type':'ItemList',name:'전국 겨울여행 · 당일치기와 1박 2일',numberOfItems:cards.length,itemListElement:cards.map((course,index)=>({'@type':'ListItem',position:index+1,name:course.title,url:SITE.url+'/winter-travel/'+course.slug}))};
 const breadcrumbs={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:SITE.url},{'@type':'ListItem',position:2,name:'겨울여행',item:SITE.url+'/winter-travel'}]};
 return <>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify([list,breadcrumbs]).replace(/</g,'\\u003c')}}/>
  <header className="mx-auto w-full max-w-[1440px] px-4 pb-7 pt-5 sm:px-6 lg:px-8">
   <nav aria-label="현재 위치" className="mb-5 text-xs text-ink-soft"><Link href="/" className="inline-flex min-h-11 items-center hover:underline">홈</Link> <span aria-hidden="true">/</span> <span aria-current="page">겨울 여행</span></nav>
   <h1 className="break-keep text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl">전국 겨울여행 <span className="text-brandblue">{courses.length}코스</span></h1>
   <p className="mt-3 text-sm leading-7 text-ink-soft sm:text-base">당일치기 {courses.filter(c=>c.duration==='당일').length}개 · 1박 2일 {courses.filter(c=>c.duration==='1박2일').length}개. 겨울 바다부터 실내 전시까지, 지역과 일정으로 골라보세요.</p>
  </header>
  <WinterCourseBrowser courses={cards}/>
  <TossTopDeals/>
 </>;
}
