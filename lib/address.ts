// Some upstream records contain a non-existent merged province name. Correct
// only when the following district identifies Gwangju or Jeollanam-do.
const INVALID_REGION = "전남광주통합특별시";
const GWANGJU_DISTRICT = /^(?:광산구|동구|서구|남구|북구)(?:\s|$)/;
const JEONNAM_DISTRICT = /^(?:목포시|여수시|순천시|나주시|광양시|담양군|곡성군|구례군|고흥군|보성군|화순군|장흥군|강진군|해남군|영암군|무안군|함평군|영광군|장성군|완도군|진도군|신안군)(?:\s|$)/;

export function displayAddress(value: string, area?: string): string {
  const address = String(value || "").trim();
  if (area && address.startsWith(`${INVALID_REGION} `)) {
    const district = address.slice(INVALID_REGION.length).trimStart().split(/\s+/)[0];
    const inferred = GWANGJU_DISTRICT.test(`${district} `) ? "광주" : JEONNAM_DISTRICT.test(`${district} `) ? "전남" : "";
    if (inferred && inferred !== area) return "";
  }
  return address.replaceAll(new RegExp(`${INVALID_REGION}\\s+([^\\s]+)`, "g"), (match, district: string) => {
    if (GWANGJU_DISTRICT.test(`${district} `)) return `광주광역시 ${district}`;
    if (JEONNAM_DISTRICT.test(`${district} `)) return `전라남도 ${district}`;
    // Keep the original district and street without inventing a province.
    return district;
  });
}

export function displayRegionTitle(title: string, area: string): string {
  if (!title.includes(INVALID_REGION)) return title;
  if (area === "광주") return title.replaceAll(INVALID_REGION, "광주시");
  if (area === "전남") return title.replaceAll(INVALID_REGION, "전라남도");
  return title;
}
