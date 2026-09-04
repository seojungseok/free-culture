import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTourById, tourTypeLabel } from "@/lib/tour";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const spot = getTourById((await params).id);
  return spot ? { title: `${spot.title} 반려동물 동반 여행 | 오늘은 뭐하지`, description: `${spot.area} ${spot.title}의 주소와 사진, 반려동물 동반 여행 정보를 확인해보세요.` } : {};
}

export default async function PetTravelDetail({ params }: { params: Promise<{ id: string }> }) {
  const spot = getTourById((await params).id);
  if (!spot) notFound();
  return <main className="mx-auto max-w-[960px] px-5 py-8 sm:px-6 lg:px-8"><Link href="/pet-travel" className="text-[13px] font-bold text-free">← 반려동물 여행지 목록</Link><article className="mt-5 overflow-hidden rounded-2xl border border-line bg-white"><div className="aspect-[16/7] bg-tint">{spot.image ? <img src={spot.image} alt={`${spot.title} 반려동물 여행 사진`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl">🐾</div>}</div><div className="p-5 sm:p-8"><p className="text-[13px] font-bold text-free">{spot.area} · {tourTypeLabel(spot.type)}</p><h1 className="mt-2 text-[26px] font-black text-ink sm:text-[34px]">{spot.title}</h1><p className="mt-5 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">반려동물 동반 여행 정보</strong><br />한국관광공사 관광정보를 바탕으로 장소를 안내합니다. 반려동물 입장 범위와 이용 조건은 방문 전 공식 안내를 확인해주세요.</p>{spot.addr && <p className="mt-4 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">주소</strong><br />{spot.addr}</p>}{spot.tel && <p className="mt-2 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">전화</strong><br /><a href={`tel:${spot.tel}`} className="text-free">{spot.tel}</a></p>}<nav className="mt-7 flex flex-wrap gap-4 border-t border-line pt-5 text-[13px] font-bold text-free"><Link href="/places">지역별 나들이</Link><Link href="/camping">반려동물 동반 캠핑</Link><Link href="/food">주변 맛집 찾아보기</Link></nav></div></article></main>;
}
