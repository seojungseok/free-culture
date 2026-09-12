import Link from 'next/link';
import type {TicketArticle} from '@/lib/tickets';
import {nearbyPool} from '@/lib/nearData';
import {nearDistanceLabel,queryNearby} from '@/lib/nearSearch';
import {SIDO_SLUG} from '@/lib/classify';

type Card={id:string;title:string;url:string;distanceKm?:number};

export default function TicketNearby({article}:{article:TicketArticle}) {
  const point=article.location?.status==='verified'
    ? {lat:article.location.lat,lng:article.location.lng}
    : undefined;
  if(!point){
    const areaSlug=(SIDO_SLUG as Record<string,string>)[article.area];
    if(!areaSlug)return null;
    return <section className="mt-10 rounded-2xl border border-[#dce7d9] bg-[#f4f8f2] p-5" aria-label="지역 나들이와 맛집">
      <p className="text-sm font-bold text-free">이용권과 함께 둘러보기</p>
      <h2 className="mt-1 text-xl font-black">{article.area} 가볼 만한 곳과 맛집</h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">이 글의 좌표가 아직 확인되지 않아, 같은 지역의 공개 콘텐츠를 연결했어요.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2"><Link href={`/places/${areaSlug}`} className="rounded-xl border border-line bg-white p-3 text-sm font-bold text-ink hover:border-free">{article.area} 가볼 만한 곳 보기</Link><Link href={`/food/${areaSlug}`} className="rounded-xl border border-line bg-white p-3 text-sm font-bold text-ink hover:border-free">{article.area} 맛집 보기</Link></div>
    </section>;
  }
  const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
  const picks=(kind:'place'|'food')=>queryNearby(nearbyPool(),{point,kind,radius:15,limit:3,offset:0},today).items;
  const places=picks('place'),foods=picks('food');
  if(!places.length&&!foods.length)return null;
  const cards=(items:Card[])=>items.map(item=><Link key={item.id} href={item.url} className="block min-w-0 overflow-hidden rounded-xl border border-line bg-white p-3 transition hover:border-free focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-free"><strong className="block break-words text-sm leading-5 text-ink">{item.title}</strong><span className="mt-1 block text-xs text-ink-soft">{item.distanceKm!==undefined?nearDistanceLabel(item.distanceKm):'거리 정보 없음'} · 자세히 보기</span></Link>);
  return <section className="mt-10 min-w-0 overflow-hidden rounded-2xl border border-[#dce7d9] bg-[#f4f8f2] p-5" aria-label="근처 나들이와 맛집">
    <p className="text-sm font-bold text-free">이용권과 함께 둘러보기</p>
    <h2 className="mt-1 text-xl font-black">근처 가볼 만한 곳과 맛집</h2>
    <p className="mt-2 text-sm leading-6 text-ink-soft">등록된 좌표 기준으로 가까운 공개 콘텐츠만 골랐어요. 방문 전 영업 정보와 이동 경로를 함께 살펴보세요.</p>
    {places.length>0&&<div className="mt-4"><h3 className="text-sm font-bold">근처 가볼 만한 곳</h3><div className="mt-2 grid gap-2 sm:grid-cols-3">{cards(places)}</div></div>}
    {foods.length>0&&<div className="mt-4"><h3 className="text-sm font-bold">근처 맛집</h3><div className="mt-2 grid gap-2 sm:grid-cols-3">{cards(foods)}</div></div>}
  </section>;
}
