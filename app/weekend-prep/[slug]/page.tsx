import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getPrepArticles,prepStore,isPrepReview} from '@/lib/weekend-prep/data';
import {SITE} from '@/lib/site';
import PrepArticle from '@/components/PrepArticle';
import '../prep.css';
export const dynamicParams=true;
export function generateStaticParams(){return getPrepArticles().map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const a=getPrepArticles().find(a=>a.slug===slug);if(!a)return {robots:{index:false}};return {robots:{index:!isPrepReview,follow:true},title:a.title,description:a.description,alternates:{canonical:`${SITE.url}/weekend-prep/${a.slug}`},openGraph:{type:'article',title:a.title,description:a.description,images:[a.cover.url]}};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=getPrepArticles().find(a=>a.slug===slug);if(!a)notFound();const url=`${SITE.url}/weekend-prep/${a.slug}`;const json=[{'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,image:`${SITE.url}${a.cover.url}`,datePublished:a.publishAt,dateModified:a.updatedAt,author:{'@type':'Organization',name:SITE.name},mainEntityOfPage:url},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{name:'홈',item:SITE.url},{name:'주말 준비 가이드',item:`${SITE.url}/weekend-prep`},{name:a.title,item:url}].map((x,i)=>({'@type':'ListItem',position:i+1,...x}))}];return <main className="prep"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,'\\u003c')}}/><PrepArticle article={a} products={prepStore.products} preview={isPrepReview}/></main>;}
