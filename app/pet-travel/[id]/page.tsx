import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTourById, tourTypeLabel } from "@/lib/tour";
import { getPetTravelPlace } from "@/lib/petTravel";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id;
  const spot = getPetTravelPlace(id) || getTourById(id);
  return spot ? { title: `${spot.title} 반려동물 동반 여행 | 오늘은 뭐하지`, description: `${spot.area} ${spot.title}의 주소와 사진, 반려동물 동반 여행 정보를 확인해보세요.` } : {};
}

export default async function PetTravelDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const spot = getPetTravelPlace(id) || getTourById(id);
  if (!spot) notFound();
  const type = "type" in spot ? spot.type || "" : "";
  const address = "address" in spot ? spot.address : spot.addr;
  const petInfo = "petInfo" in spot ? spot.petInfo : "";
  const summary = "summary" in spot ? spot.summary : "";
  return <main className="mx-auto max-w-[960px] px-5 py-8 sm:px-6 lg:px-8"><Link href="/pet-travel" className="text-[13px] font-bold text-free">← 반려동물 여행지 목록</Link><article className="mt-5 overflow-hidden rounded-2xl border border-line bg-white"><div className="aspect-[16/7] bg-tint">{spot.image ? <img src={spot.image} alt={`${spot.title} 반려동물 여행 사진`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl">🐾</div>}</div><div className="p-5 sm:p-8"><p className="text-[13px] font-bold text-free">{spot.area} · {tourTypeLabel(type)}</p><h1 className="mt-2 text-[26px] font-black text-ink sm:text-[34px]">{spot.title}</h1><p className="mt-5 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">{spot.title} 반려동물 동반 여행 정보</strong><br />{summary || "반려동물과 함께 방문할 수 있는 여행지입니다."} 이용 조건은 계절과 운영 상황에 따라 달라질 수 있으니 방문 전 공식 안내를 확인해주세요.</p>{petInfo && <section className="mt-5 rounded-xl bg-tint p-4"><h2 className="text-[15px] font-extrabold text-ink">반려동물 이용 안내</h2><p className="mt-2 text-[13px] leading-6 text-ink-soft">{petInfo}</p></section>}{address && <p className="mt-4 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">주소</strong><br />{address}</p>}{spot.tel && <p className="mt-2 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">전화</strong><br /><a href={`tel:${spot.tel}`} className="text-free">{spot.tel}</a></p>}<nav className="mt-7 flex flex-wrap gap-4 border-t border-line pt-5 text-[13px] font-bold text-free"><Link href="/pet-travel">지역별 반려동물 여행지</Link><Link href="/places">지역별 나들이</Link><Link href="/camping">반려동물 동반 캠핑</Link><Link href="/food">주변 맛집 찾아보기</Link><Link href="/course">가족 여행코스</Link></nav></div></article></main>;
}
