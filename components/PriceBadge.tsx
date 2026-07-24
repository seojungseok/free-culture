import type { PriceType } from "@/lib/types";

const STYLE: Record<PriceType, string> = {
  free: "bg-free text-white",
  // 무료 추정: 옅은 초록 + 점선 테두리 (확정이 아님을 시각적으로)
  free_estimated: "bg-free/10 text-free border border-dashed border-free/70",
  partial_free: "bg-paid text-white",
  cheap: "bg-blue-600 text-white",
  paid: "bg-white/95 text-ink ring-1 ring-black/15",
  unknown: "bg-white/85 text-ink-faint ring-1 ring-black/10",
};

export default function PriceBadge({
  type,
  label,
  size = "md",
}: {
  type: PriceType;
  label: string;
  size?: "sm" | "md";
}) {
  const isEst = type === "free_estimated";
  return (
    <span
      title={isEst ? "요금 정보가 없어 무료로 추정한 행사입니다" : undefined}
      className={[
        "inline-flex items-center gap-0.5 rounded-full font-bold shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        STYLE[type] ?? STYLE.unknown,
      ].join(" ")}
    >
      {label}
      {isEst && <span aria-hidden className="opacity-70">?</span>}
    </span>
  );
}
