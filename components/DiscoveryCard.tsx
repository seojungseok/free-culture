import Link from 'next/link';
import type {MouseEventHandler} from 'react';

// Shared with CourseCard: whole-card navigation, light outline and restrained shadow.
export const discoveryCardShell = 'group block min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardhover focus-visible:outline focus-visible:outline-2 focus-visible:outline-free';
export const discoveryGrid = 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4';
export default function DiscoveryCard({href,title,image,meta,distance,onClick}:{href:string;title:string;image:string;meta:string;distance?:string;onClick?:MouseEventHandler<HTMLAnchorElement>}) {
 return <Link href={href} prefetch={false} onClick={onClick} className={discoveryCardShell} aria-label={title}>
  <div className="relative aspect-[1200/630] w-full overflow-hidden bg-neutral-100">
   {/* eslint-disable-next-line @next/next/no-img-element */}
   {image?<img src={image} alt="" width={1200} height={630} loading="lazy" decoding="async" className="h-full w-full object-contain"/>:<span className="flex h-full items-center justify-center text-2xl" aria-hidden="true">📍</span>}
  </div>
  <div className="px-2.5 pb-2.5 pt-2 sm:px-3">
   <h2 className="line-clamp-2 h-10 break-keep text-[14px] font-extrabold leading-5 tracking-tight text-ink group-hover:text-free sm:text-[15px]" title={title}>{title}</h2>
   <p className="mt-1.5 truncate text-[11px] font-semibold leading-4 text-ink-soft" title={meta}>{meta}</p>
   {distance!==undefined&&<p className="mt-1 text-xs font-bold leading-4 text-free">{distance}</p>}
  </div>
 </Link>;
}
