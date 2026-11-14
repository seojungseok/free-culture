import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {allExperiences,getExperience,isExperienceKind,experienceHref,experienceDescription,indexableExperience,experienceSeoTitle} from '@/lib/experienceData';
import {SITE} from '@/lib/site';
import ExperienceDetail from '@/components/ExperienceDetail';
export const revalidate=3600;
type Props={params:Promise<{kind:string;id:string}>};
export function generateStaticParams(){return ['family','science','rural'].flatMap(kind=>allExperiences().filter(item=>item.kind===kind&&indexableExperience(item)).sort((a,b)=>Number(!!b.image)-Number(!!a.image)).slice(0,6).map(item=>({kind:item.kind,id:item.id})));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {kind,id}=await params,item=getExperience(kind,id);if(!item)return {title:'체험을 찾을 수 없습니다',robots:{index:false,follow:true}};const title=experienceSeoTitle(item),description=experienceDescription(item);return {title,description,alternates:{canonical:experienceHref(item)},robots:{index:indexableExperience(item),follow:true},openGraph:{title,description,url:experienceHref(item),type:'website',images:item.image?[{url:new URL(item.image.src,SITE.url).href,width:item.image.width,height:item.image.height,alt:item.imageAlt}]:undefined},twitter:{card:item.image?'summary_large_image':'summary',title,description,images:item.image?[new URL(item.image.src,SITE.url).href]:undefined}};}
export default async function ExperiencePage({params}:Props){const {kind,id}=await params;if(!isExperienceKind(kind))notFound();const item=getExperience(kind,id);if(!item)notFound();return <ExperienceDetail item={item}/>;}
