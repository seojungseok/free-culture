import { withSearchMetadata } from '@/lib/searchMetadata';
import type {Metadata} from 'next';
import {getPrepArticles,isPrepReview} from '@/lib/weekend-prep/data';
import {SITE} from '@/lib/site';
import PrepListing from './PrepListing';
import {prepCollectionTitle,prepCollectionDescription} from '@/lib/weekend-prep/search';
import './prep.css';

// Query requests use /weekend-prep/filter; the main list stays cached HTML.
export const revalidate=86400;
export function generateMetadata():Metadata {
  return withSearchMetadata({
    title:prepCollectionTitle,
    description:prepCollectionDescription,
    keywords:null,
    alternates:{canonical:SITE.url+'/weekend-prep'},
    robots:{index:!isPrepReview&&getPrepArticles().length>0,follow:true},
    openGraph:{type:'website',url:SITE.url+'/weekend-prep',title:prepCollectionTitle,description:prepCollectionDescription,images:[getPrepArticles()[0]?.cover.url||SITE.ogImage]},
    twitter:{card:'summary_large_image',title:prepCollectionTitle,description:prepCollectionDescription,images:[getPrepArticles()[0]?.cover.url||SITE.ogImage]},
  });
}
export default function Page(){
  const url=SITE.url+'/weekend-prep';
  const json={'@context':'https://schema.org','@type':'CollectionPage',name:prepCollectionTitle,description:prepCollectionDescription,url,inLanguage:'ko-KR',mainEntity:{'@type':'ItemList',itemListElement:getPrepArticles().map((a,i)=>({'@type':'ListItem',position:i+1,name:a.title,url:`${url}/${a.slug}`}))}};
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,'\\u003c')}}/>
    <PrepListing/>
  </>;
}
