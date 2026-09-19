import Link from 'next/link';
import Image from 'next/image';
import PrepImage from './PrepImage';
import PrepChecklist from './PrepChecklist';
import type {PrepArticle as Article,PrepProduct} from '@/lib/weekend-prep/types';
import {prepCategoryLabel} from '@/lib/weekend-prep/data';

function dishName(title:string){
 return title.split('|')[0].replace(/^(가을 대표 요리|가을 캠핑|캠핑)\s*/,'').replace(/\s*재료 체크리스트.*$/,'').trim();
}

function quickCookingGuide(name:string){
 const soupLike=/(탕|찌개|전골|라면|수제비|떡볶이)/.test(name);
 return soupLike
  ? `${name}은 국물 재료와 익는 데 시간이 필요한 주재료를 먼저 끓이고, 빨리 익는 채소·두부·면·대파는 마무리에 더해 보세요. 간은 마지막에 확인해 조절하고, 제품별 손질·가열 방법은 포장 안내를 우선으로 확인하세요.`
  : `${name}은 주재료와 채소를 쓰기 좋게 준비한 뒤, 사용하는 팬이나 그릴을 예열해 익는 속도에 맞춰 넣어 보세요. 간과 소스는 마지막에 조절하고, 제품별 손질·가열 방법은 포장 안내를 우선으로 확인하세요.`;
}

function CookingGuide({article,products}:{article:Article;products:PrepProduct[]}){
 const product=(id:string)=>products.find(p=>p.id===id);
 const ProductLink=({id,children}:{id:string;children:React.ReactNode})=>{
  const p=product(id);
  return p?<a href={p.affiliateUrl} target="_blank" rel="sponsored noopener">{children}</a>:<>{children}</>;
 };
 if(article.slug==='autumn-flower-crab-soup-ingredient-checklist')return <section className="prep-cooking-intro" aria-label="간단한 꽃게탕 끓이는 방법">
  <h2>간단한 꽃게탕 끓이는 방법</h2>
  <ol className="prep-cooking-steps">
   <li><ProductLink id="9603803528">냉동 꽃게</ProductLink>는 포장 안내에 따라 해동합니다. 손질이 필요한 경우 흐르는 물에 헹군 뒤 아가미와 배딱지를 정리하고, 집게는 조리 가위로 잘라 준비하세요.</li>
   <li>냄비에 물과 <ProductLink id="57577364">국물육수 다시팩</ProductLink>을 넣어 포장에 안내된 방식으로 국물 바탕을 냅니다. 무를 곁들인다면 먼저 익혀 주세요.</li>
   <li>국물이 끓으면 꽃게를 넣고 완전히 익을 때까지 끓입니다. <ProductLink id="8574770164">매운탕 양념</ProductLink>은 한 번에 다 넣지 말고 일부부터 풀어 간을 맞춰 보세요.</li>
   <li>애호박과 대파를 넣고 한소끔 더 끓인 뒤, 미나리는 불을 끄기 직전에 더합니다. 마지막에 국물 간을 확인해 조절하세요.</li>
  </ol>
  <p className="prep-cooking-note">해동·손질·가열과 양념·육수 사용량은 구매한 제품의 실제 포장 안내를 우선으로 확인하세요.</p>
 </section>;
 return <section className="prep-cooking-intro" aria-label="간단한 요리 방법"><h2>간단한 {dishName(article.title)} 만드는 방법</h2><p>{quickCookingGuide(dishName(article.title))}</p>{article.introduction&&article.introduction.text.split('\n').filter(Boolean).slice(0,1).map((text,i)=><p key={i}>{text}</p>)}</section>;
}

export default function PrepArticle({article:a,products,preview=false}:{article:Article;products:PrepProduct[];preview?:boolean}){
 const chosen=products.filter(p=>a.productIds.includes(p.id));
 const linked=new Set<string>();
 const carded=new Set<string>();
 const actionLabel=a.salesFormat==='food-recipe'?'쿠팡에서 재료 확인하기':a.salesFormat==='camping-gear'?'쿠팡에서 캠핑용품 확인하기':'쿠팡에서 제품 확인하기';
 return <article className="prep-article">
  <nav aria-label="현재 위치"><Link href="/">홈</Link> / <Link href="/weekend-prep">준비 가이드</Link> / {prepCategoryLabel(a.category,a)}</nav>
  {preview&&<p className="prep-notice">검토용 초안 · 아직 공개되지 않은 글입니다.</p>}
  <p className="prep-disclosure">이 글에는 제휴 링크가 포함되어 있습니다. 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.</p>
  <p className="prep-eyebrow">{prepCategoryLabel(a.category,a)}</p><h1>{a.title}</h1><p className="prep-lead">{a.description}</p>
  <PrepImage photo={a.cover} products={chosen} priority />
  {a.salesFormat==='food-checklist'&&<CookingGuide article={a} products={chosen}/>}
  {a.salesFormat==='food-checklist'&&a.checklist&&<PrepChecklist slug={a.slug} items={a.checklist} products={chosen} dishName={dishName(a.title)}/>}
  {a.sections.map((s,i)=>{
   const sectionProducts=s.productIds.map(id=>chosen.find(p=>p.id===id)).filter((p):p is PrepProduct=>!!p&&!a.quietProductIds?.includes(p.id)&&!carded.has(p.id));
   sectionProducts.forEach(p=>carded.add(p.id));
   return <section key={i}><h2>{s.heading}</h2>{s.text.split('\n').filter(Boolean).map((raw,j)=>{
   const isPoint=raw.startsWith('• ');const line=isPoint?raw.slice(2):raw;const parts:React.ReactNode[]=[line];
   for(const id of s.productIds){const p=chosen.find(p=>p.id===id);if(!p||linked.has(id))continue;for(let k=0;k<parts.length;k++){const part=parts[k];if(typeof part!=='string'||!part.includes(p.name))continue;const pos=part.indexOf(p.name);parts.splice(k,1,part.slice(0,pos),<a key={id} href={p.affiliateUrl} target="_blank" rel="sponsored noopener">{p.name}</a>,part.slice(pos+p.name.length));linked.add(id);break;}}
   return <p className={isPoint?'prep-point':undefined} key={j}>{parts}</p>;
  })}{a.salesFormat!=='food-checklist'&&sectionProducts.length>0&&<div className="prep-buy-grid">{sectionProducts.map(p=><a className="prep-buy-card" key={p.id} href={p.affiliateUrl} target="_blank" rel="sponsored noopener"><Image src={p.image} alt="" width={74} height={74} unoptimized/><span><strong>{p.name}</strong><small>{actionLabel} →</small></span></a>)}</div>}{s.image&&<PrepImage photo={s.image} products={chosen}/>}</section>})}
  <section className="prep-image-links"><h2>사진 속 +로 상품 확인하기</h2><p>사진에 표시된 +를 누르면 해당 재료나 제품의 쿠팡 페이지가 열립니다.</p></section>
  {!!a.internalLinks.length&&<nav aria-label="함께 읽기"><h2>함께 보면 좋은 곳</h2>{a.internalLinks.map(l=><p key={l.href}><Link href={l.href}>{l.label} →</Link></p>)}</nav>}
  <p className="prep-ai-note">{a.imageConnectionNote || '이 글의 이미지는 AI를 활용해 제작했습니다.'}</p>
 </article>;
}
