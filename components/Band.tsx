import type { ReactNode } from "react";

const TONE: Record<string, string> = {
  white: "bg-white",
  panel: "bg-panel",
  tint: "bg-tint",
};

/** 화면 전체 폭 배경 띠 + 내부 콘텐츠는 컨테이너로 중앙 정렬 */
export function Band({
  tone = "white",
  border = true,
  className = "",
  innerClassName = "",
  children,
}: {
  tone?: "white" | "panel" | "tint";
  border?: boolean;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={[
        TONE[tone],
        border ? "border-b border-line" : "",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8",
          innerClassName,
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

/** 콘텐츠 중앙 정렬 컨테이너 (띠 배경 없이) */
export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
