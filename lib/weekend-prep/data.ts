import data from '@/data/weekend-prep.json';
import type {PrepStore} from './types';
import type {PrepArticle} from './types';
import { prepCategoryLabel } from './categoryLabel';
export { prepCategoryLabel } from './categoryLabel';
export const isPrepReview=process.env.NODE_ENV==='development'&&process.env.WEEKEND_PREP_LOCAL_REVIEW==='1';
export const prepStore = data as PrepStore;
export function getPrepArticles(){return prepStore.articles.filter(a=>isPrepReview || a.status==='published' && Date.parse(a.publishAt)<=Date.now());}

export type CookingCategory = '국물요리'|'볶음요리'|'볶음밥'|'찌개'|'삼겹살·바비큐'|'장작·불멍 간식'|'간편식·아침'|'기타 요리';
export const COOKING_CATEGORIES: CookingCategory[] = ['국물요리','볶음요리','볶음밥','찌개','삼겹살·바비큐','장작·불멍 간식','간편식·아침','기타 요리'];
export function cookingCategory(article:Pick<PrepArticle,'slug'|'title'>):CookingCategory{
  const newChecklists:Record<string,CookingCategory>={
    'autumn-camping-pork-kimchi-stew-ingredient-checklist':'찌개',
    'autumn-camping-doenjang-stew-ingredient-checklist':'찌개',
    'autumn-camping-perilla-mushroom-soup-ingredient-checklist':'국물요리',
    'autumn-camping-potato-sujebi-ingredient-checklist':'국물요리',
    'autumn-camping-shrimp-butter-grill-ingredient-checklist':'삼겹살·바비큐',
    'autumn-camping-mackerel-potato-braise-ingredient-checklist':'기타 요리',
    'autumn-camping-chicken-potato-stew-ingredient-checklist':'찌개',
    'autumn-camping-tteokbokki-ingredient-checklist':'기타 요리',
    'autumn-camping-zucchini-pancake-ingredient-checklist':'기타 요리',
    'autumn-camping-corn-cheese-ingredient-checklist':'기타 요리',
    'camping-seafood-ramen-ingredients':'국물요리',
    'camping-mussel-soup-ingredients':'국물요리',
    'camping-kimchi-fried-rice-ingredients':'볶음밥',
    'camping-squid-stir-fry-ingredients':'볶음요리',
    'camping-chicken-skewer-ingredients':'삼겹살·바비큐',
    'camping-kimchi-pancake-ingredients':'기타 요리',
    'camping-pork-belly-bbq-ingredients':'삼겹살·바비큐',
    'camping-tofu-kimchi-ingredients':'기타 요리',
  };
  if(newChecklists[article.slug]) return newChecklists[article.slug];
  const fresh:Record<string,CookingCategory>={'camp-omandungi-maeuntang-checklist':'국물요리','camp-ham-paprika-stirfry-checklist':'볶음요리','camp-ham-cheese-friedrice-checklist':'볶음밥','camp-sundae-jeongol-checklist':'찌개','camp-chicken-skewer-bbq-checklist':'삼겹살·바비큐','camp-samgyeopsal-bbq-ingredient-checklist':'삼겹살·바비큐','camp-woodfire-ciabatta-toast-checklist':'장작·불멍 간식','camp-jidan-gimgaru-breakfast-checklist':'간편식·아침','camp-paprika-cheese-grill-checklist':'기타 요리'};
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
