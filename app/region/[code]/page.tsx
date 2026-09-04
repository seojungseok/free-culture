import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllEvents, getByRegion, slimForClient } from "@/lib/data";
import { getKidTours, getPlaces } from "@/lib/tour";
import { filterCamps } from "@/lib/camping";
import { filterCourses, slimCourse } from "@/lib/courses";
import { GENRES, SIDO_SLUG, sidoFromSlug } from "@/lib/classify";
import DateBrowser from "@/components/DateBrowser";
import RegionContentFilter, { type RegionFilterCategory, type RegionFilterItem } from "@/components/RegionContentFilter";
import { Band } from "@/components/Band";
import { todayYmd, weekendRangeYmd } from "@/lib/dates";
import { fmtRange } from "@/lib/format";

const isFree = (t: string) => t === "free" || t === "free_estimated";
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

const REGION_CONTEXT: Record<string, { scene: string; pace: string; travel: string }> = {
  서울: { scene: "도심 전시관과 공연장, 한강 공원, 박물관이 촘촘해 짧은 이동으로 여러 코스를 묶기 좋습니다", pace: "대중교통으로 움직이기 쉬워 반나절 나들이부터 저녁 공연까지 계획하기 편합니다", travel: "실내 문화시설과 야외 산책지를 함께 비교해 날씨에 맞는 일정을 고를 수 있습니다" },
  부산: { scene: "바다와 시장, 공연장, 문화마을이 가까워 해변 산책과 전시 관람을 함께 즐기기 좋습니다", pace: "가족 나들이와 데이트 코스가 모두 풍부해 하루 일정으로도 만족도가 높습니다", travel: "해운대와 원도심, 기장권까지 지역별 분위기를 나눠 살펴볼 수 있습니다" },
  대구: { scene: "도심 공원과 전시 공간, 근대 골목, 공연장이 가까이 모여 있어 가볍게 둘러보기 좋습니다", pace: "아이와 갈 만한 실내 시설과 계절 축제를 함께 확인하면 이동 부담을 줄일 수 있습니다", travel: "중심가 문화행사와 외곽 나들이 장소를 한 번에 비교할 수 있습니다" },
  인천: { scene: "바다, 섬, 차이나타운, 공원과 문화공간이 어우러져 주말 선택지가 넓습니다", pace: "서울 근교 당일 나들이부터 아이와 함께 가기 좋은 체험 시설까지 고르기 쉽습니다", travel: "실내 행사와 해안 산책 코스를 함께 살펴 날씨와 이동거리에 맞춰 정할 수 있습니다" },
  광주: { scene: "예술 전시와 공연, 역사 공간, 가족 체험지가 가까워 문화 나들이에 잘 어울립니다", pace: "도심 안에서 반나절 코스를 만들기 좋고 근교 자연 명소와도 연결하기 쉽습니다", travel: "무료 행사와 아이 동반 장소를 함께 비교해 부담 없는 일정을 찾을 수 있습니다" },
  대전: { scene: "과학관과 공원, 전시 공간, 공연장이 고르게 있어 아이와 배우며 쉬기 좋습니다", pace: "도심 이동이 비교적 단순해 짧은 주말 일정에도 여러 장소를 묶기 편합니다", travel: "실내 체험과 야외 산책지를 함께 확인해 계절과 날씨에 맞춰 고를 수 있습니다" },
  울산: { scene: "바다와 강변, 산업문화 공간, 공원이 어우러져 가족 나들이 선택지가 다양합니다", pace: "자연 풍경을 즐기는 일정과 전시·공연 관람을 하루 안에 함께 넣기 좋습니다", travel: "동구 해안권과 도심 문화시설을 나눠 살펴볼 수 있습니다" },
  세종: { scene: "호수공원과 수목원, 공공문화시설이 가까워 아이와 산책하듯 둘러보기 좋습니다", pace: "도시 규모가 부담스럽지 않아 반나절 나들이와 주말 체험 일정을 짜기 쉽습니다", travel: "실내 시설과 공원형 장소를 함께 비교해 편한 동선을 고를 수 있습니다" },
  경기: { scene: "서울 근교 전시관, 대형 공원, 체험시설, 캠핑장이 넓게 퍼져 선택지가 많습니다", pace: "가족 나들이와 당일치기 코스를 지역별로 나눠 보면 이동 시간을 줄이기 좋습니다", travel: "북부와 남부, 서해안권까지 분위기가 달라 목적에 맞는 장소를 고를 수 있습니다" },
  강원: { scene: "산과 바다, 계곡, 미술관과 축제가 어우러져 자연 중심 주말 여행에 잘 맞습니다", pace: "캠핑과 드라이브, 아이와 체험할 장소를 함께 보면 1박 일정도 잡기 쉽습니다", travel: "동해안과 내륙권을 나눠 날씨와 이동거리에 맞는 코스를 살펴볼 수 있습니다" },
  충북: { scene: "호수와 산, 체험마을, 문화시설이 어우러져 조용한 가족 나들이에 좋습니다", pace: "당일치기와 캠핑을 함께 고려하기 좋아 부담 없는 주말 계획을 세우기 쉽습니다", travel: "청주 도심권과 제천·단양권의 자연 여행지를 나눠 확인할 수 있습니다" },
  충남: { scene: "서해 바다와 역사 유적, 온천, 축제가 어우러져 계절별 나들이가 풍부합니다", pace: "아이와 체험하기 좋은 장소와 캠핑장을 함께 보면 하루 또는 1박 일정으로 연결하기 쉽습니다", travel: "천안·아산 도심권과 서해안 여행지를 함께 비교할 수 있습니다" },
  전북: { scene: "한옥마을, 산과 강, 지역 축제와 전시가 어우러져 느긋한 여행에 어울립니다", pace: "아이와 갈 만한 체험지와 무료 행사를 함께 보면 비용 부담을 줄이기 좋습니다", travel: "전주 도심권과 무주·남원 등 자연권 일정을 나눠 살펴볼 수 있습니다" },
  전남: { scene: "섬과 바다, 정원, 역사 공간, 지역 축제가 많아 풍경 중심 여행에 잘 맞습니다", pace: "캠핑과 드라이브 코스를 함께 고려하면 주말 1박 일정도 자연스럽게 잡힙니다", travel: "동부권과 서남해권의 분위기를 나눠 취향에 맞는 장소를 찾을 수 있습니다" },
  경북: { scene: "문화유산과 산, 바다, 전통 마을이 넓게 퍼져 주말 여행 선택지가 다양합니다", pace: "가족 체험과 역사 나들이, 캠핑을 함께 보면 일정의 밀도를 조절하기 좋습니다", travel: "경주·안동 같은 역사권과 동해안 자연권을 함께 비교할 수 있습니다" },
  경남: { scene: "남해 바다와 산, 공원, 축제가 어우러져 계절 나들이에 잘 어울립니다", pace: "아이와 갈 만한 체험지와 캠핑장을 함께 보면 가족 여행 계획이 쉬워집니다", travel: "창원·김해 도심권과 남해안 여행지를 나눠 살펴볼 수 있습니다" },
  제주: { scene: "바다와 오름, 숲길, 박물관과 체험시설이 가까워 날씨에 따라 코스를 바꾸기 좋습니다", pace: "아이와 가기 좋은 실내 장소와 야외 명소를 함께 확인하면 여행 중 일정 조정이 편합니다", travel: "동서남북 권역별 분위기가 달라 숙소 위치와 이동거리 기준으로 고르기 좋습니다" },
};

function regionIntro(sido: string): string {
  const name = displaySido(sido);
  const ctx = REGION_CONTEXT[sido] || REGION_CONTEXT.서울;
  return `${name}에서 이번 주말 갈 곳을 찾고 있다면 무료 전시와 공연, 아이와 함께 가기 좋은 박물관·공원·체험시설, 캠핑장과 여행코스까지 한 번에 확인해 보세요. ${ctx.scene}. ${ctx.pace}. 비용, 날씨, 이동거리, 아이 동반 여부를 함께 고려해 ${name}의 문화행사와 나들이 장소를 자연스럽게 비교할 수 있습니다. ${ctx.travel}.`;
}

export function generateStaticParams() {
  return Object.values(SIDO_SLUG).map((code) => ({ code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const sido = sidoFromSlug(code);
  if (!sido) return { title: "지역을 찾을 수 없습니다" };
  const name = displaySido(sido);
  return {
    title: {
      absolute: `${name} 무료 문화행사·가볼만한곳·아이와 나들이 | 주말에뭐하지`,
    },
    description: `${name}에서 지금 열리는 전시·공연·문화행사와 이번 주말 갈만한 곳을 한눈에 확인하세요. 무료 행사, 아이와 가볼만한곳, 나들이, 캠핑 등 ${name}의 다양한 장소와 행사를 소개합니다.`,
    keywords: [`${name} 문화행사`, `${name} 무료 전시`, `${name} 무료 공연`, `${name} 나들이`, `${name} 가볼만한곳`, `${name} 주말 나들이`, `${name} 캠핑장`],
    alternates: { canonical: `/region/${code}` },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sido = sidoFromSlug(code);
  if (!sido) notFound();
  const name = displaySido(sido);
  const all = getAllEvents();
  const today = todayYmd();
  const weekend = weekendRangeYmd(today);
  const regionEvents = getByRegion(sido);
  const regionCount = regionEvents.length;
  const events = slimForClient(all);

  // 이 지역에서 무료 행사 있는 분야 (조합 페이지 링크)
  const freeGenres = GENRES.filter(
    (g) => g.key !== "etc" && all.some((e) => e.area === sido && e.genreKey === g.key && isFree(e.priceType))
  );
  const tours = getKidTours(sido, 12);
  const places = getPlaces({ area: sido, limit: 12 });
  const camps = filterCamps({ area: sido }).filter((c) => c.image).slice(0, 12);
  const courses = filterCourses({ area: sido, limit: 12 }).map(slimCourse);
  const eventCards = regionEvents
    .filter((e) => e.imgUrl && e.startDate <= weekend.end && e.endDate >= weekend.start)
    .sort((a, b) => b.featuredScore - a.featuredScore || a.endDate.localeCompare(b.endDate))
    .slice(0, 12);
  const campAreaSlug = (SIDO_SLUG as Record<string, string>)[sido];
  const internalLinks = [
    { href: "/traditional-market", label: name + " 전통시장 찾아보기" },
    { href: `/places/${code}`, label: `${name} 나들이 더보기` },
    { href: `/region/${code}`, label: `${name} 무료 행사 더보기` },
    { href: `/camping/region/${campAreaSlug}`, label: `${name} 캠핑장 더보기` },
    { href: `/places/${code}`, label: `${name} 아이와 가볼만한곳 더보기` },
    ...(courses.length ? [{ href: `/course/${code}`, label: `${name} 여행코스 더보기` }] : []),
  ];
  const filterCategories: RegionFilterCategory[] = [
    {
      key: "events",
      label: "문화행사",
      desc: `${name}에서 이번 주말 보기 좋은 전시·공연·축제만 모았습니다.`,
      moreHref: `/region/${code}`,
      moreLabel: `${name} 문화행사 전체보기`,
      items: eventCards.map(regionEventToItem),
    },
    {
      key: "kids",
      label: "아이와 가볼만한곳",
      desc: `박물관·과학관·체험 등 ${name}에서 아이와 가기 좋은 장소입니다.`,
      moreHref: `/places/${code}`,
      moreLabel: `${name} 아이와 장소 전체보기`,
      items: tours.map(regionTourToItem),
    },
    {
      key: "places",
      label: "나들이",
      desc: `${name}에서 가볍게 다녀오기 좋은 관광지와 문화시설입니다.`,
      moreHref: `/places/${code}`,
      moreLabel: `${name} 나들이 전체보기`,
      items: places.map(regionTourToItem),
    },
    {
      key: "camping",
      label: "캠핑장",
      desc: `${name}의 글램핑·오토캠핑·카라반 등 대표 캠핑장입니다.`,
      moreHref: `/camping/region/${campAreaSlug}`,
      moreLabel: `${name} 캠핑장 전체보기`,
      items: camps.map(regionCampToItem),
    },
    {
      key: "course",
      label: "여행코스",
      desc: `${name}에서 당일치기와 1박2일로 묶어 보기 좋은 코스입니다.`,
      moreHref: `/course/${code}`,
      moreLabel: `${name} 여행코스 전체보기`,
      items: courses.map(regionCourseToItem),
    },
  ];

  return (
    <>
      <Band tone="tint" innerClassName="py-6">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          <span className="text-free">{name}</span> 문화행사·가볼만한곳·주말 나들이
        </h1>
        <p className="mt-2 max-w-4xl text-[13.5px] leading-7 text-ink-soft sm:text-[14px]">
          {regionIntro(sido)}
        </p>
        <p className="mt-2 text-[13px] text-ink-faint">
          {name} 문화행사 {regionCount.toLocaleString()}건 — 지역·분야·가격·날짜로 골라보세요
        </p>
        <Link
          href="#region-content-filter"
          className="mt-4 inline-flex rounded-full bg-brandblue px-4 py-2 text-[13px] font-black text-white shadow-sm transition hover:bg-freedark"
        >
          종류별로 골라보기
        </Link>
        {(freeGenres.length > 0 || internalLinks.length > 0) && (
          <details className="mt-3 max-w-3xl rounded-2xl border border-line bg-white/70 px-4 py-2 text-[12.5px] text-ink-soft">
            <summary className="cursor-pointer font-bold text-ink-soft">세부 페이지 바로가기</summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {freeGenres.map((g) => (
                <Link
                  key={g.key}
                  href={`/region/${code}/${g.key}`}
                  className="rounded-full border border-free/30 bg-white px-3 py-1 font-bold text-free transition hover:bg-free hover:text-white"
                >
                  {name} 무료 {g.label}
                </Link>
              ))}
              {internalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  prefetch={false}
                  className="rounded-full border border-line bg-white px-3 py-1 font-bold text-ink-soft transition hover:border-free/40 hover:text-free"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        )}
      </Band>
      <RegionContentFilter areaName={name} categories={filterCategories} />

      <Suspense fallback={null}>
        <DateBrowser events={events} initial={{ region: sido }} previewHref={`/events?region=${code}`} />
      </Suspense>
    </>
  );
}

function regionEventToItem(ev: { id: string; title: string; area: string; place?: string; imgUrl?: string; realmName?: string; startDate: string; endDate: string }): RegionFilterItem {
  return {
    id: `event-${ev.id}`,
    href: `/event/${ev.id}`,
    title: ev.title,
    meta: [ev.place || ev.area, fmtRange(ev.startDate, ev.endDate)].filter(Boolean).join(" · "),
    image: ev.imgUrl || "",
    badge: ev.realmName || "문화행사",
  };
}

function regionTourToItem(spot: { id: string; title: string; area: string; addr: string; image: string; isKid?: boolean }): RegionFilterItem {
  return {
    id: `place-${spot.id}`,
    href: `/places/spot/${spot.id}`,
    title: spot.title,
    meta: spot.addr || spot.area,
    image: spot.image,
    badge: spot.isKid ? "아이와" : "나들이",
  };
}

function regionCampToItem(camp: { id: string; name: string; area: string; sigungu?: string; image: string }): RegionFilterItem {
  return {
    id: `camp-${camp.id}`,
    href: `/camping/${camp.id}`,
    title: camp.name,
    meta: [camp.area, camp.sigungu].filter(Boolean).join(" · "),
    image: camp.image,
    badge: "캠핑",
  };
}

function regionCourseToItem(course: { id: string; title: string; area: string; image: string; duration: string }): RegionFilterItem {
  return {
    id: `course-${course.id}`,
    href: `/course/c/${course.id}`,
    title: course.title,
    meta: [course.area, course.duration].filter(Boolean).join(" · "),
    image: course.image,
    badge: "여행코스",
  };
}
