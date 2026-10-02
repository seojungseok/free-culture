/** Extract a clickable web URL from public-source fields without guessing a site. */
const decodeEntities = (value: string) => value.replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[\da-f]+|\d+);/gi, (entity) => {
  const named: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };
  const known = named[entity.toLowerCase()];
  if (known !== undefined) return known;
  const numeric = entity.slice(2, -1);
  const point = numeric[0].toLowerCase() === "x" ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10);
  return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "";
});
const label = String.raw`[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?`;
const domain = String.raw`(?:${label}\.)+(?:[a-z]{2,63}|xn--[a-z\d-]{2,59})`;
const bareDomain = new RegExp(`^${domain}(?::\\d{1,5})?(?:[/?#][^\\s<>"'\\\\]*)?$`, "iu");
const tokens = new RegExp(`(?:https?:\\/\\/|\\/\\/)[^\\s<>"']+|(?:^|[\\s(])${domain}(?::\\d{1,5})?(?:[/?#][^\\s<>"'\\\\]*)?`, "giu");

function webUrl(value: string): string {
  let candidate = value.trim();
  if (/\s|[<>"'\\\u0000-\u001f\u007f]/.test(candidate)) return "";
  if (candidate.startsWith("//")) candidate = `https:${candidate}`;
  else if (bareDomain.test(candidate)) candidate = `https://${candidate}`;
  if (!/^https?:\/\//i.test(candidate)) return "";
  try {
    const parsed = new URL(candidate);
    // Reject credentials and malformed DNS labels rather than making a
    // relative URL, an email address or a scheme payload clickable.
    if (!parsed.hostname || parsed.username || parsed.password) return "";
    const host = parsed.hostname;
    if (!host.startsWith("[") && (!host.includes(".") || host.split(".").some(part => !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(part)))) return "";
    return candidate;
  } catch { return ""; }
}

function trimProseToken(value: string): string {
  let candidate = value.trim().replace(/^[\s(]+/, "");
  // A comma separating two links is prose; commas inside a query remain intact.
  const second = candidate.search(/[,;]https?:\/\//i);
  const query = candidate.indexOf("?");
  if (second >= 0 && (query < 0 || second < query)) candidate = candidate.slice(0, second);
  candidate = candidate.replace(/[,;]+$/, "");
  while (candidate.endsWith(")") && (candidate.match(/\)/g) || []).length > (candidate.match(/\(/g) || []).length) candidate = candidate.slice(0, -1);
  return candidate;
}

export function normalizeExternalUrl(value: unknown): string {
  const source = decodeEntities(String(value ?? "")).replace(/\\\//g, "/").trim();
  if (!source || /^(?:javascript|data|vbscript|file|blob|mailto|tel):/i.test(source.replace(/[\s\u0000-\u001f]/g, ""))) return "";
  if (/<[^>]+>/.test(source)) {
    // Use only href attributes; text in HTML is not an authoritative target.
    for (const match of source.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      const result = webUrl(decodeEntities(match[1] || match[2] || match[3] || ""));
      if (result) return result;
    }
    return "";
  }
  const direct = webUrl(source);
  if (direct && !/[,;]https?:\/\//i.test(source.split("?")[0])) return direct;
  for (const match of source.matchAll(tokens)) {
    const result = webUrl(trimProseToken(match[0]));
    if (result) return result;
  }
  return "";
}
