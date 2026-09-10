import type {Metadata} from 'next';
import Link from 'next/link';
import CityTourBrowser from '@/components/CityTourBrowser';
import {getCityTours,CITY_SOURCE} from '@/lib/cityTours';
export const metadata:Metadata={title:'전국 시티투어 코스 | 탑승 장소·요금·주변 나들이',description:'지역별 시티투어 코스의 경유지와 탑승 장소, 원본 요금·운행 조건을 확인하고 관련 관광지와 식사 후보를 함께 살펴보세요.',alternates:{canonical:'/city-tour'}};
export default function CityTours(){const items=getCityTours();return <main className="mx-auto max-w-6xl px-4 py-8">
 <nav className="mb-4 text-sm text-ink-soft"><Link href="/">홈</Link> / 시티투어</nav>
 <h1 className="text-3xl font-black">전국 시티투어</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">탑승 장소부터 경유지, 함께 둘러볼 나들이까지. 원본 자료를 정리한 코스별 안내 {items.length}개를 지역별로 찾아보세요.</p>
 <p className="my-6 rounded-xl bg-amber-50 p-4 text-sm leading-6">현재 운행·예약 가능 여부를 실시간으로 확인한 목록은 아닙니다. 각 글의 원본 기준일과 공식 문의처를 확인해 주세요.</p>
 <CityTourBrowser items={items.map(a=>({id:a.id,title:a.title,description:a.description,area:a.area,city:a.city,route:a.raw['시티투어코스정보'],operating:a.raw['시티투어운영시간'],image:a.image,imageTitle:a.imageTitle,date:a.raw['데이터기준일자']}))}/>
 <p className="mt-10 text-xs leading-6 text-ink-faint">자료 출처: <a href={CITY_SOURCE} target="_blank" rel="noopener noreferrer" className="underline">공공데이터포털 전국시티투어정보표준데이터</a> · 내부 관광지·음식점 자료: 한국관광공사. 작성 순서는 검색량 실측 순위가 아닌 지역 인지도와 자료 충실도를 고려했습니다.</p>
 </main>;}
