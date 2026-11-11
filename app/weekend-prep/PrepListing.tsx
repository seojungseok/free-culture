import Link from 'next/link';
import type {ImageProps} from 'next/image';
import NextImage from '@/components/PrepStaticImage';
import {COOKING_CATEGORIES,cookingCategory,getPrepArticles,isCookingPrepArticle,isPrepReview,prepCategoryLabel} from '@/lib/weekend-prep/data';
import {PREP_CATEGORIES} from '@/lib/weekend-prep/types';
import TossTopDeals from '@/components/TossTopDeals';

function Image(props:ImageProps){return props.src?<NextImage {...props}/>:<div className="prep-no-image">이미지 검토 대기 · 비공개 초안</div>;}

export type PrepListParams={q?:string;category?:string;cooking?:string;page?:string};

export default function PrepListing({params:p={},directory}:{params?:PrepListParams;directory?:React.ReactNode}){
  const all=getPrepArticles();
  const q=String(p.q||'').slice(0,100);
  const category=String(p.category||'');
  const cooking=COOKING_CATEGORIES.includes(p.cooking as never)?p.cooking as typeof COOKING_CATEGORIES[number]:'';
  const list=all.filter(a=>(!category||prepCategoryLabel(a.category,a)===category)&&(!cooking||isCookingPrepArticle(a)&&cookingCategory(a)===cooking)&&`${a.title} ${a.description}`.includes(q));
  const pages=Math.max(1,Math.ceil(list.length/9));
  const page=Math.min(pages,Math.max(1,parseInt(p.page||'1')||1));
  const href=(nextCategory:string,n=1,nextCooking='')=>{const s=new URLSearchParams();if(q)s.set('q',q);if(nextCategory)s.set('category',nextCategory);if(nextCategory==='요리 재료 체크리스트'&&nextCooking)s.set('cooking',nextCooking);if(n>1)s.set('page',String(n));return '/weekend-prep'+(s.size?'?'+s:'');};

  return <main className="prep">
    {isPrepReview&&<p className="prep-notice">로컬 검토 화면 · 비공개 초안이 포함되어 있습니다.</p>}
    <p className="prep-eyebrow">WEEKEND GUIDE</p>
    <h1>주말 준비물 체크리스트</h1>
    <p className="prep-lead">이번 캠핑에서는 무엇을 먹을까요?<br/>메뉴별 재료와 양념, 조리도구를 확인하고 장보기 목록을 완성해 보세요.</p>
    {!isPrepReview&&<TossTopDeals contained />}
    <form action="/weekend-prep" className="prep-search"><input name="q" defaultValue={q} aria-label="요리와 준비물 검색" placeholder="메뉴나 준비물을 검색하세요"/>{category&&<input type="hidden" name="category" value={category}/>}<button>검색</button></form>
    <nav className="prep-filters" aria-label="준비물 분류"><Link href={href('')} aria-current={!category?'page':undefined}>전체 보기</Link>{PREP_CATEGORIES.filter(c=>all.some(a=>prepCategoryLabel(a.category,a)===c)).map(c=><Link key={c} href={href(c)} aria-current={category===c?'page':undefined}>{c}</Link>)}</nav>
    {category==='요리 재료 체크리스트'&&<nav className="prep-filters" aria-label="메뉴 종류">{COOKING_CATEGORIES.map(c=><Link key={c} href={href(category,1,c)} aria-current={cooking===c?'page':undefined}>{c}</Link>)}</nav>}
    {!list.length?<div className="prep-empty">{all.length?'검색 결과가 없어요. 다른 단어로 찾아보세요.':'알찬 주말 준비 이야기를 준비하고 있어요.'}<p><Link href="/camping">캠핑 장소 둘러보기 →</Link></p></div>:<div className="prep-grid">{list.slice((page-1)*9,page*9).map(a=><Link className="prep-card" href={`/weekend-prep/${a.slug}`} key={a.slug}>
      <div className="prep-card-media"><Image src={a.cover.url} alt={a.cover.alt} width={a.cover.width} height={a.cover.height} sizes="(max-width:480px) 100vw,(max-width:760px) 50vw,360px"/></div>
      <div className="prep-card-copy"><span className="prep-eyebrow">{prepCategoryLabel(a.category,a)}{isCookingPrepArticle(a)&&<small> · {cookingCategory(a)}</small>}</span><h2>{a.title}</h2><p>{a.description}</p></div>
    </Link>)}</div>}
    {pages>1&&<nav aria-label="페이지" className="prep-pages">{Array.from({length:pages},(_,i)=><Link key={i} aria-current={page===i+1?'page':undefined} href={href(category,i+1,cooking)}>{i+1}</Link>)}</nav>}
    {directory}
  </main>;
}
