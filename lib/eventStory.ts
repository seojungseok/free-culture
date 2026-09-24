import { fmtRange } from "@/lib/format";

export interface EventStoryInput {
  title: string;
  realmName: string;
  area: string;
  sigungu: string;
  place: string;
  startDate: string;
  endDate: string;
  priceLabel: string;
  priceType: string;
  audiences?: string[];
}

// Use only registered fields when the source has no event description.
export function eventStory(ev: EventStoryInput): string[] {
  const location = [ev.area, ev.sigungu, ev.place].filter(Boolean).join(" ");
  const period = fmtRange(ev.startDate, ev.endDate);
  const facts = [ev.realmName, period && `등록 기간 ${period}`, location && `장소 ${location}`].filter(Boolean);
  return facts.length ? [facts.join(" · ")] : [];
}
