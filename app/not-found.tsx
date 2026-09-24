import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="text-5xl">🎭</div>
      <h1 className="mt-4 text-2xl font-extrabold text-ink">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-2 text-ink-soft">
        찾으시는 행사가 종료되었거나 주소가 바뀌었을 수 있어요.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
      >
        홈으로 가기
      </Link>
      <nav className="mt-5 flex flex-wrap justify-center gap-4 text-sm font-bold text-brandblue" aria-label="다른 나들이 찾기"><Link href="/weekend">이번 주말 행사</Link><Link href="/places">지역별 나들이</Link><Link href="/kids">아이와 가볼 곳</Link></nav>
    </div>
  );
}
