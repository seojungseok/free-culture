import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getByGenre, slimForClient } from "@/lib/data";
import { GENRES, genreLabelOf } from "@/lib/classify";
import DateBrowser from "@/components/DateBrowser";
import { Band } from "@/components/Band";

export function generateStaticParams() {
  return GENRES.map((g) => ({ code: g.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const label = genreLabelOf(code);
  const n = getByGenre(code).length;
  return {
    title: `${label} — 전국 무료·저렴 ${label} 정보`,
    description: `전국 ${label} 행사 ${n}건을 날짜별로. 무료 행사를 먼저 확인하세요.`,
    alternates: { canonical: `/genre/${code}` },
  };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const valid = GENRES.some((g) => g.key === code);
  if (!valid) notFound();
  const label = genreLabelOf(code);
  const events = slimForClient(getByGenre(code));

  return (
    <>
      <Band tone="tint" innerClassName="py-6">
        <h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">
          전국 <span className="text-free">{label}</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          지금 열리는 {label} 행사 {events.length.toLocaleString()}건 — 날짜로 골라보세요
        </p>
      </Band>
      <Suspense fallback={null}>
        <DateBrowser events={events} />
      </Suspense>
    </>
  );
}
