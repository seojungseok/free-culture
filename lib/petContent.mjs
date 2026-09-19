// One publication gate for the list, regional hubs, sitemap and batch enrichment.
export const petText = value => String(value ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
export const petOverview = place => petText(place.overview || place.summary);
export function petQuality(place) {
  const raw = Object.fromEntries(Object.entries(place.petRaw || {}).map(([k,v])=>[k.toLowerCase(),petText(v)]));
  const policy = [raw.acmpytypecd, raw.acmpypsblcpam, raw.etcacmpyinfo].filter(Boolean).join(' ');
  const overview = petOverview(place);
  const reasons = [];
  if (!place.title || !(place.address || place.addr)) reasons.push('기본 위치 정보 부족');
  if (overview.length < 100 || /^반려동물과 함께 (방문|여행)/.test(overview)) reasons.push('장소별 소개 부족');
  if (!policy || !/동반|견종|반려|강아지|고양이|소형견|대형견/.test(policy)) reasons.push('구체적인 동반 안내 부족');
  if (/동반\s*(불가|불가능|금지)|반려동물\s*출입\s*(불가|금지)/.test(raw.acmpytypecd || '') || /안내견만|안내견\s*(외|이외).*불가/.test(policy)) reasons.push('일반 반려동물 허용 확인 필요');
  if (!place.enrichedAt) reasons.push('상세 수집 확인 전');
  if (new Set([place.image,...(place.images || [])].filter(Boolean).map(url=>url.replace(/^http:/,'https:'))).size < 3) reasons.push('장소 사진 3장 미만');
  if (!Object.entries(place.intro || {}).some(([k,v])=> !/^(contentid|contenttypeid)$/i.test(k) && petText(v)) && !(place.info || []).some(row=>petText(row.text))) reasons.push('시설·이용 정보 부족');
  return {publishable: reasons.length === 0, reasons};
}
