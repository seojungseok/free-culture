import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import catalogue from '@/data/seasonal-shopping.json';
import SeasonalShopping from '@/components/SeasonalShopping';
import {SITE} from '@/lib/site';
import {readTossFeed} from '@/lib/sharelink';
import styles from './page.module.css';

// Prices/availability are rendered from the local verified feed, never a
// merchant request. A cached empty client shell caused the visible loading gap.
export const dynamic='force-dynamic';
export function generateStaticParams(){return catalogue.collections.map(c=>({collection:c.slug}));}
type Props={params:Promise<{collection:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {collection:slug}=await params,c=catalogue.collections.find(c=>c.slug===slug);
 if(!c)return {};
 return {title:c.title,description:c.description,alternates:{canonical:SITE.url+'/shopping/'+c.slug},openGraph:{title:c.title,description:c.description,images:catalogue.campaigns.filter(campaign=>campaign.key===c.banner).map(campaign=>({url:campaign.art}))}};
}
export default async function ShoppingCollectionPage({params}:Props){
 const {collection:slug}=await params,c=catalogue.collections.find(c=>c.slug===slug);
 if(!c)notFound();
 const cachedFeed=readTossFeed();
 const initialFeed={...cachedFeed,products:cachedFeed.products.filter(p=>c.productIds.includes(p.id))};
 const structured={'@context':'https://schema.org','@graph':[{'@type':'CollectionPage',name:c.title,description:c.description,url:SITE.url+'/shopping/'+c.slug},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:SITE.url},{'@type':'ListItem',position:2,name:c.title,item:SITE.url+'/shopping/'+c.slug}]}]};
 return <main className={styles.page}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span aria-hidden="true">/</span><span>{c.title}</span></nav>
  <nav className={styles.categories} aria-label="겨울 쇼핑 모음">{catalogue.collections.map(item=><Link key={item.slug} href={'/shopping/'+item.slug} aria-current={item.slug===c.slug?'page':undefined} prefetch={false}>{item.title}</Link>)}</nav>
  <header className={styles.header}><h1>{c.title}</h1><p>{c.description}</p></header>
  <p className={styles.disclosure}>[광고] 토스쇼핑 제휴 링크로 구매 시 수수료를 지급받습니다. 최종 가격·할인율·배송비·구성은 구매 화면에서 확인하세요.</p>
  <SeasonalShopping collection={c} initialFeed={initialFeed} initialTime={Date.now()}/>
 </main>;
}
