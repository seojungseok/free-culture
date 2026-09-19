import Link from 'next/link';
import {COOKING_CATEGORIES,cookingCategory,getPrepArticles,isCookingPrepArticle,prepCategoryLabel} from '@/lib/weekend-prep/data';

export default function PrepDirectory(){
  const articles=getPrepArticles();
  const cooking=articles.filter(isCookingPrepArticle);
  const other=articles.filter(a=>!isCookingPrepArticle(a));
  const groups=[
    ...COOKING_CATEGORIES.map(name=>({name,articles:cooking.filter(a=>cookingCategory(a)===name)})),
    ...Array.from(new Set(other.map(a=>prepCategoryLabel(a.category,a)))).map(name=>({name,articles:other.filter(a=>prepCategoryLabel(a.category,a)===name)})),
  ].filter(g=>g.articles.length);
  if(!groups.length)return null;
  return <section className="prep-directory" aria-labelledby="prep-directory-title">
    <h2 id="prep-directory-title">메뉴·주제별 준비물 모아보기</h2>
    <p>국물요리부터 바비큐까지, 메뉴별 간단한 조리 흐름과 재료·조리 도구를 확인하세요. 다른 주말 준비도 함께 찾아볼 수 있어요.</p>
    <div className="prep-directory-grid">{groups.map(g=><section key={g.name}>
      <h3>{g.name}</h3>
      <ul>{g.articles.map(a=><li key={a.slug}><Link href={`/weekend-prep/${a.slug}`} prefetch={false}>{a.title}</Link></li>)}</ul>
    </section>)}</div>
  </section>;
}
