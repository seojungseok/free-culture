import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "추석에 뭐하지?",
  description: "추석에 뭐하지? 새로운 콘텐츠를 준비하고 있습니다.",
  alternates: { canonical: "/chuseok" },
};

export default function ChuseokPage() {
  return <main className="min-h-[60vh]" aria-label="추석에 뭐하지" />;
}
