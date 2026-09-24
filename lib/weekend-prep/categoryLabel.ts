import type { PrepArticle } from "./types";

const COOKING_SLUGS = new Set([
  "autumn-flower-crab-soup-ingredient-checklist", "camping-fishcake-soup-ingredient-checklist",
  "camping-budae-jjigae-ingredient-checklist", "camping-beef-mushroom-hotpot-ingredient-checklist",
  "camping-seafood-hotpot-ingredient-checklist", "camp-seafood-pot-table", "camp-noodle-lunch",
  "camp-jeyuk-bokkeum", "camp-sundae-bokkeum", "camp-dakgalbi", "camp-ojingeo-bokkeum", "camp-kimchi-fried-rice",
]);

export function prepCategoryLabel(category: string, article?: Pick<PrepArticle, "slug" | "checklist">) {
  if (article?.checklist?.length || category === "요리 준비물") return "요리 재료 체크리스트";
  if (category === "캠핑 요리" || category === "바비큐 요리" || (article && COOKING_SLUGS.has(article.slug))) return "캠핑요리 가이드";
  return category;
}
