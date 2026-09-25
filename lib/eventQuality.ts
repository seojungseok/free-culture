import type { CultureEvent } from "@/lib/types";

/** A searchable event needs a real description or several independent visit facts. */
export function hasSubstantiveEventInfo(event: CultureEvent): boolean {
  if (event.addressConflict) return false;
  if (event.contents.replace(/<[^>]*>/g, " ").trim().length >= 120) return true;
  return Boolean(
    event.place && event.address && event.officialUrl && event.phone &&
    event.priceType !== "unknown"
  );
}
