import TripSave from "@/components/TripSave";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTourById, tourTypeLabel } from "@/lib/tour";
import { getPetTravelPlace, getPetTravelPlaces, normalizePetIntro, normalizePetInfo, sanitizePetInfoText, petOverview, petQuality } from "@/lib/petTravel";

// Data changes only in a new deployment; do not regenerate unchanged JSON per day/visitor.
export const revalidate = false;
export function generateStaticParams() { return getPetTravelPlaces().map(p=>({id:p.id})); }


async function findPlace(id: string) {
  return getPetTravelPlace(id) || getTourById(id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id;
  const spot = await findPlace(id);
  if (!spot) return {};
  const description = petOverview(spot).slice(0,155) || `${spot.title} 상세정보 보강 중입니다.`;
  return {
    title: `${spot.title} 반려동물 동반 여행`,
    robots: petQuality(spot).publishable ? undefined : {index:false,follow:true},
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

  if (!petQuality(spot).publishable) return <main className="mx-auto max-w-[960px] px-5 py-10"><h1 className="text-2xl font-bold">{spot.title}</h1><p className="my-5 leading-7">장소 소개와 반려동물 동반 조건을 확인하고 있습니다. 정보가 충분히 확보될 때까지 여행지 추천에서 제외합니다.</p><Link href="/pet-travel" className="font-bold text-free">상세정보가 준비된 반려동물 여행지 보기 →</Link></main>;

  const type = "type" in spot ? spot.type || "" : "";
  const address = "address" in spot ? spot.address : spot.addr;
  const petInfo = "petRaw" in spot && spot.petRaw ? normalizePetInfo(spot.petRaw) : "petInfo" in spot ? sanitizePetInfoText(spot.petInfo) : "";
  const summary = petOverview(spot);
  const intro = "intro" in spot ? normalizePetIntro(spot.intro || {}) : {};
  const info = "info" in spot ? spot.info || [] : [];
  const hero = spot.image || ("images" in spot ? spot.images?.[0] : '') || '';
  const gallery = "images" in spot ? [...new Set(spot.images || [])].filter(src=>src.replace(/^http:/,'https:')!==hero.replace(/^http:/,'https:')) : [];
  const description = `${spot.area || "전국"} ${spot.title} 반려동물 동반 여행 정보`;
  const summaryParagraphs = summary
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((parts, sentence, index) => {
      const bucket = Math.floor(index / 2);
      parts[bucket] = `${parts[bucket] ? `${parts[bucket]} ` : ""}${sentence}`;
      return parts;
    }, []);
  const petInfoParagraphs = petInfo.split(/\n{2,}/).filter(Boolean);
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
  const photo = (src: string, index: number) => <figure key={`${src}-${index}`} className="my-6"><img src={src} alt={`${spot.title} 반려동물 여행 사진 ${index + 1}`} loading="lazy" className="aspect-[16/9] w-full rounded-xl object-cover" /><figcaption className="mt-2 text-center text-[11px] text-ink-faint">{spot.title} 여행 사진</figcaption></figure>;

  return (
    <main className="mx-auto max-w-[960px] px-5 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/pet-travel" className="text-[13px] font-bold text-free">← 반려동물 여행지 목록</Link>
      <article className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="aspect-[16/7] bg-tint">
          {hero ? <img src={hero} alt={`${spot.title} 반려동물 여행 사진`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl">🐾</div>}
        </div>
        <div className="p-5 sm:p-8">
          <p className="text-[13px] font-bold text-free">{spot.area || "전국"} · {tourTypeLabel(type)}</p>
          <h1 className="mt-2 text-[26px] font-black text-ink sm:text-[34px]">{spot.title}</h1>
      <TripSave trip={{id:"pet:"+spot.id,title:spot.title,stops:[{id:"pet:"+spot.id,title:spot.title,href:"/pet-travel/"+spot.id,area:spot.area || "",kind:"pet",address:address || ""}]}}/>
          <section className="mt-5 space-y-4 text-[14px] leading-7 text-ink-soft">
            <p><strong className="text-ink">{spot.title} 반려동물 동반 여행</strong></p>
            {summaryParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>
          {gallery[0] && photo(gallery[0], 0)}

          {!petInfo && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm">이 장소의 구체적인 동반 조건을 아직 확인하지 못했습니다. 안내견 허용과 일반 반려동물 허용은 다릅니다. 일반 반려동물 동반 가능 장소로 단정하거나 코스에 자동 포함하지 않습니다.</p>}
          {petInfoParagraphs.length > 0 && <section className="mt-5 rounded-xl bg-tint p-4"><h2 className="text-[15px] font-extrabold text-ink">반려동물 이용 안내</h2><div className="mt-3 space-y-3 text-[13px] leading-6 text-ink-soft">{petInfoParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section>}
          {Object.keys(intro).length > 0 && <section className="mt-6"><h2 className="text-[18px] font-extrabold text-ink">운영·편의시설 안내</h2><dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(intro).slice(0, 12).map(([name, value]) => <div key={name} className="rounded-lg bg-panel px-3 py-3"><dt className="text-[11px] font-bold text-ink-faint">{name}</dt><dd className="mt-1 break-words text-[13px] leading-6 text-ink-soft">{String(value)}</dd></div>)}</dl></section>}
          {gallery[1] && photo(gallery[1], 1)}
          {info.length > 0 && <section className="mt-6"><h2 className="text-[18px] font-extrabold text-ink">시설·이용 안내</h2><div className="mt-2 space-y-3">{info.slice(0, 10).map((item, index) => <div key={`${item.name}-${index}`}><h3 className="text-[14px] font-bold text-ink">{item.name || "이용 안내"}</h3><p className="mt-1 text-[13px] leading-6 text-ink-soft">{item.text}</p></div>)}</div></section>}
          {gallery[2] && photo(gallery[2], 2)}
          <p className="mt-6 text-[12px] leading-6 text-ink-faint">출처: 한국관광공사 반려동물 동반여행 정보{("enrichedAt" in spot && spot.enrichedAt) ? ` · 수집 확인일 ${spot.enrichedAt.slice(0,10)}` : ''}. 동반 조건과 운영정보는 변경될 수 있으니 방문 전 운영처에서 확인해 주세요.</p>
          {gallery.length > 3 && <section className="mt-6"><h2 className="text-[18px] font-extrabold text-ink">여행 사진 더 보기</h2><div className="mt-3 grid grid-cols-2 gap-2">{gallery.slice(3, 8).map((src, index) => <img key={src} src={src} alt={`${spot.title} 반려동물 여행 사진 ${index + 4}`} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />)}</div></section>}
          {address && <p className="mt-5 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">주소</strong><br />{address}</p>}
          {spot.tel && <p className="mt-2 text-[14px] leading-6 text-ink-soft"><strong className="text-ink">전화</strong><br /><a href={`tel:${spot.tel}`} className="text-free">{spot.tel}</a></p>}
          <nav className="mt-7 flex flex-wrap gap-4 border-t border-line pt-5 text-[13px] font-bold text-free" aria-label="관련 여행 정보"><Link href="/pet-travel">지역별 반려동물 여행지</Link><Link href="/season">계절 나들이</Link><Link href="/camping">캠핑장 동반 조건 확인</Link><Link href="/food">여행지 주변 맛집 찾아보기</Link><Link href="/course">가족 여행코스</Link></nav>
        </div>
      </article>
    </main>
  );
}
