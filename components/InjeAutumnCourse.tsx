import Link from "next/link";

const stops = [
  {
    step: "01",
    title: "인제가을꽃축제",
    text: "가을꽃과 지역 행사를 먼저 확인하고 여행 날짜를 정해보세요.",
    href: "/search?q=%EC%9D%B8%EC%A0%9C%EA%B0%80%EC%9D%84%EA%BD%83%EC%B6%95%EC%A0%9C",
    label: "행사 확인",
  },
  {
    step: "02",
    title: "원대리 자작나무 숲",
    text: "하얀 자작나무 사이 숲길을 걸으며 인제의 가을 풍경을 만나는 대표 명소입니다.",
    href: "/search?q=%EC%9B%90%EB%8C%80%EB%A6%AC%20%EC%9E%90%EC%9E%91%EB%82%98%EB%AC%B4%20%EC%88%B2",
    label: "장소 보기",
  },
  {
    step: "03",
    title: "백담사·내설악",
    text: "계곡과 산세가 어우러지는 내설악의 고즈넉한 가을 코스로 이어보세요.",
    href: "/search?q=%EB%B0%B1%EB%8B%B4%EC%82%AC",
    label: "장소 보기",
  },
];

export default function InjeAutumnCourse() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-5 pt-6 sm:px-6 sm:pt-8 lg:px-8" aria-labelledby="inje-autumn-course">
      <div className="overflow-hidden rounded-2xl border border-[#dbe6f2] bg-[#f7fbff]">
        <div className="flex flex-col gap-2 border-b border-[#dbe6f2] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[12px] font-extrabold tracking-[0.08em] text-free">AUTUMN PICK · INJE</p>
            <h2 id="inje-autumn-course" className="mt-1 text-[20px] font-black tracking-tight text-ink sm:text-[24px]">인제 가을여행 + 축제 코스</h2>
            <p className="mt-1 text-[13px] text-ink-soft">행사 확인부터 숲길 산책까지, 가을 주말에 이어가기 좋은 추천 동선입니다.</p>
          </div>
          <Link href="/season?area=%EA%B0%95%EC%9B%90" className="text-[13px] font-bold text-free hover:text-freedark">가을나들이 전체 보기 →</Link>
        </div>
        <div className="grid divide-y divide-[#dbe6f2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stops.map((stop) => (
            <Link key={stop.step} href={stop.href} className="group flex gap-3 px-5 py-4 transition hover:bg-white sm:block sm:px-6 sm:py-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dcecff] text-[11px] font-black text-free sm:h-9 sm:w-9">{stop.step}</span>
              <div className="min-w-0 sm:mt-4">
                <h3 className="text-[15px] font-extrabold text-ink group-hover:text-free">{stop.title}</h3>
                <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">{stop.text}</p>
                <span className="mt-2 inline-block text-[12px] font-bold text-free">{stop.label} →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
