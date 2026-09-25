import Link from 'next/link';
import type {Metadata} from 'next';
import WeekendDiscovery from '@/components/WeekendDiscovery';
import {getWeekend,getGeneratedAt} from '@/lib/data';
import {placeStops} from '@/lib/plannerData';
import {weekendRangeYmd,formatKoreanDate} from '@/lib/dates';
import {SEASON_KEYWORDS} from '@/lib/season';
import type {WeekendCandidate} from '@/lib/weekendDiscovery';
import {SIDO_SLUG} from '@/lib/classify';
import {getKidTours} from '@/lib/tour';
export const revalidate=3600;
export const metadata:Metadata={title:'이번 주말 가볼 만한 곳 | 지역별 행사·아이와 나들이',description:'이번 주말 서울·경기·부산·제주 등 지역별로 날짜가 맞는 행사와 나들이 장소를 찾아보세요. 아이와·데이트·무료 조건도 비교할 수 있습니다.',alternates:{canonical:'/weekend'}};
export default function WeekendPage(){
 const {start,end}=weekendRangeYmd(),month=Number(start.slice(4,6));
 const season=month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
 const seasonLabel={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'}[season];
 const places:WeekendCandidate[]=placeStops().map(p=>({...p,nature:/공원|숲|수목원|휴양림|둘레길|해변|계곡|산책|생태|정원/.test(p.title),seasonal:SEASON_KEYWORDS[season].some(k=>p.title.includes(k))}));
 // Bound the snapshot and retain different interests in each region; never choose the first region for a visitor.
 const selected=new Map<string,WeekendCandidate>();
 for(const area of [...new Set(places.map(p=>p.area))]){
  const pool=places.filter(p=>p.area===area).sort((a,b)=>Number(!!b.image)-Number(!!a.image)||(a.id<b.id?-1:1));
  for(const [index,group] of [pool,pool.filter(p=>p.nature),pool.filter(p=>p.seasonal),pool.filter(p=>p.kids),pool.filter(p=>p.free)].entries())for(const p of group.slice(0,index===0?8:4))selected.set(p.id,p);
 }
 const weekendEvents=getWeekend();
 const allEvents:WeekendCandidate[]=weekendEvents.map(e=>({id:'event:'+e.id,title:e.title,href:'/event/'+e.id,area:e.area,kind:'event',image:e.imgUrl,address:e.address||e.place,start:e.startDate,end:e.endDate,free:e.priceType==='free',kids:e.audiences?.includes('kids')||false,nature:false,seasonal:false}));
 const perArea=new Map<string,number>();
 const events=allEvents.filter(e=>e.image).sort((a,b)=>(a.end||'').localeCompare(b.end||'')).filter(event=>{const count=perArea.get(event.area)||0;if(count>=12)return false;perArea.set(event.area,count+1);return true;});
 const regions=['서울','경기','인천','부산','제주'].map(area=>({area,code:(SIDO_SLUG as Record<string,string>)[area],events:allEvents.filter(e=>e.area===area),kidPlaces:getKidTours(area).length,dateEvents:weekendEvents.filter(e=>e.area===area&&e.audiences?.includes('couple')).length})).filter(region=>region.code&&region.events.length>=5);
 const featured=allEvents.filter(e=>e.image).sort((a,b)=>(a.end||'').localeCompare(b.end||'')).slice(0,8);
 return <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6"><nav className="mb-4 text-sm text-ink-soft"><Link href="/">홈</Link> / 이번 주말</nav><h1 className="text-2xl font-black sm:text-3xl">이번 주말 가볼 만한 곳</h1><p className="mt-3 text-sm leading-7 text-ink-soft">{formatKoreanDate(start)}{start!==end?' ~ '+formatKoreanDate(end):''} · 지역별 행사와 나들이를 먼저 살펴보고 방문일과 취향으로 좁혀 보세요.</p>
 <section className="mt-6" aria-label="지역별 이번 주말 일정"><h2 className="text-xl font-bold">지역별 이번 주말</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{regions.map(region=><div key={region.area} className="rounded-xl border p-4"><Link href={`/region/${region.code}`} className="font-bold text-brandblue">{region.area} 가볼 만한 곳 →</Link><p className="mt-1 text-xs text-ink-soft">이번 주말 행사 {region.events.length}건 · 아이 동반 분류 장소 {region.kidPlaces}곳</p><div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold"><Link href={`/region/${region.code}#events`}>행사 보기</Link>{region.kidPlaces>=3&&<Link href={`/region/${region.code}#kids`}>아이와 보기</Link>}{region.dateEvents>=3&&<Link href={`/region/${region.code}#date`}>데이트 보기</Link>}</div></div>)}</div></section>
 <div className="mt-6"><WeekendDiscovery items={[...events,...selected.values()]} start={start} end={end} seasonLabel={seasonLabel}/></div>
 <section className="mt-10 border-t pt-7"><h2 className="text-xl font-bold">이번 주말 열리는 행사</h2><p className="mt-2 text-sm text-ink-soft">등록 일정이 이번 주말과 겹치는 행사입니다. 날짜와 운영 조건은 상세에서 확인하세요.</p><ul className="mt-4 grid gap-3 sm:grid-cols-2">{featured.map(event=><li key={event.id}><Link href={event.href} className="block rounded-xl border p-4 hover:border-brandblue"><strong className="block break-keep">{event.title}</strong><span className="mt-1 block text-xs text-ink-soft">{event.area} · {formatKoreanDate(event.end||end)}까지 등록</span></Link></li>)}</ul></section>
 <section className="mt-8 border-t pt-6"><h2 className="text-lg font-bold">더 자세히 찾아보기</h2><div className="mt-3 flex flex-wrap gap-3 text-sm">{[['문화행사 전체 필터','/events'],['전국 나들이 전체','/places'],['계절 나들이','/season'],['시티투어','/city-tour'],['반려동물 여행','/pet-travel'],['캠핑','/camping']].map(([label,href])=><Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl border px-4">{label}</Link>)}</div><p className="mt-4 text-xs leading-6 text-ink-soft">사이트에 저장된 문화행사·관광정보 중 지역별 후보를 선별합니다. 전체 관광지 목록이나 실시간 인기 순위가 아니며, 조건이 같으면 같은 결과가 나옵니다. 방문자별 공공 API·AI 호출은 없습니다.</p><p className="mt-2 text-xs text-ink-soft">행사 자료 갱신: <time dateTime={getGeneratedAt()}>{new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric'}).format(new Date(getGeneratedAt()))}</time></p></section></main>;
}
