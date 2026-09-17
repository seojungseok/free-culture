import type {Metadata} from 'next';
import {getPrepArticles,isPrepReview} from '@/lib/weekend-prep/data';
import {SITE} from '@/lib/site';
import PrepListing from './PrepListing';
import PrepDirectory from './PrepDirectory';
import './prep.css';

// Query requests use /weekend-prep/filter; the main list stays cached HTML.
export const revalidate=86400;
export function generateMetadata():Metadata {
  return {
    title:'주말 준비물 체크리스트 | 요리·캠핑·나들이 준비',
    description:'꽃게탕·해물라면·홍합탕·김치볶음밥·삼겹살 바비큐 등 캠핑 요리 재료와 주말 준비물을 모았습니다. 메뉴별 장보기 목록과 챙길 도구를 출발 전에 체크하세요.',
    alternates:{canonical:SITE.url+'/weekend-prep'},
    robots:{index:!isPrepReview&&getPrepArticles().length>0,follow:true},
    openGraph:{type:'website',url:SITE.url+'/weekend-prep',title:'주말 준비물 체크리스트 | 캠핑 요리 재료 모음',description:'메뉴별 요리 재료와 주말 준비물을 한곳에서 확인하세요.',images:[getPrepArticles()[0]?.cover.url||SITE.ogImage]},
    twitter:{card:'summary_large_image',title:'주말 준비물 체크리스트 | 캠핑 요리 재료 모음',description:'메뉴별 요리 재료와 주말 준비물을 한곳에서 확인하세요.',images:[getPrepArticles()[0]?.cover.url||SITE.ogImage]},
  };
}
export default function Page(){
  const url=SITE.url+'/weekend-prep';
  const json={'@context':'https://schema.org','@type':'CollectionPage',name:'주말 준비물 체크리스트',url,inLanguage:'ko-KR',mainEntity:{'@type':'ItemList',itemListElement:getPrepArticles().map((a,i)=>({'@type':'ListItem',position:i+1,name:a.title,url:`${url}/${a.slug}`}))}};
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,'\\u003c')}}/>
    <PrepListing directory={<PrepDirectory/>}/>
  </>;
}
