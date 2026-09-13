import Link from 'next/link';
import PrepImage from './PrepImage';
import type {PrepArticle as Article,PrepProduct} from '@/lib/weekend-prep/types';
export default function PrepArticle({article:a,products,preview=false}:{article:Article;products:PrepProduct[];preview?:boolean}){
 const chosen=products.filter(p=>a.productIds.includes(p.id));
 const linked=new Set<string>();
 return <article className="prep-article">
  <nav aria-label="현재 위치"><Link href="/">홈</Link> / <Link href="/weekend-prep">주말 준비물</Link> / {a.category}</nav>
  {preview&&<p className="prep-notice">검토용 초안 · 아직 공개되지 않은 글입니다.</p>}
  <p className="prep-disclosure">이 글에는 제휴 링크가 포함되어 있습니다. 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.</p>
  <p className="prep-eyebrow">{a.category}</p><h1>{a.title}</h1><p className="prep-lead">{a.description}</p>
  <PrepImage photo={a.cover} products={chosen} priority/>
  {a.sections.map((s,i)=><section key={i}><h2>{s.heading}</h2>{s.text.split('\n').filter(Boolean).map((line,j)=>{
   const parts:React.ReactNode[]=[line];
   for(const id of s.productIds){const p=chosen.find(p=>p.id===id);if(!p||linked.has(id))continue;for(let k=0;k<parts.length;k++){const part=parts[k];if(typeof part!=='string'||!part.includes(p.name))continue;const pos=part.indexOf(p.name);parts.splice(k,1,part.slice(0,pos),<a key={id} href={p.affiliateUrl} target="_blank" rel="sponsored noopener">{p.name}</a>,part.slice(pos+p.name.length));linked.add(id);break;}}
   return <p key={j}>{parts}</p>;
  })}{s.image&&<PrepImage photo={s.image} products={chosen}/>}</section>)}
  <section><h2>이 활동에 필요한 준비물</h2><p>집에 있는 물건부터 살펴보세요. 새로 준비한다면 규격과 옵션을 확인해 주세요.</p><div className="prep-products">{chosen.map(p=><div key={p.id}><strong><a href={p.affiliateUrl} target="_blank" rel="sponsored noopener">{p.name} ↗</a></strong><p>{p.specification||'규격·옵션은 판매처 확인 필요'}</p><p>{p.evidence}</p></div>)}</div></section>
  {!!a.internalLinks.length&&<nav aria-label="함께 읽기"><h2>준비했다면, 어디로 갈까요?</h2>{a.internalLinks.map(l=><p key={l.href}><Link href={l.href}>{l.label} →</Link></p>)}</nav>}
 </article>;
}
