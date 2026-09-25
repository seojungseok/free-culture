import overviews from "@/data/place-overviews.json";
import { getArticle } from "@/lib/articles";
import { getInfo, introRows, restaurantIntroRows, isUsefulVisitText } from "@/lib/tourExtra";
import type { Camp } from "@/lib/camping";

/** Only pages with a substantive, stored description or several verified visit facts enter the sitemap. */
export function hasSubstantivePlaceInfo(id: string): boolean {
  const article = getArticle(id);
  if (article?.content && article.content.replace(/[#*`>-]/g, " ").trim().length >= 300) return true;
  const overview = (overviews as Record<string, string>)[id] || "";
  if (overview.trim().length >= 150) return true;
  if (introRows(id).filter((row) => row.value.trim().length >= 4).length >= 3) return true;
  return getInfo(id).filter((item) => isUsefulVisitText(item.text) && item.text.trim().length >= 15).length >= 2;
}

/** A restaurant card with only a name, address and photo is too sparse for indexing. */
export function hasSubstantiveRestaurantInfo(id: string): boolean {
  return restaurantIntroRows(id)
    .filter((row) => ["영업시간", "휴무일", "주차", "대표메뉴", "취급메뉴"].includes(row.label) && row.value.trim().length >= 4)
    .length >= 2;
}

/** Keep sparse campsite records available to visitors without inviting indexing. */
export function hasSubstantiveCampInfo(camp: Camp): boolean {
  if (camp.intro.trim().length >= 30) return true;
  const facilities = Object.values(camp.facilities).filter(Boolean).length;
  return Boolean(camp.addr && camp.types.length && facilities >= 3 && (camp.operPd || isUsefulVisitText(camp.petRaw)));
}
