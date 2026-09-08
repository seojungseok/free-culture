import Image from 'next/image';
import Link from 'next/link';
import type {RegionFilterItem} from './RegionContentFilter';
export default function RegionHubCards({items}:{items:RegionFilterItem[]}){
 return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{items.map(item=><Link key={item.href} href={item.href} prefetch={false} className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white transition hover:border-brandblue/40">
 <div className="relative aspect-[4/3] bg-slate-100">{item.image&&<Image src={item.image} alt={item.title} fill sizes="(max-width:640px) 45vw, 260px" loading="lazy" unoptimized className="object-cover"/>}<span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold">{item.badge}</span></div>
 <div className="p-3"><h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5">{item.title}</h3><p className="mt-2 line-clamp-1 text-xs text-ink-soft">{item.meta}</p></div></Link>)}</div>;
}
