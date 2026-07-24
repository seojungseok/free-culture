// 애드센스 광고 자리. 승인 전까지는 비워둡니다.
// 승인 후 이 컴포넌트 안에 <ins class="adsbygoogle" .../> 스크립트를 넣으면 됩니다.
// 정책 준수: 콘텐츠 열람 조건으로 광고를 걸지 않습니다.

export default function AdSlot({ label = "광고" }: { label?: string }) {
  const show = process.env.NEXT_PUBLIC_SHOW_AD_SLOTS === "1";
  if (!show) return null;
  return (
    <div className="col-span-full my-2 flex h-[90px] items-center justify-center rounded-xl border border-dashed border-black/15 text-xs text-ink-faint">
      {label} 영역 (승인 후 노출)
    </div>
  );
}
