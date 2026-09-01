"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface RegionFilterItem {
  id: string;
  href: string;
  title: string;
  meta: string;
  image: string;
  badge: string;
}

export interface RegionFilterCategory {
  key: string;
  label: string;
  desc: string;
  moreHref: string;
  moreLabel: string;
  items: RegionFilterItem[];
}

export default function RegionContentFilter({ areaName, categories }: { areaName: string; categories: RegionFilterCategory[] }) {
  const available = useMemo(() => categories.filter((c) => c.items.length), [categories]);
  const [active, setActive] = useState(available[0]?.key || "");
  const current = available.find((c) => c.key === active) || available[0];

  if (!current) return null;

  return (
    <section id="region-content-filter" className="border-t border-line bg-white">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="rounded-3xl border border-[#dde5f0] bg-[#f8fbff] p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-brandblue">지역별 필터</p>
              <h2 className="mt-1 text-[22px] font-black tracking-tight text-ink">{areaName}에서 뭐할까요?</h2>
              <p className="mt-1 text-[13px] font-semibold text-ink-faint">아래 버튼을 누르면 선택한 종류만 보여요.</p>
            </div>
            <Link href={current.moreHref} prefetch={false} className="text-[13px] font-black text-brandblue">
              {current.moreLabel} ›
            </Link>
          </div>

          <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-2 sm:flex-wrap">
              {available.map((cat) => {
                const isActive = cat.key === current.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActive(cat.key)}
                    className={[
                      "rounded-full border px-4 py-2 text-[13px] font-black shadow-sm transition",
                      isActive
                        ? "border-brandblue bg-brandblue text-white"
                        : "border-[#dfe4ee] bg-white text-[#102344] hover:border-brandblue/40 hover:text-brandblue",
                    ].join(" ")}
                    aria-pressed={isActive}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-black text-ink">{current.label}</h3>
            <p className="mt-1 text-[13px] text-ink-faint">{current.desc}</p>
          </div>
          <span className="shrink-0 rounded-full bg-tint px-3 py-1 text-[12px] font-black text-brandblue">
            {current.items.length}개
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {current.items.slice(0, 12).map((item) => (
            <Link key={item.id} href={item.href} prefetch={false} className="group block overflow-hidden rounded-2xl border border-[#e3e7ee] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-cardhover">
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill sizes="(max-width:640px) 50vw, 220px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#eef4fb] to-[#dfe9f5]" />
                )}
                <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{item.badge}</span>
              </div>
              <div className="p-2.5">
                <h4 className="line-clamp-2 min-h-[38px] text-[13.5px] font-black leading-snug text-ink group-hover:text-brandblue">{item.title}</h4>
                <p className="mt-1 line-clamp-1 text-[12px] text-ink-faint">{item.meta}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
