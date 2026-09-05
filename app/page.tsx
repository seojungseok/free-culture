import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getWeekend, getFree, getFeatured, getEndingSoon, slimForClient } from "@/lib/data";
import { getPlacesSample, getAllPlaces, type TourSpot } from "@/lib/tour";
import { getAllCamps, type Camp } from "@/lib/camping";
import { getAllCourses, slimCourse } from "@/lib/courses";
import { getPetTravelPlaces, type PetTravelPlace } from "@/lib/petTravel";
import { todayYmd } from "@/lib/dates";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";
import { season } from "@/lib/finder";
import { SITE } from "@/lib/site";
import { fmtRange } from "@/lib/format";
import type { CultureEvent } from "@/lib/types";

export const revalidate = 3600;
// Homepage content rotates by date while the page remains ISR cached for an hour.

export const metadata: Metadata = {
  title: {
    absolute: `${SITE.name} · 이번 주말 갈 만한 전국 무료·저렴 문화행사`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
};

const heroImages: Record<string, { image: string; position: string }> = {
  spring: { image: "https://tong.visitkorea.or.kr/cms/resource/44/3540444_image2_1.jpg", position: "center 46%" },
  summer: { image: "https://tong.visitkorea.or.kr/cms/resource/89/3544389_image2_1.jpg", position: "center 45%" },
  autumn: { image: "https://tong.visitkorea.or.kr/cms/resource/57/3364557_image2_1.JPG", position: "center 42%" },
  winter: { image: "https://tong.visitkorea.or.kr/cms/resource/89/3562189_image2_1.jpg", position: "center 42%" },
  default: { image: "https://tong.visitkorea.or.kr/cms/resource/56/3539656_image2_1.jpg", position: "center 46%" },
};

const SIDO_NAME: Record<string, string> = {
  경기: "경기도",
  강원: "강원도",
  충북: "충청북도",
  충남: "충청남도",
  전북: "전라북도",
  전남: "전라남도",
  경북: "경상북도",
  경남: "경상남도",
  제주: "제주도",
};
const displaySido = (sido: string) => SIDO_NAME[sido] || sido;

const regionImages: Record<string, string> = {
  서울: "https://tong.visitkorea.or.kr/cms/resource/56/3539656_image2_1.jpg",
  경기: "https://tong.visitkorea.or.kr/cms/resource/68/3482668_image2_1.jpg",
  인천: "https://tong.visitkorea.or.kr/cms/resource/78/3302878_image2_1.jpg",
  부산: "https://tong.visitkorea.or.kr/cms/resource/42/3071042_image2_1.JPG",
  제주: "https://tong.visitkorea.or.kr/cms/resource/95/3552095_image2_1.jpg",
};

type HomeCourse = ReturnType<typeof slimCourse>;

interface HomeExploreItem {
  id: string;
  href: string;
  title: string;
  meta: string;
  image: string;
  badge: string;
  desc?: string;
}

export default function HomePage() {
  const today = todayYmd();
  const seasonal = season();
  const hero = heroImages[seasonal.key] || heroImages.default;

  const featuredEvents = slimForClient(getFeatured(8).filter((e) => e.imgUrl));
  const freeCards = slimForClient(getFree(true).filter((e) => e.imgUrl && e.startDate <= today && e.endDate >= today).slice(0, 10));
  const weekendCards = slimForClient(getWeekend().filter((e) => e.imgUrl).slice(0, 4));
  const placeCards = getPlacesSample(40).filter((p) => p.image).slice(0, 8);
  const courseCards = shuffleByDay(getAllCourses(), today).slice(0, 8).map(slimCourse);
  const campCards = getAllCamps().filter((c) => c.image).slice(0, 8);
  const allPlaces = getAllPlaces().filter((p) => p.image);
  const seasonPlaces = allPlaces
    .filter((p) => seasonPlaceMatch(p, seasonal.key, seasonal.label))
    .slice(0, 5);
  const regionImageByArea = Object.fromEntries(
    SIDO_LIST.map((area) => [
      area,
      regionImages[area] || allPlaces.find((p) => p.area === area)?.image || campCards.find((c) => c.area === area)?.image || hero.image,
    ])
  ) as Record<string, string>;

  const petCards = getPetTravelPlaces();
  const popularCards = [
    eventToPopular(dailyPick(freeCards, today, 1) || dailyPick(featuredEvents, today, 1) || dailyPick(weekendCards, today, 1)),
    courseToPopular(dailyPick(courseCards, today, 2)),
    placeToPopular(dailyPick(seasonPlaces, today, 3), "가을나들이"),
    petToPopular(dailyPick(petCards, today, 4)),
  ].filter(Boolean) as PopularCard[];

  const endingCards = slimForClient(getEndingSoon(14).filter((e) => e.imgUrl).slice(0, 10));
  const kidsCards = allPlaces.filter((p) => p.isKid).slice(0, 10);
  const seasonCards = (seasonPlaces.length ? seasonPlaces : placeCards).slice(0, 5);

  return (
    <>
      <Hero image={hero.image} position={hero.position} seasonalLabel={seasonal.label} />

      <main className="bg-white pb-10">
        <GamePromoBanner />
        <HomeSection title="지금 가장 인기 있는 콘텐츠" href="/events">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {popularCards.map((card) => (
              <PopularContentCard key={card.href} card={card} />
            ))}
          </div>
        </HomeSection>

        <RailSection title={`${seasonal.label}나들이`} href="/season" items={seasonCards.map((spot) => placeToExplore(spot, `${seasonal.label} 여행`))} limit={5} />
        <RailSection title="오늘의 무료 문화행사" href="/free" items={freeCards.map(eventToExplore)} />
        <RailSection title="마감 임박 문화행사" href="/ending-soon" items={endingCards.map(eventToExplore)} />
        <RailSection title="나들이" href="/places" items={placeCards.map((spot) => placeToExplore(spot))} />
        <RailSection title="아이와 가볼만한곳" href="/kids" items={kidsCards.map((spot) => placeToExplore(spot))} />
        <RailSection title="추천 여행코스" href="/course" items={courseCards.map(courseToExplore)} />
        <RailSection title="캠핑" href="/camping" items={campCards.map(campToExplore)} />

        <HomeSection title="어디로 갈까요?" compactMobile>
          <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-3">
              {SIDO_LIST.map((area) => (
                <RegionPhotoCard key={area} area={area} image={regionImageByArea[area]} />
              ))}
            </div>
          </div>
        </HomeSection>

        <section className="mx-auto hidden w-full max-w-[1180px] px-5 pt-5 sm:block sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[12px] text-ink-faint">
            {SIDO_LIST.map((sido) => (
              <Link
                key={sido}
                href={`/region/${(SIDO_SLUG as Record<string, string>)[sido]}`}
                prefetch={false}
                className="rounded-full px-2 py-1 hover:bg-tint hover:text-free"
              >
                {displaySido(sido)}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const MONTH_THEMES = ["겨울 실내 나들이", "설날·겨울 행사", "봄꽃·문화행사", "벚꽃·축제", "가정의 달 행사", "초여름 나들이", "여름방학·축제", "휴가철 문화행사", "추석·가을 축제", "단풍·가을 행사", "늦가을 전시·공연", "겨울 축제·연말 행사"];

function MonthlyHub() {
  const month = new Date().getMonth() + 1;
  return (
    <HomeSection title="이번 달 뭐하지?">
      <div className="overflow-hidden rounded-2xl border border-[#ead8b8] bg-[#fff8e9] p-4 sm:p-5">
        <Link href={`/month/${month}`} prefetch={false} className="flex min-h-[78px] items-center justify-between gap-4 rounded-xl bg-[#9c5b24] px-5 py-4 text-white shadow-sm transition hover:bg-[#804619]">
          <span><strong className="block text-[19px] font-black sm:text-[23px]">{MONTH_LABELS[month - 1]}에 뭐하지?</strong><span className="mt-1 block text-[12px] font-semibold text-[#ffe8c4]">{MONTH_THEMES[month - 1]}를 행사·축제·지역 필터로 찾아보세요.</span></span>
          <span aria-hidden="true" className="text-2xl">→</span>
        </Link>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {MONTH_LABELS.map((label, i) => <Link key={label} href={`/month/${i + 1}`} prefetch={false} className={["flex min-h-9 items-center justify-center rounded-lg px-1 text-[12px] font-bold transition", i + 1 === month ? "bg-[#f2d09d] text-[#744317]" : "bg-white/80 text-ink-soft hover:bg-white hover:text-ink"].join(" ")}>{label}</Link>)}
        </div>
      </div>
    </HomeSection>
  );
}

function Hero({ image, position, seasonalLabel }: { image: string; position: string; seasonalLabel: string }) {
  const cats = [
    ["문화행사", "/events"],
    ["나들이", "/places"],
    ["여행코스", "/course"],
    ["캠핑", "/camping"],
    ["맛집탐방", "/food"],
    ["전통시장", "/traditional-market"],
    ["🐾 반려동물 여행", "/pet-travel"],
    ["아이와함께", "/kids"],
    ["데이트", "/date"],
    [`${seasonalLabel}나들이`, "/season"],
  ];

  return (
    <section
      className="relative overflow-hidden bg-[#dcebf8]"
      style={{
        backgroundImage:
          `linear-gradient(90deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.22) 45%, rgba(255,255,255,0.44) 100%), linear-gradient(180deg, rgba(216,235,253,0.1) 0%, rgba(255,255,255,0.52) 100%), url('${image}')`,
        backgroundPosition: position,
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto flex min-h-[288px] w-full max-w-[1180px] flex-col items-center justify-center px-5 py-7 text-center sm:min-h-[350px] sm:px-6 lg:min-h-[382px] lg:px-8">
        <h1 className="text-[28px] font-black leading-[1.12] tracking-tight text-[#102344] sm:text-[44px] lg:text-[48px]">
          이번 주말, 어디로 떠날까요?
        </h1>
        <p className="mt-2 text-[14px] font-semibold text-[#13243d] sm:mt-3 sm:text-[18px]">
          전국 문화행사, 나들이, 여행코스, 캠핑까지 한 번에!
        </p>
        <div className="mt-5 grid w-full max-w-[680px] grid-cols-4 gap-2 sm:mt-7 sm:gap-3">
          {cats.map(([label, href]) => label === "전통시장" ? (
            <span key={label} aria-disabled="true" className="flex min-h-[46px] cursor-not-allowed items-center justify-center rounded-2xl bg-white/35 px-2 text-center text-[13px] font-extrabold text-[#102344]/45 shadow-sm ring-1 ring-black/5 backdrop-blur sm:min-h-[52px] sm:text-[15px]">{label}</span>
          ) : (
            <Link key={label} href={href} className="flex min-h-[46px] items-center justify-center rounded-2xl bg-white/95 px-2 text-center text-[13px] font-extrabold text-[#102344] shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-brandblue sm:min-h-[52px] sm:text-[15px]">{label}</Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeSection({ title, href, compactMobile = false, children }: { title: string; href?: string; compactMobile?: boolean; children: React.ReactNode }) {
  return (
    <section className={["mx-auto w-full max-w-[1180px] px-5 sm:px-6 sm:pt-9 lg:px-8", compactMobile ? "pt-5" : "pt-6"].join(" ")}>
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <h2 className="text-[20px] font-black tracking-tight text-ink sm:text-[24px]">{title}</h2>
        {href && (
          <Link href={href} className="shrink-0 text-[13px] font-bold text-ink-soft transition hover:text-brandblue sm:text-[14px]">
            더보기 ›
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

interface PopularCard {
  href: string;
  title: string;
  sub: string;
  badge: string;
  image: string;
  tone: string;
}

function eventToPopular(ev?: CultureEvent): PopularCard | null {
  if (!ev) return null;
  return {
    href: `/event/${ev.id}`,
    title: ev.title,
    sub: fmtRange(ev.startDate, ev.endDate),
    badge: ev.realmName || "문화행사",
    image: ev.imgUrl || "",
    tone: "bg-brandblue",
  };
}

function placeToPopular(spot?: TourSpot, badge = "나들이"): PopularCard | null {
  if (!spot) return null;
  return {
    href: `/places/spot/${spot.id}`,
    title: spot.title,
    sub: spot.area,
    badge,
    image: spot.image,
    tone: "bg-free",
  };
}

function courseToPopular(course?: HomeCourse): PopularCard | null {
  if (!course) return null;
  return {
    href: `/course/c/${course.id}`,
    title: course.title,
    sub: course.area,
    badge: "여행코스",
    image: course.image,
    tone: "bg-paid",
  };
}

function campToPopular(camp?: Camp): PopularCard | null {
  if (!camp) return null;
  return {
    href: `/camping/${camp.id}`,
    title: camp.name,
    sub: [camp.area, camp.sigungu].filter(Boolean).join(" "),
    badge: "캠핑",
    image: camp.image,
    tone: "bg-[#7048e8]",
  };
}

function petToPopular(place?: PetTravelPlace): PopularCard | null {
  if (!place) return { href: "/pet-travel", title: "반려동물과 함께 가볼 곳", sub: "반려동물 여행지 모아보기", badge: "반려동물 여행", image: "https://tong.visitkorea.or.kr/cms/resource/95/3552095_image2_1.jpg", tone: "bg-[#e17b45]" };
  return { href: `/pet-travel/${place.id}`, title: place.title, sub: place.area || place.address || "", badge: "반려동물 여행", image: place.image || "https://tong.visitkorea.or.kr/cms/resource/95/3552095_image2_1.jpg", tone: "bg-[#e17b45]" };
}

function RailSection({ title, href, items, desc, limit = 10 }: { title: string; href: string; items: HomeExploreItem[]; desc?: string; limit?: number }) {
  if (!items.length) return null;
  const id =
    title.includes("무료") ? "section-events" :
    title.includes("인기 문화") ? "section-ending" :
    title === "나들이" ? "section-places" :
    title.includes("아이") ? "section-kids" :
    title.includes("여행") ? "section-course" :
    title.includes("캠핑") ? "section-camping" :
    "section-season";

  return (
    <section id={id} className="mx-auto w-full max-w-[1180px] px-5 pt-6 sm:px-6 sm:pt-9 lg:px-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-black tracking-tight text-ink sm:text-[24px]">{title}</h2>
          {desc ? <p className="mt-1 max-w-3xl text-[13px] leading-6 text-ink-soft sm:text-[14px]">{desc}</p> : null}
        </div>
        <Link href={href} className="shrink-0 text-[13px] font-bold text-ink-soft transition hover:text-brandblue">더보기 ›</Link>
      </div>
      <div className="relative">
        <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-3 sm:mx-0 sm:px-0">
          {items.slice(0, limit).map((item) => (
            <Link key={item.id} href={item.href} prefetch={false} className="group w-[168px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#e3e7ee] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-cardhover sm:w-[220px]">
              <div className="relative aspect-[1.45/1] overflow-hidden bg-neutral-100">
                <CardImage src={item.image} alt={item.title} />
                <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{item.badge}</span>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 min-h-[38px] text-[14px] font-black leading-snug text-ink">{item.title}</h3>
                <p className="mt-1 line-clamp-1 text-[12px] text-ink-faint">{item.meta}</p>
                {item.desc && <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-ink-soft">{item.desc}</p>}
              </div>
            </Link>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-[-1px] w-12 bg-gradient-to-l from-white to-transparent" />
      </div>
      <p className="mt-1 text-right text-[11.5px] font-bold text-ink-faint sm:hidden">오른쪽으로 밀어서 더보기 ›</p>
    </section>
  );
}

function eventToExplore(ev: CultureEvent): HomeExploreItem {
  return {
    id: `event-${ev.id}`,
    href: `/event/${ev.id}`,
    title: ev.title,
    meta: [ev.area, fmtRange(ev.startDate, ev.endDate)].filter(Boolean).join(" · "),
    image: ev.imgUrl || "",
    badge: ev.realmName || "문화행사",
  };
}

function placeToExplore(spot: TourSpot, badge = "나들이"): HomeExploreItem {
  const autumn = badge.includes("가을");
  const desc = autumn ? autumnPlaceCopy(spot) : undefined;
  return {
    id: `place-${spot.id}`,
    href: `/places/spot/${spot.id}`,
    title: spot.title,
    meta: spot.area,
    image: spot.image,
    badge: spot.isKid ? "아이와" : badge,
    desc,
  };
}

function autumnPlaceCopy(spot: TourSpot): string {
  const text = `${spot.title} ${spot.overview || ""}`;
  if (/단풍|은행|가을/.test(text)) return "단풍길이 아름다운 산책 명소";
  if (/수목원|정원|숲/.test(text)) return "가을 숲과 정원을 걷기 좋은 곳";
  if (/호수|강|하천/.test(text)) return "물길과 가을빛이 어우러진 산책길";
  return "선선한 가을에 걷기 좋은 나들이";
}

function courseToExplore(course: HomeCourse): HomeExploreItem {
  return {
    id: `course-${course.id}`,
    href: `/course/c/${course.id}`,
    title: course.title,
    meta: [course.area, course.duration].filter(Boolean).join(" · "),
    image: course.image,
    badge: "여행코스",
  };
}

function campToExplore(camp: Camp): HomeExploreItem {
  return {
    id: `camp-${camp.id}`,
    href: `/camping/${camp.id}`,
    title: camp.name,
    meta: [camp.area, camp.sigungu].filter(Boolean).join(" · "),
    image: camp.image,
    badge: "캠핑",
  };
}

function PopularContentCard({ card }: { card: PopularCard }) {
  return (
    <Link href={card.href} prefetch={false} className="group relative block aspect-[1/1.04] overflow-hidden rounded-2xl bg-neutral-200 shadow-sm ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-cardhover md:aspect-[1/1.08]">
      <CardImage src={card.image} alt={card.title} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/24 to-transparent" />
      <div className="absolute left-3 top-3">
        <span className={`rounded-md ${card.tone} px-2 py-1 text-[11px] font-black text-white shadow-sm`}>{card.badge}</span>
      </div>
      <HeartIcon className="absolute right-3 top-3 h-7 w-7 text-white drop-shadow" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-2 text-[16px] font-black leading-tight tracking-tight md:text-[20px]">{card.title}</h3>
        <p className="mt-1.5 line-clamp-1 text-[12px] font-semibold text-white/88 md:text-[13px]">{card.sub}</p>
      </div>
    </Link>
  );
}

function RegionPhotoCard({ area, image }: { area: string; image: string }) {
  return (
    <Link href={`/region/${(SIDO_SLUG as Record<string, string>)[area]}`} prefetch={false} className="group relative block aspect-[1.28/1] w-[132px] shrink-0 overflow-hidden rounded-2xl bg-neutral-200 shadow-sm ring-1 ring-black/[0.04] sm:w-[168px] md:w-[186px]">
      <CardImage src={image} alt={`${area} 지역`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <span className="absolute inset-x-0 bottom-3 text-center text-[18px] font-black text-white drop-shadow sm:text-[22px]">{area}</span>
    </Link>
  );
}

function GamePromoBanner() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-5 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <Link
        href="/game"
        aria-label="나만 아니면 돼 독박게임 하러 가기"
        className="group relative flex min-h-[62px] items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#dfe8f7] bg-gradient-to-r from-[#eef6ff] via-white to-[#edf8f3] px-4 py-2.5 text-[#102344] shadow-sm transition hover:border-brandblue/30 hover:shadow-card sm:min-h-[70px] sm:px-6"
      >
        <span className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_15%_50%,rgba(45,127,249,0.16),transparent_42%)]" />
        <span className="relative z-10 flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brandblue/10 text-[20px] ring-1 ring-brandblue/15">🎮</span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-bold text-ink-faint sm:text-[13px]">심심할 때 한 판</span>
            <span className="block truncate text-[16px] font-black tracking-tight text-[#102344] sm:text-[19px]">나만 아니면 돼 · 독박게임</span>
          </span>
        </span>
        <span className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full bg-brandblue px-3 py-1.5 text-[12px] font-black text-white transition group-hover:translate-x-0.5 sm:px-4 sm:text-[13px]">
          게임하러 가기
          <span aria-hidden>›</span>
        </span>
      </Link>
    </section>
  );
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  if (!src) return <div className="h-full w-full bg-gradient-to-br from-[#eef4fb] to-[#dfe9f5]" />;
  return <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" unoptimized />;
}

function seasonPlaceMatch(spot: TourSpot, key: string, label: string): boolean {
  const text = `${spot.title} ${spot.addr} ${spot.overview || ""}`;
  if (key === "autumn") return /가을|단풍|은행|억새|갈대|코스모스|수목원|정원|숲|둘레길|호수|산|오름/.test(text);
  return text.includes(label);
}

function seasonSeoText(label: string): string {
  if (label === "가을") {
    return "단풍길, 수목원, 호수 산책, 숲길처럼 가을 분위기가 좋은 여행지를 5곳만 골랐어요. 이번 주말 가을 나들이와 당일치기 여행 코스를 찾는 분들이 빠르게 고를 수 있게 지역과 사진 중심으로 정리했습니다.";
  }
  return `${label} 분위기에 맞는 나들이 장소를 사진과 지역 기준으로 골랐어요. 이번 주말 여행지와 당일치기 코스를 빠르게 비교해보세요.`;
}

function shuffleByDay<T>(arr: T[], today: string, salt = 0): T[] {
  let a = ((Number(today.replace(/-/g, "")) || 1) + salt * 2654435761) >>> 0;
  const rnd = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dailyPick<T>(arr: T[], today: string, salt: number): T | undefined {
  return shuffleByDay(arr, today, salt)[0];
}

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}
