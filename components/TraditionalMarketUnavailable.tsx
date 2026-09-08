import Link from "next/link";

// Preserve legacy URLs without exposing content or calling the market API.
export default function TraditionalMarketUnavailable() {
  return <section className="mx-auto max-w-3xl px-5 py-16">
    <h1 className="text-2xl font-black">현재 공개하지 않는 페이지입니다</h1>
    <p className="mt-3 text-sm text-ink-soft">다른 나들이 장소와 이번 주말 갈 곳을 찾아보세요.</p>
    <Link href="/" className="mt-6 inline-block rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white">메인으로 돌아가기</Link>
  </section>;
}
