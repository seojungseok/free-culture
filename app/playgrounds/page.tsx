import type {Metadata} from 'next';
import Link from 'next/link';
import PlaygroundCard from '@/components/PlaygroundCard';
import PlaygroundRegistry from '@/components/PlaygroundRegistry';
import styles from '@/components/Playgrounds.module.css';
import browse from '@/components/ExperienceBrowser.module.css';
import {getPlaygroundGuides,getGuideState,playgroundAreas,playgroundTopics,playgroundBrowseHref,filterPlaygroundGuides,type PlaygroundGuide} from '@/lib/playgroundData';
import {withSearchMetadata} from '@/lib/searchMetadata';
import {SITE} from '@/lib/site';
type Query=Record<string,string|string[]|undefined>;
const value=(query:Query,key:string)=>typeof query[key]==='string'?String(query[key]):'';
export async function generateMetadata({searchParams}:{searchParams:Promise<Query>}):Promise<Metadata>{
 const query=await searchParams;
 return withSearchMetadata({title:'지역별 어린이 놀이터 | 실내·무료 공원 이용안내',description:'지역별 실내 놀이터와 무료 공원을 사진으로 비교하고, 이용요금·무료 대상·예약·운영시간·주차 정보를 확인하세요.',alternates:{canonical:'/playgrounds'},robots:Object.keys(query).length?{index:false,follow:true}:undefined});
}
export default async function PlaygroundPage({searchParams}:{searchParams:Promise<Query>}){
 const query=await searchParams,area=playgroundAreas.includes(value(query,'area'))?value(query,'area'):'',q=value(query,'view')==='registry'?'':value(query,'q').trim().slice(0,80);
 const requested=value(query,'type')||(value(query,'indoor')==='1'?'indoor':''),type=Object.hasOwn(playgroundTopics,requested)?requested:'all';
 const all=getPlaygroundGuides().filter(getGuideState),guides=filterPlaygroundGuides(all,{area,type,q}) as PlaygroundGuide[];
 const ld={'@context':'https://schema.org','@type':'CollectionPage',name:'지역별 어린이 놀이터 이용안내',url:SITE.url+'/playgrounds',hasPart:guides.map(g=>({'@type':'Article',headline:g.title,url:SITE.url+'/playgrounds/'+g.slug}))};
 return <div className={styles.page}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>
  <nav className={browse.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span aria-current="page">어린이 놀이터</span></nav>
  <header className={browse.hero}><p className={styles.eyebrow}>아이와 보내는 주말</p><h1>지역별 어린이 놀이터</h1><p>실내 놀이공간과 무료 공원의 이용요금·운영시간·예약·주차 안내입니다.</p></header>
  <section id="finder" className={styles.guideFinder} aria-labelledby="playground-guides">
   <nav className={browse.topics} aria-label="놀이터 분야">{Object.entries(playgroundTopics).map(([key,label])=><Link key={key} href={playgroundBrowseHref(area,key,q)} aria-current={type===key?'page':undefined}>{label}</Link>)}</nav>
   <nav className={browse.regions} aria-label="놀이터 지역"><Link href={playgroundBrowseHref('',type,q)} aria-current={!area?'page':undefined}>전국 <small>{filterPlaygroundGuides(all,{type}).length}</small></Link>{playgroundAreas.map(a=><Link key={a} href={playgroundBrowseHref(a,type,q)} aria-current={area===a?'page':undefined}>{a}<small>{filterPlaygroundGuides(all,{area:a,type}).length}</small></Link>)}</nav>
   <form className={browse.filters} action="/playgrounds#finder" method="get"><input type="hidden" name="area" value={area}/><input type="hidden" name="type" value={type}/><label className={browse.search}>장소·키워드 검색<input type="search" name="q" defaultValue={q} maxLength={80} placeholder="놀이터 이름·블록·기차 등"/></label><button type="submit">찾기</button><Link className={browse.reset} href="/playgrounds#finder">초기화</Link></form>
   <div className={browse.count}><h2 id="playground-guides">{area||'전국'} {playgroundTopics[type as keyof typeof playgroundTopics]} 안내 {guides.length}곳</h2><span>사진·이용요금·운영시간·예약 안내가 있는 장소</span></div>
   {guides.length?<div className={browse.grid} data-playground-guide-results>{guides.map(g=><PlaygroundCard key={g.slug} guide={g} heading="h3"/>)}</div>:<div className={styles.empty}><p>조건에 맞는 방문 안내글이 아직 없습니다.</p><Link href={playgroundBrowseHref(area,'all')}>{area||'전국'} 전체 안내 보기 →</Link></div>}
  </section>
  <PlaygroundRegistry query={query}/>
 </div>;
}
