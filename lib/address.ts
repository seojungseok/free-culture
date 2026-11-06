// The merged legal address took effect on 2026-07-01. Keep the source name;
// Gwangju and Jeonnam remain separate travel filters, not legal address rewrites.
const MERGED_REGION = "전남광주통합특별시";
const GWANGJU_DISTRICT = /^(?:광산구|동구|서구|남구|북구)(?:\s|$)/;
const JEONNAM_DISTRICT = /^(?:목포시|여수시|순천시|나주시|광양시|담양군|곡성군|구례군|고흥군|보성군|화순군|장흥군|강진군|해남군|영암군|무안군|함평군|영광군|장성군|완도군|진도군|신안군)(?:\s|$)/;

export function mergedAddressTravelArea(value: string): string {
  const address = String(value || "").trim();
  if (!address.startsWith(`${MERGED_REGION} `)) return "";
  const district = address.slice(MERGED_REGION.length).trimStart();
  return GWANGJU_DISTRICT.test(district) ? "광주" : JEONNAM_DISTRICT.test(district) ? "전남" : "";
}

export function displayAddress(value: string, area?: string): string {
  const address = String(value || "").trim();
  const inferred = mergedAddressTravelArea(address);
  if (area && inferred && inferred !== area) return "";
  return address;
}

export function displayRegionTitle(title: string, _area: string): string {
  return title;
}
