import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTourById, tourTypeLabel } from "@/lib/tour";
import { fetchPetTravelDetail, getPetTravelPlace } from "@/lib/petTravel";

export const revalidate = 86400;

async function findPlace(id: string) {
  return getPetTravelPlace(id) || await fetchPetTravelDetail(id) || getTourById(id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id;
  const spot = await findPlace(id);
  if (!spot) return {};
  const description = `${spot.area || "전국"} ${spot.title} 반려동물 동반 여행 정보. 주소, 사진, 이용 안내와 방문 전 확인할 내용을 한곳에서 확인해보세요.`;
  return {
    title: `${spot.title} 반려동물 동반 여행 | 오늘은 뭐하지`,
    description,
    keywords: [spot.title, `${spot.area || "전국"} 반려동물 여행`, "강아지와 가볼만한곳", "애견동반 여행지"],
    alternates: { canonical: `/pet-travel/${spot.id}` },
    openGraph: { title: `${spot.title} 반려동물 동반 여행`, description, url: `/pet-travel/${spot.id}`, images: spot.image ? [spot.image] : undefined },
  };
}

export default async function PetTravelDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const spot = await findPlace(id);
  if (!spot) notFound();

  const type = "type" in spot ? spot.type || "" : "";
  const address = "address" in spot ? spot.address : spot.addr;
  const petInfo = "petInfo" in spot ? spot.petInfo : "";
  const summary = "summary" in spot ? spot.summary : "";
  const intro = "intro" in spot ? spot.intro || {} : {};
  const info = "info" in spot ? spot.info || [] : [];
  const gallery = "images" in spot ? spot.images?.slice(1) || [] : [];
  const description = `${spot.area || "전국"} ${spot.title} 반려동물 동반 여행 정보`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: spot.title,
    description: summary || description,
    image: [spot.image, ...gallery].filter(Boolean),
    url: `https://mwohaji.kr/pet-travel/${spot.id}`,
    telephone: spot.tel || undefined,
    address: address ? { "@type": "PostalAddress", streetAddress: address, addressCountry: "KR" } : undefined,
  };

  return (
    <main className="mx-auto max-w-[960px] px-5 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/pet-travel" className="text-[13px] font-bold text-free">← 반려동물 여행지 목록</Link>
      <article className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="aspect-[16/7] bg-tint">
          {spot.image ? <img src={spot.image} alt={`${spot.title} 반려동물 여행 사진`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl">🐾</div>}
        </div>
        <div className="p-5 sm:p-8">
          <p className="text-[13px] font-bold text-free">{spot.area || "전국"} · {tourTypeLabel(type)}</p>
          <h1 className="mt-2 text-[26px] font-black text-ink sm:text-[34px]">{spot.title}</h1>
          <p className="mt-5 text-[14px] leading-6 text-ink-soft">
            <strong className="text-ink">{spot.title} 반려동물 동반 여행</strong><br />
            {summary || "반려동물과 함께 방문을 계획하기 좋은 여행지입니다."} 가을에는 한결 선선한 날씨 속에서 산책과 풍경 감상을 함께 즐기기 좋아, 방문 시간과 동반 조건을 미리 확인하고 여유 있게 둘러보는 일정이 잘 어울립니다.
          </p>

          {petInfo && <section className="mt-5 rounded-xl bg-tint p-4"><h2 className="text-[15px] font-extrabold text-ink">반려동물 이용 안내</h2><p className="mt-2 text-[13px] leading-6 text-ink-soft">{petInfo}</p></section>}
          {Object.keys(intro).length > 0 && <section className="mt-5"><h2 className="text-[18px] font-extrabold text-ink">운영·편의시설 안내</h2><dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(intro).slice(0, 12).map(([name, value]) => <div key={name} className="rounded-lg bg-panel px-3 py-2"><dt className="text-[11px] font-bold text-ink-faint">{name}</dt><dd className="mt-1 text-[13px] leading-5 text-ink-soft">{value}</dd></div>)}</dl></section>}
          {info.length > 0 && <section className="mt-6"><h2 className="text-[18px] font-extrabold text-ink">시설·이용 안내</h2><div className="mt-2 space-y-3">{info.slice(0, 10).map((item, index) => <div key={`${item.name}-${index}`}><h3 className="text-[14px] font-bold text-ink">{item.name || "이용 안내"}</h3><p className="mt-1 text-[13px] leading-6 text-ink-soft">{item.text}</p></div>)}</div></section>}
          <section className="mt-6 rounded-xl border border-line bg-panel p-4"><h2 className="text-[18px] font-extrabold text-ink">방문 전 체크하면 좋은 것</h2><p className="mt-2 text-[13px] leading-6 text-ink-soft">목줄 또는 이동장, 배변봉투와 물을 준비하고, 실내 출입 가능 여부와 추가 요금·예약 여부는 출발 전 공식 안내에서 확인하세요. 계절 행사나 운영시간은 달라질 수 있어 전화 확인을 곁들이면 더욱 편합니다.</p></section>
          {gallery.length > 0 && <section className="mt-6"><h2 className="text-[18px] font-extrabold text-ink">여행 사진</h2><div className="mt-3 grid grid-cols-2 gap-2">{gallery.slice(0, 8).map((src, index) => <img key={src} src={src} alt={`${spot.title} 반려동물 여행 사진 ${index + 2}`} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />)}</div></section>}
          {address && <p className="mt-5 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">주소</strong><br />{address}</p>}
          {spot.tel && <p className="mt-2 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">전화</strong><br /><a href={`tel:${spot.tel}`} className="text-free">{spot.tel}</a></p>}
          <nav className="mt-7 flex flex-wrap gap-4 border-t border-line pt-5 text-[13px] font-bold text-free" aria-label="관련 여행 정보"><Link href="/pet-travel">지역별 반려동물 여행지</Link><Link href="/season">반려동물과 가을나들이</Link><Link href="/camping">반려동물 동반 캠핑</Link><Link href="/food">여행지 주변 맛집 찾아보기</Link><Link href="/course">가족 여행코스</Link></nav>
        </div>
      </article>
    </main>
  );
}
