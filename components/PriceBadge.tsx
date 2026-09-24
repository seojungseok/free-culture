import type { PriceType } from "@/lib/types";

const STYLE: Record<PriceType, string> = {
  free: "bg-free text-white",
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
  return (
    <span
      className={[
        "inline-flex items-center gap-0.5 rounded-full font-bold shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        STYLE[type] ?? STYLE.unknown,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
