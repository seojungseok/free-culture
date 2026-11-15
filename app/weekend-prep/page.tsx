import { withSearchMetadata } from '@/lib/searchMetadata';
import type {Metadata} from 'next';
import {getPrepArticles,isPrepReview} from '@/lib/weekend-prep/data';
import {SITE} from '@/lib/site';
import PrepListing from './PrepListing';
import './prep.css';

// Query requests use /weekend-prep/filter; the main list stays cached HTML.
export const revalidate=86400;
export function generateMetadata():Metadata {
  return withSearchMetadata({
    title:'캠핑요리 재료와 레시피',
    description:'꽃게탕·해물라면·김치볶음밥·삼겹살 바비큐까지. 캠핑에서 만들 수 있는 요리의 재료·분량·조리 순서와 실패했을 때 고치는 방법을 확인하세요.',
    alternates:{canonical:SITE.url+'/weekend-prep'},
    robots:{index:!isPrepReview&&getPrepArticles().length>0,follow:true},
    openGraph:{type:'website',url:SITE.url+'/weekend-prep',title:'캠핑요리 재료와 레시피',description:'캠핑에서 해 먹을 요리의 재료 목록과 조리법을 한곳에서 확인하세요.',images:[getPrepArticles()[0]?.cover.url||SITE.ogImage]},
    twitter:{card:'summary_large_image',title:'캠핑요리 재료와 레시피',description:'캠핑에서 해 먹을 요리의 재료 목록과 조리법을 한곳에서 확인하세요.',images:[getPrepArticles()[0]?.cover.url||SITE.ogImage]},
  });
}
export default function Page(){
  const url=SITE.url+'/weekend-prep';
  const json={'@context':'https://schema.org','@type':'CollectionPage',name:'캠핑요리 재료와 레시피',url,inLanguage:'ko-KR',mainEntity:{'@type':'ItemList',itemListElement:getPrepArticles().map((a,i)=>({'@type':'ListItem',position:i+1,name:a.title,url:`${url}/${a.slug}`}))}};
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,'\\u003c')}}/>
    <PrepListing/>
  </>;
}
