import type { CultureEvent } from "@/lib/types";
import { verifiedEventDetail } from './cultureGuide';

/** A searchable event needs a real description or several independent visit facts. */
export function hasSubstantiveEventInfo(event: CultureEvent): boolean {
  if (event.addressConflict) return false;
  if (event.contents.replace(/<[^>]*>/g, " ").trim().length >= 120) return true;
  const detail=verifiedEventDetail(event);
  if(event.place&&event.address&&event.officialUrl&&detail&&
    (new Set(detail.facts.map(fact=>fact.value)).size>=3||Number(detail.programme?.length)>=3))return true;
  return Boolean(
    event.place && event.address && event.officialUrl && event.phone &&
    event.priceType !== "unknown"
  );
}
