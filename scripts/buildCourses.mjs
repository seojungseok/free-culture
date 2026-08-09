// 자동 여행코스 생성 엔진 — data/places.json(+제주 restaurants.json) 좌표로 코스를 "조합"한다.
//  지역 × 테마 × 근접 군집 → 최근접 동선 정렬 → (제주는 근처 맛집 삽입) → data/courses-auto.json
//  ★ TourAPI 호출 없음(좌표·기존 데이터만). 스팟명·지역·동선은 모두 사실. 소개글 보강은 generateCourses가 발행 때 수행.
//
// 실행: node scripts/buildCourses.mjs
// 출력: data/courses-auto.json (source:"auto"). 공식(data/courses.json)과 별도 → lib/courses가 병합.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLACES = path.join(ROOT, "data", "places.json");
const RESTAURANTS = path.join(ROOT, "data", "restaurants.json");
const OVERVIEWS = path.join(ROOT, "data", "place-overviews.json");
const OUT = path.join(ROOT, "data", "courses-auto.json");

const AREA_SLUG = {
  서울: "seoul", 부산: "busan", 대구: "daegu", 인천: "incheon", 광주: "gwangju", 대전: "daejeon",
  울산: "ulsan", 세종: "sejong", 경기: "gyeonggi", 강원: "gangwon", 충북: "chungbuk", 충남: "chungnam",
  전북: "jeonbuk", 전남: "jeonnam", 경북: "gyeongbuk", 경남: "gyeongnam", 제주: "jeju",
};

// 테마 정의 — cat 코드 + 제목 키워드. 맛집은 별도 스팟(제주 restaurants)으로만 삽입.
const THEMES = [
  { key: "문화유적", slug: "heritage", cat: /A0201/, re: /궁|사찰|유적|고택|한옥|서원|향교|성곽|왕릉|문화재|고분|읍성|종묘|사(?=\s|$)/ },
  { key: "자연힐링", slug: "nature", cat: /A0101/, re: /숲|수목원|공원|산(?!업)|정원|호수|둘레길|생태|습지|폭포|계곡|전망대|휴양림|해변|해수욕장|섬/ },
  { key: "가족체험", slug: "family", cat: /A0203|A0206/, re: /체험|박물관|과학관|미술관|테마파크|농원|목장|동물원|아쿠아리움|어린이|기념관|천문/ },
  { key: "바다피서", slug: "beach", cat: /X/, re: /해수욕장|해변|해안|바닷가|해양|계곡|워터|물놀이|섬|포구|항구/ },
];

const overviewsRaw = fs.existsSync(OVERVIEWS) ? JSON.parse(fs.readFileSync(OVERVIEWS, "utf8")) : {};
const OV = overviewsRaw.overviews || overviewsRaw; // {id: overviewText}
const ovOf = (id) => (typeof OV[id] === "string" ? OV[id] : "");

const toRad = (d) => (d * Math.PI) / 180;
function km(a, b) {
  const dLat = toRad(+b.mapy - +a.mapy), dLon = toRad(+b.mapx - +a.mapx);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(+a.mapy)) * Math.cos(toRad(+b.mapy)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// 최근접 이웃 순서로 경로 정렬
function routeOrder(seed, pts) {
  const rest = [...pts];
  const path = [seed];
  rest.splice(rest.indexOf(seed), 1);
  let cur = seed;
  while (rest.length) {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < rest.length; i++) { const d = km(cur, rest[i]); if (d < bd) { bd = d; bi = i; } }
    cur = rest.splice(bi, 1)[0];
    path.push(cur);
  }
  return path;
}

function districtOf(addr) {
  const t = String(addr || "").split(/\s+/);
  return t[1] || ""; // "서울특별시 종로구 ..." → 종로구
}

// 내용 기반 해시 — 스팟 조합이 같으면 ID가 항상 같게(재생성해도 발행글과 매칭 유지)
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
const DUR_SLUG = { "당일": "day", "1박2일": "1n2d", "2박3일": "2n3d" };

function main() {
  const places = JSON.parse(fs.readFileSync(PLACES, "utf8")).spots.filter((p) => p.mapx && p.mapy && p.image);
  const restaurants = (() => {
    try { const r = JSON.parse(fs.readFileSync(RESTAURANTS, "utf8")); return (r.restaurants || r || []).filter((x) => x.mapx && x.mapy); }
    catch { return []; }
  })();

  const areas = [...new Set(places.map((p) => p.area))];
  // 기간별: 일수 기반 시간예산으로 스팟 수를 "현실적으로" 산출(고정 아님).
  //  하루 예산 안에서 [방문시간 + 이동시간(거리÷속도)]을 누적, 초과 전까지만 담음. 식사시간은 예산에서 미리 뺌.
  const DURS = [
    { key: "당일", days: 1, km: 22, per: 12 },
    { key: "1박2일", days: 2, km: 45, per: 10 },
    { key: "2박3일", days: 3, km: 75, per: 8 },
  ];
  // 사람 기준 현실 계산: 한 곳 둘러보는 데 ~2시간 + 휴식, 이동시간 별도, 식사 제외.
  //  → 당일 ≈ 3곳, 1박2일 ≈ 5~6곳, 2박3일 ≈ 8곳.
  const VISIT_MIN = 130;         // 한 곳 관람+휴식(≈2시간 조금 넘게)
  const SPEED_KMH = 45;          // 지역 내 평균 이동 속도
  const DAY_USABLE_MIN = 420;    // 하루 실사용(≈7h; 식사·숙소이동 제외분)
  const MIN_STOPS = 3;           // 최소 3곳
  const MAX_PER_DUR = { "당일": 3, "1박2일": 6, "2박3일": 9 }; // 하루 3곳 기준(당일 4곳은 빡셈)

  // 장소 "종류" — 같은 종류가 한 코스에 중복되지 않게(해수욕장→해수욕장 방지). 최대 1곳/종류.
  const kindOf = (p) => {
    const t = `${p.title} ${p.addr || ""}`;
    if (/해수욕장|해변|해빈|해수욕/.test(t)) return "해변";
    if (/계곡/.test(t)) return "계곡";
    if (/박물관|미술관|전시관|기념관|과학관|갤러리/.test(t)) return "관람";
    if (/시장/.test(t)) return "시장";
    if (/수목원|식물원|정원|숲|공원|자연휴양림/.test(t)) return "공원";
    if (/폭포/.test(t)) return "폭포";
    if (/동굴/.test(t)) return "동굴";
    if (/사찰|사(?=\s|$)|절(?=\s|$)|암자|향교|서원|고택|한옥/.test(t)) return "역사";
    if (/항\b|포구|부두|어항/.test(t)) return "항구";
    if (/호수|호(?=\s|$)|저수지|석호/.test(t)) return "호수";
    if (/전망대|전망/.test(t)) return "전망대";
    if (/산(?!업)|봉\b|령\b|고개/.test(t)) return "산";
    return `기타:${(p.cat2 || p.title).slice(0, 6)}`; // 기타는 세분화해 과도한 중복만 방지
  };

  const out = [];
  const seenSig = new Set(); // 코스 스팟조합 서명 → 완전 중복 방지(구글 duplicate 회피)

  for (const area of areas) {
    const areaPlaces = places.filter((p) => p.area === area);

    for (const th of THEMES) {
      let pool = areaPlaces.filter((p) => th.cat.test(p.cat2 || "") || th.re.test(`${p.title} ${p.addr}`));
      pool = pool.filter((p, i, arr) => arr.findIndex((x) => x.title === p.title) === i);
      if (pool.length < 4) continue;

      // 씨앗(코스 첫 장소)은 테마를 확실히 대표하는 곳만 → "서울 바다코스"처럼 엉뚱한 조합 방지.
      const strongSeed = (p) =>
        th.key === "바다피서" ? /해수욕장|해변|해안|해빈/.test(`${p.title} ${p.addr}`)
        : th.key === "문화유적" ? (/A0201/.test(p.cat2 || "") || kindOf(p) === "역사")
        : true;
      const seedPool = pool.filter(strongSeed);
      if (seedPool.length < 1) continue; // 그 테마 대표지가 없으면 이 지역엔 이 테마 코스 안 만듦

      for (const dur of DURS) {
        const MAX_KM = dur.km, PER = dur.per;
        const MAX_STOPS = MAX_PER_DUR[dur.key] || 6;
        const budget = dur.days * DAY_USABLE_MIN; // 이 코스에 쓸 수 있는 총 활동 시간(분)
        const seeds = [...seedPool].sort((a, b) => (ovOf(b.id) ? 1 : 0) - (ovOf(a.id) ? 1 : 0));
        let made = 0;
        for (const seed of seeds) {
          if (made >= PER) break;
          // 이웃은 테마풀이 아니라 "지역 전체"에서 → 해변만 5개 X, 다양한 종류로 자연스럽게.
          const byId = new Map(areaPlaces.filter((p) => p.id !== seed.id && km(seed, p) <= MAX_KM).map((p) => [p.id, p]));
          if (byId.size < MIN_STOPS - 1) continue;
          const cluster = [seed];
          const usedKinds = new Set([kindOf(seed)]); // 같은 종류 중복 방지
          let cur = seed, mins = VISIT_MIN;
          while (byId.size && cluster.length < MAX_STOPS) {
            // 가까운 순으로 보되, 이미 담은 "종류"는 건너뜀(해수욕장→해수욕장 방지)
            const sorted = [...byId.values()].sort((a, b) => km(cur, a) - km(cur, b));
            let picked = null;
            for (const p of sorted) { if (!usedKinds.has(kindOf(p))) { picked = p; break; } }
            if (!picked) break; // 남은 게 전부 이미 담은 종류면 멈춤
            const travel = (km(cur, picked) / SPEED_KMH) * 60;
            if (mins + travel + VISIT_MIN > budget) break; // 하루 예산 초과 → 멈춤
            cluster.push(picked); usedKinds.add(kindOf(picked)); byId.delete(picked.id);
            cur = picked; mins += travel + VISIT_MIN;
          }
          if (cluster.length < MIN_STOPS) continue;

          const sig = cluster.map((p) => p.id).sort().join(",");
          if (seenSig.has(sig)) continue; // 같은 스팟 조합이면 스킵
          seenSig.add(sig);

          // 스팟 구성 (맛집은 별도 '근처 맛집' 섹션에서 표시 → 인라인 삽입 안 함)
          const stops = cluster.map((p, i) => ({
            num: i, name: p.title, overview: ovOf(p.id), image: p.image, placeId: p.id, addr: p.addr,
            mapx: p.mapx, mapy: p.mapy, // 근처 맛집 "○○ 근처" 라벨용
          }));

          const themeLabel = th.key === "바다피서" ? "바다·피서" : th.key === "문화유적" ? "문화유적" : th.key === "자연힐링" ? "자연·힐링" : "가족·체험";
          const dist = districtOf(seed.addr);
          const title = `${dist || area} ${themeLabel} ${dur.key} 코스`;
          const cx = cluster.reduce((s, p) => s + +p.mapx, 0) / cluster.length;
          const cy = cluster.reduce((s, p) => s + +p.mapy, 0) / cluster.length;

          out.push({
            id: `auto-${AREA_SLUG[area] || area}-${th.slug}-${DUR_SLUG[dur.key]}-${hash(sig)}`,
            title, area, image: seed.image, mapx: String(cx), mapy: String(cy), tel: "",
            overview: "", stops, stopCount: stops.length,
            duration: dur.key, themes: [th.key], source: "auto",
          });
          made++;
        }
      }
    }
  }

  const byArea = {}, byTheme = {}, byDur = {};
  for (const c of out) {
    byArea[c.area] = (byArea[c.area] || 0) + 1;
    byDur[c.duration] = (byDur[c.duration] || 0) + 1;
    for (const t of c.themes) byTheme[t] = (byTheme[t] || 0) + 1;
  }

  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: out.length, courses: out }, null, 0));
  console.log(`\n🧩 자동 코스 ${out.length}개 생성 → data/courses-auto.json`);
  console.log(`   기간: ${Object.entries(byDur).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
  console.log(`   테마: ${Object.entries(byTheme).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
  console.log(`   지역: ${Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(" · ")}\n`);
}

main();
