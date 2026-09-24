import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getPrepArticles,prepStore,isPrepReview,prepCategoryLabel,cookingCategory,isCookingPrepArticle} from '@/lib/weekend-prep/data';
import {SITE} from '@/lib/site';
import PrepArticle from '@/components/PrepArticle';
import '../prep.css';
export const dynamicParams=true;
export function generateStaticParams(){return getPrepArticles().map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const a=getPrepArticles().find(a=>a.slug===slug);
  if(!a)return {robots:{index:false}};
  const url=`${SITE.url}/weekend-prep/${a.slug}`;
  const image={url:a.cover.url,width:a.cover.width,height:a.cover.height,alt:a.cover.alt};
  return {
    robots:{index:!isPrepReview,follow:true,'max-image-preview':'large'},
    title:a.title,description:a.description,alternates:{canonical:url},
    openGraph:{type:'article',url,siteName:SITE.name,locale:'ko_KR',title:a.title,description:a.description,publishedTime:a.publishAt,modifiedTime:a.updatedAt,images:[image]},
    twitter:{card:'summary_large_image',title:a.title,description:a.description,images:[image]},
  };
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const articles=getPrepArticles();
  const a=articles.find(a=>a.slug===slug);
  if(!a)notFound();
  const url=`${SITE.url}/weekend-prep/${a.slug}`;
  const json=[{
    '@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,
    image:new URL(a.cover.url,SITE.url).href,datePublished:a.publishAt,dateModified:a.updatedAt,
    inLanguage:'ko-KR',articleSection:prepCategoryLabel(a.category,a),
    author:{'@type':'Organization',name:SITE.name,url:SITE.url},
    publisher:{'@type':'Organization',name:SITE.name,url:SITE.url},mainEntityOfPage:{'@type':'WebPage','@id':url},
  },{
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:[{name:'홈',item:SITE.url},{name:'주말 준비물 체크리스트',item:`${SITE.url}/weekend-prep`},{name:a.title,item:url}].map((x,i)=>({'@type':'ListItem',position:i+1,...x})),
  }];
  const related=articles.filter(b=>b.slug!==a.slug&&prepCategoryLabel(b.category,b)===prepCategoryLabel(a.category,a))
    .sort((b,c)=>Number(isCookingPrepArticle(c)&&cookingCategory(c)===cookingCategory(a))-Number(isCookingPrepArticle(b)&&cookingCategory(b)===cookingCategory(a))).slice(0,3);
  return <main className="prep">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,'\\u003c')}}/>
    <PrepArticle article={a} products={prepStore.products} preview={isPrepReview} relatedArticles={articles.map(({slug,title})=>({slug,title}))}/>
    {related.length>0&&<nav className="prep-article prep-directory" aria-label="다른 준비물 체크리스트">
      <h2>함께 챙길 준비물 체크리스트</h2>
      <ul>{related.map(b=><li key={b.slug}><Link href={`/weekend-prep/${b.slug}`} prefetch={false}>{b.title}</Link></li>)}</ul>
      <p><Link href="/weekend-prep">전체 준비물 모아보기 →</Link></p>
    </nav>}
  </main>;
}
