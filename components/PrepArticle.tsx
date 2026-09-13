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
  <section className="prep-image-links"><h2>사진 속 준비물은 필요할 때만 확인하세요</h2><p>사진의 +를 누르면 그 장면에 쓰인 준비물 상품 페이지가 새 창으로 열립니다. 이 글의 주제와 직접 관계없는 보조 준비물은 본문에서 따로 설명하지 않았습니다.</p></section>
  {!!a.internalLinks.length&&<nav aria-label="함께 읽기"><h2>준비했다면, 어디로 갈까요?</h2>{a.internalLinks.map(l=><p key={l.href}><Link href={l.href}>{l.label} →</Link></p>)}</nav>}
 </article>;
}
