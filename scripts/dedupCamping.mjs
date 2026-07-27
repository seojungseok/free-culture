// 나들이(레포츠 type28)에 섞인 캠핑장을 찾아 제외 대상으로 표시 → data/camping-dupe-ids.json
//  매칭: 좌표 200m 이내 고캠핑과 근접 OR 이름이 캠핑/야영장/글램핑/카라반.
//  결과 { placeId: goCampId|"" } — 사이트는 이 id를 나들이에서 빼고, 상세는 /camping으로 301.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const places = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "places.json"), "utf8")).spots;
const camps = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "camping.json"), "utf8")).camps;

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, "");
const CAMP_RE = /캠핑|야영장|글램핑|카라반|오토캠프/;
const rad = (d) => (d * Math.PI) / 180;
function distKm(x1, y1, x2, y2) {
  if (![x1, y1, x2, y2].every(Number.isFinite)) return Infinity;
  const R = 6371, dLat = rad(y2 - y1), dLon = rad(x2 - x1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(y1)) * Math.cos(rad(y2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 캠핑 좌표 인덱스 (0.05도 격자 → 근접 후보만 비교)
const grid = new Map();
const key = (x, y) => `${Math.round(x / 0.05)},${Math.round(y / 0.05)}`;
for (const c of camps) {
  const x = parseFloat(c.mapx), y = parseFloat(c.mapy);
  if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
  const k = key(x, y);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push({ ...c, x, y });
}
function nearestCamp(x, y) {
  let best = null, bestD = Infinity;
  for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
    const cell = grid.get(`${Math.round(x / 0.05) + gx},${Math.round(y / 0.05) + gy}`);
    if (!cell) continue;
    for (const c of cell) { const d = distKm(x, y, c.x, c.y); if (d < bestD) { bestD = d; best = c; } }
  }
  return bestD <= 0.2 ? best : null;
}

const map = {};
let byName = 0, byCoord = 0;
for (const p of places) {
  if (p.type !== "28") continue;
  const x = parseFloat(p.mapx), y = parseFloat(p.mapy);
  const near = Number.isFinite(x) && Number.isFinite(y) ? nearestCamp(x, y) : null;
  if (near) { map[p.id] = near.id; byCoord++; continue; }
  if (CAMP_RE.test(p.title)) {
    // 이름으로만 매칭 — 같은 시군구 동명 캠핑 있으면 연결, 없으면 ""
    const cand = camps.find((c) => c.area === p.area && norm(c.name) === norm(p.title));
    map[p.id] = cand ? cand.id : "";
    byName++;
  }
}

fs.writeFileSync(path.join(ROOT, "data", "camping-dupe-ids.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), count: Object.keys(map).length, ids: map }));
console.log(`\n🔁 나들이(레포츠)에서 캠핑 제외 대상: ${Object.keys(map).length}곳 (좌표매칭 ${byCoord} · 이름매칭 ${byName})`);
console.log(`   그중 /camping 상세로 301 연결 가능(좌표): ${Object.values(map).filter(Boolean).length}곳`);
