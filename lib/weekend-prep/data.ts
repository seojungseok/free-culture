import data from '@/data/weekend-prep.json';
import type {PrepStore} from './types';
import type {PrepArticle} from './types';
export const isPrepReview=process.env.NODE_ENV==='development'&&process.env.WEEKEND_PREP_LOCAL_REVIEW==='1';
export const prepStore = data as PrepStore;
export function getPrepArticles(){return prepStore.articles.filter(a=>isPrepReview || a.status==='published' && Date.parse(a.publishAt)<=Date.now());}

const COOKING_SLUGS = new Set([
  'autumn-flower-crab-soup-ingredient-checklist','camping-fishcake-soup-ingredient-checklist',
  'camping-budae-jjigae-ingredient-checklist','camping-beef-mushroom-hotpot-ingredient-checklist',
  'camping-seafood-hotpot-ingredient-checklist','camp-seafood-pot-table','camp-noodle-lunch',
  'camp-jeyuk-bokkeum','camp-sundae-bokkeum','camp-dakgalbi','camp-ojingeo-bokkeum','camp-kimchi-fried-rice',
]);

export function prepCategoryLabel(category:string, article?:Pick<PrepArticle,'slug'|'salesFormat'>){
  if(article?.salesFormat==='food-checklist' || category==='요리 준비물') return '요리 재료 체크리스트';
  if(category==='캠핑 요리' || category==='바비큐 요리' || article?.salesFormat==='food-recipe' || (article && COOKING_SLUGS.has(article.slug))) return '캠핑요리 가이드';
  return category;
}

export type CookingCategory = '국물요리'|'볶음요리'|'볶음밥'|'찌개'|'삼겹살·바비큐'|'장작·불멍 간식'|'간편식·아침'|'기타 요리';
export const COOKING_CATEGORIES: CookingCategory[] = ['국물요리','볶음요리','볶음밥','찌개','삼겹살·바비큐','장작·불멍 간식','간편식·아침','기타 요리'];
export function cookingCategory(article:Pick<PrepArticle,'slug'|'title'>):CookingCategory{
  const fresh:Record<string,CookingCategory>={'camp-omandungi-maeuntang-checklist':'국물요리','camp-ham-paprika-stirfry-checklist':'볶음요리','camp-ham-cheese-friedrice-checklist':'볶음밥','camp-sundae-jeongol-checklist':'찌개','camp-chicken-skewer-bbq-checklist':'삼겹살·바비큐','camp-woodfire-ciabatta-toast-checklist':'장작·불멍 간식','camp-jidan-gimgaru-breakfast-checklist':'간편식·아침','camp-paprika-cheese-grill-checklist':'기타 요리'};
  if(fresh[article.slug]) return fresh[article.slug];
  if(article.slug==='camp-kimchi-fried-rice') return '볶음밥';
  if(article.slug==='camping-budae-jjigae-ingredient-checklist') return '찌개';
  if(/볶음|제육|순대|닭갈비|오징어/.test(`${article.slug} ${article.title}`)) return '볶음요리';
  if(article.slug==='camp-griddle-barbecue-party') return '삼겹살·바비큐';
  if(article.slug==='camp-woodfire-snack-checklist') return '장작·불멍 간식';
  if(article.slug==='grilled-vegetable-side-dishes') return '기타 요리';
  if(article.slug==='camp-morning-sandwich') return '간편식·아침';
  return '국물요리';
}

export function isCookingPrepArticle(article:PrepArticle){return prepCategoryLabel(article.category,article)==='요리 재료 체크리스트';}
