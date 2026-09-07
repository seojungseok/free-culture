import Link from 'next/link';
import type {Metadata} from 'next';
import WeekendDiscovery from '@/components/WeekendDiscovery';
import {getWeekend} from '@/lib/data';
import {placeStops} from '@/lib/plannerData';
import {weekendRangeYmd,formatKoreanDate} from '@/lib/dates';
import {SEASON_KEYWORDS} from '@/lib/season';
import type {WeekendCandidate} from '@/lib/weekendDiscovery';
export const revalidate=3600;
export const metadata:Metadata={title:'이번 주말 가볼만한 곳·행사 추천',description:'지역과 방문일, 자연·산책·계절 나들이·문화행사·아이 동반·무료 조건으로 이번 주말 방문 후보를 찾아보세요.',alternates:{canonical:'/weekend'}};
export default function WeekendPage(){
 const {start,end}=weekendRangeYmd(),month=Number(start.slice(4,6));
 const season=month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
 const seasonLabel={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'}[season];
 const places:WeekendCandidate[]=placeStops().map(p=>({...p,nature:/공원|숲|수목원|휴양림|둘레길|해변|계곡|산책|생태|정원/.test(p.title),seasonal:SEASON_KEYWORDS[season].some(k=>p.title.includes(k))}));
 // Bound the snapshot and retain different interests in each region; never choose the first region for a visitor.
 const selected=new Map<string,WeekendCandidate>();
 for(const area of [...new Set(places.map(p=>p.area))]){
  const pool=places.filter(p=>p.area===area).sort((a,b)=>Number(!!b.image)-Number(!!a.image)||(a.id<b.id?-1:1));
  for(const group of [pool,pool.filter(p=>p.nature),pool.filter(p=>p.seasonal),pool.filter(p=>p.kids),pool.filter(p=>p.free)])for(const p of group.slice(0,24))selected.set(p.id,p);
 }
 const events:WeekendCandidate[]=getWeekend().map(e=>({id:'event:'+e.id,title:e.title,href:'/event/'+e.id,area:e.area,kind:'event',image:e.imgUrl,address:e.address||e.place,start:e.startDate,end:e.endDate,free:e.priceType==='free',kids:e.audiences?.includes('kids')||false,nature:false,seasonal:false}));
 return <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6"><nav className="mb-4 text-sm text-ink-soft"><Link href="/">홈</Link> / 이번 주말</nav><h1 className="text-2xl font-black sm:text-3xl">이번 주말, 어디 갈까요?</h1><p className="mt-3 text-sm leading-7 text-ink-soft">{formatKoreanDate(start)}{start!==end?' ~ '+formatKoreanDate(end):''} · 행사만 보지 말고, 내 지역의 나들이도 함께 찾아보세요.</p><div className="mt-6"><WeekendDiscovery items={[...events,...selected.values()]} start={start} end={end} seasonLabel={seasonLabel}/></div>
 <section className="mt-8 border-t pt-6"><h2 className="text-lg font-bold">더 자세히 찾아보기</h2><div className="mt-3 flex flex-wrap gap-3 text-sm">{[['문화행사 전체 필터','/events'],['전국 나들이 전체','/places'],['계절 나들이','/season'],['시티투어','/city-tour'],['반려동물 여행','/pet-travel'],['캠핑','/camping']].map(([label,href])=><Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl border px-4">{label}</Link>)}</div><p className="mt-4 text-xs leading-6 text-ink-soft">사이트에 저장된 문화행사·관광정보 중 지역별 후보를 선별합니다. 전체 관광지 목록이나 실시간 인기 순위가 아니며, 조건이 같으면 같은 결과가 나옵니다. 방문자별 공공 API·AI 호출은 없습니다.</p></section></main>;
}
