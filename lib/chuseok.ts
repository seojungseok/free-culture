import data from "@/data/chuseok.json";

export type ChuseokEvent = {
  id: string;
  title: string;
  area: string;
  sigungu: string;
  place: string;
  address: string;
  startDate: string;
  endDate: string;
  description: string;
  image: string;
  officialUrl: string;
  isFree: boolean;
  isNight: boolean;
  isKids: boolean;
  isTraditional: boolean;
  lat: string;
  lng: string;
};

export const CHUSEOK_START = "20260901";
export const CHUSEOK_END = "20260930";

export function isChuseokMainSeason(today: string): boolean {
  return today >= CHUSEOK_START && today <= CHUSEOK_END;
}

export function getChuseokEvents(): ChuseokEvent[] {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replaceAll("-", "");
  return ((data.events || []) as ChuseokEvent[])
    .filter((event) => event.endDate >= today && event.startDate <= CHUSEOK_END);
}

export function formatChuseokDate(start: string, end: string): string {
  const s = `${start.slice(4, 6)}월 ${start.slice(6, 8)}일`;
  const e = `${end.slice(4, 6)}월 ${end.slice(6, 8)}일`;
  return start === end ? s : `${s} ~ ${e}`;
}
