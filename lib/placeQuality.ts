import overviews from "@/data/place-overviews.json";
import { getArticle } from "@/lib/articles";
import { getInfo, introRows } from "@/lib/tourExtra";

/** Only pages with a substantive, stored description or several verified visit facts enter the sitemap. */
export function hasSubstantivePlaceInfo(id: string): boolean {
  const article = getArticle(id);
  if (article?.content && article.content.replace(/[#*`>-]/g, " ").trim().length >= 300) return true;
  const overview = (overviews as Record<string, string>)[id] || "";
  if (overview.trim().length >= 150) return true;
  if (introRows(id).filter((row) => row.value.trim().length >= 4).length >= 3) return true;
  return getInfo(id).filter((item) => item.text.trim().length >= 15).length >= 2;
}
