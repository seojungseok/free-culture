import Image from 'next/image';
import Link from 'next/link';

export default function SeasonPlaceCard({href,title,image,imageAlt,meta,description,badge,trailingBadge,twoLineTitle=false}:{href:string;title:string;image?:string;imageAlt?:string;meta:string;description?:string;badge:string;trailingBadge?:string;twoLineTitle?:boolean}){
 return <Link href={href} prefetch={false} className="group block min-w-0" aria-label={`${title} 상세 보기`} data-discovery-card>
  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-cardhover">
   {image?<Image src={image} alt={imageAlt||title} fill sizes="(max-width:639px) 50vw, (max-width:767px) 33vw, (max-width:1023px) 25vw, 200px" className="object-cover transition group-hover:scale-105" loading="lazy"/>:<div className="flex h-full items-center justify-center text-ink-faint" aria-hidden="true">🏞️</div>}
   <div className="absolute left-1.5 top-1.5"><span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{badge}</span></div>
   {trailingBadge&&<div className="absolute right-1.5 top-1.5"><span className="rounded-md bg-free px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">{trailingBadge}</span></div>}
  </div>
  <div className="px-0.5 pb-1 pt-2"><h3 className={`${twoLineTitle?'line-clamp-2 min-h-[42px]':'line-clamp-1'} text-[14px] font-bold text-ink group-hover:text-free`} title={title}>{title}</h3><p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{meta}</p>{description&&<p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-ink-soft">{description}</p>}</div>
 </Link>;
}
