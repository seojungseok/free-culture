// Search Console page + query CSV exports. No account access or upload is required.
// node scripts/seoGrowthReport.mjs --last28 current.csv --previous28 previous.csv [--last7 recent.csv]
import { readFileSync } from "node:fs";

function rows(csv) {
  const output = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (quoted && csv[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((value) => value.trim())) output.push(row);
      row = [];
    } else field += char;
  }
  row.push(field);
  if (row.some((value) => value.trim())) output.push(row);
  return output;
}

const normalized = (value) => value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s_()%-]/g, "");
function column(headers, names) {
  const index = headers.findIndex((header) => names.includes(normalized(header)));
  if (index < 0) throw new Error(`필수 열이 없습니다: ${names.join(" / ")}`);
  return index;
}
function pagePath(raw) {
  try {
    const url = new URL(raw, "https://mwohaji.kr");
    if (url.hostname !== "mwohaji.kr" && url.hostname !== "www.mwohaji.kr") return "";
    if (/^\/(?:tickets(?:\/|$)|kids\/c\/|search(?:\/|$)|admin(?:\/|$))/.test(url.pathname)) return "";
    return url.pathname.replace(/\/$/, "") || "/";
  } catch { return ""; }
}
function number(value) {
  return Number(String(value || "0").replace(/[,\s%]/g, "")) || 0;
}
function readExport(path) {
  if (!path) return [];
  const [headers, ...data] = rows(readFileSync(path, "utf8"));
  const page = column(headers, ["page", "페이지", "상위페이지", "url"]);
  const query = headers.findIndex((header) => ["query", "검색어", "상위검색어"].includes(normalized(header)));
  const clicks = column(headers, ["clicks", "클릭수", "클릭"]);
  const impressions = column(headers, ["impressions", "노출수", "노출"]);
  const position = column(headers, ["position", "averageposition", "평균순위", "게재순위", "평균게재순위"]);
  return data.map((row) => ({
    url: pagePath(row[page] || ""), query: query < 0 ? "" : (row[query] || "").trim(),
    clicks: number(row[clicks]), impressions: number(row[impressions]), position: number(row[position]),
  })).filter((row) => row.url && row.impressions > 0);
}
function aggregate(records) {
  const pages = new Map();
  for (const row of records) {
    const old = pages.get(row.url) || { url: row.url, clicks: 0, impressions: 0, weightedPosition: 0, queries: new Map() };
    old.clicks += row.clicks;
    old.impressions += row.impressions;
    old.weightedPosition += row.position * row.impressions;
    if (row.query) old.queries.set(row.query, (old.queries.get(row.query) || 0) + row.impressions);
    pages.set(row.url, old);
  }
  return new Map([...pages].map(([url, page]) => [url, {
    url, clicks: page.clicks, impressions: page.impressions,
    ctr: page.clicks / page.impressions,
    position: page.weightedPosition / page.impressions,
    queries: [...page.queries].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([query]) => query),
  }]));
}

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, index, all) => {
  if (arg.startsWith("--")) pairs.push([arg.slice(2), all[index + 1]]);
  return pairs;
}, []));
if (!args.last28 || !args.previous28) {
  console.error("사용법: node scripts/seoGrowthReport.mjs --last28 현재.csv --previous28 이전.csv [--last7 최근.csv]");
  process.exit(1);
}
const current = aggregate(readExport(args.last28));
const previous = aggregate(readExport(args.previous28));
const recent = aggregate(readExport(args.last7));
const ranked = [...current.values()].map((page) => {
  const prev = previous.get(page.url);
  const last7 = recent.get(page.url);
  const categories = [];
  if (page.impressions >= 100 && page.ctr < 0.03 && page.position <= 20) categories.push("A_CTR");
  if (page.impressions >= 50 && page.position >= 8 && page.position <= 30) categories.push("B_POSITION");
  if (prev?.clicks >= 5 && page.clicks >= prev.clicks * 1.25) categories.push("C_GROWING");
  if (prev?.impressions >= 30 && page.impressions <= prev.impressions * 0.75) categories.push("D_DECLINING");
  return {
    ...page, ctr: Number((page.ctr * 100).toFixed(2)), position: Number(page.position.toFixed(1)),
    previousClicks: prev?.clicks ?? null, previousImpressions: prev?.impressions ?? null,
    last7Clicks: last7?.clicks ?? null, last7Impressions: last7?.impressions ?? null,
    categories,
  };
}).filter((page) => page.categories.length)
  .sort((a, b) => Math.min(...a.categories.map((category) => "ABCD".indexOf(category[0]))) - Math.min(...b.categories.map((category) => "ABCD".indexOf(category[0]))) || b.impressions - a.impressions);
console.log(JSON.stringify({ periods: { last28: args.last28, previous28: args.previous28, last7: args.last7 || null },
  analyzedPages: current.size, priorityPages: ranked.length, priorities: ranked.slice(0, 50) }, null, 2));
