import Image from "next/image";
import Link from "next/link";
import type { SearchDoc } from "@/lib/search";

const KIND_EMOJI: Record<string, string> = { place: "🏞️", event: "🎭", festival: "🎪", food: "🍽️" };

export default function SearchCard({ doc }: { doc: SearchDoc }) {
  return (
    <Link href={doc.url} className="group block" aria-label={`${doc.title} 상세 보기`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-cardhover">
        {doc.image ? (
          <Image src={doc.image} alt={doc.title} fill sizes="(max-width:640px) 50vw, 220px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-ink-faint">{KIND_EMOJI[doc.kind]}</div>
        )}
        <div className="absolute left-1.5 top-1.5">
          <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {KIND_EMOJI[doc.kind]} {{ place: "나들이", event: "문화행사", festival: "축제", food: "맛집" }[doc.kind]}
          </span>
        </div>
        {doc.price === "free" && (
          <div className="absolute right-1.5 top-1.5">
            <span className="rounded-md bg-free px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">무료</span>
          </div>
        )}
      </div>
      <div className="px-0.5 pb-1 pt-2">
        <h3 className="line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{doc.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{[doc.area, doc.sub].filter(Boolean).join(" · ")}</p>
      </div>
    </Link>
  );
}
