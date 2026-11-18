export const prepCollectionTitle = '캠핑요리 추천 | 메뉴별 재료와 레시피';
export const prepCollectionDescription = '캠핑 음식 메뉴를 고르고 필요한 재료와 양념을 확인하세요. 국물요리·볶음밥·바비큐·아침 메뉴의 장보기 목록과 조리법을 모았습니다.';

// Pair two existing pages by reader intent without merging or replacing their URLs.
const companions: [string,string][] = [
  ['camp-seafood-pot-table','camping-seafood-hotpot-ingredient-checklist'],
  ['camp-jeyuk-bokkeum','autumn-20260920-jeyuk-bokkeum-ingredient-checklist'],
  ['camp-sundae-bokkeum','autumn-20260920-sundae-bokkeum-ingredient-checklist'],
  ['camp-dakgalbi','autumn-20260920-dakgalbi-ingredient-checklist'],
  ['camp-ojingeo-bokkeum','camping-squid-stir-fry-ingredients'],
  ['camp-kimchi-fried-rice','camping-kimchi-fried-rice-ingredients'],
];

export function companionPrepSlug(slug: string): string | undefined {
  const pair = companions.find(pair=>pair.includes(slug));
  return pair?.find(value=>value!==slug);
}
import type {PrepArticle} from './types';

export function findCookingGuides(articles: PrepArticle[], query: string, now = Date.now()) {
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length || terms.every(term => term === '캠핑')) return [];
  const matches = [];
  for (const article of articles) {
    if (article.status !== 'published' || !(Date.parse(article.publishAt) <= now)) continue;
    if (!article.recipe && !/요리|재료/.test(article.category)) continue;
    const title = normalize(article.title);
    const ingredients = [...(article.recipe?.ingredients || []), ...(article.shoppingItems || article.checklist || []).map(item => item.label)];
    const fields = [title, normalize(article.description), ...ingredients.map(normalize), '캠핑요리레시피', '재료'];
    if (!terms.every(term => fields.some(field => field.includes(term)))) continue;
    const score = Number(title.includes(normalize(query))) * 10 + terms.filter(term => title.includes(term)).length;
    matches.push({article, score});
  }
  return matches.sort((a,b) => b.score - a.score).slice(0,6).map(match => match.article);
}
