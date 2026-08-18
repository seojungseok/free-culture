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
const ARTICLES = path.join(ROOT, "data", "course-articles.json"); // 발행글 저장소(발행된 코스 ID 보존용)

const AREA_SLUG = {
  서울: "seoul", 부산: "busan", 대구: "daegu", 인천: "incheon", 광주: "gwangju", 대전: "daejeon",
  울산: "ulsan", 세종: "sejong", 경기: "gyeonggi", 강원: "gangwon", 충북: "chungbuk", 충남: "chungnam",
  전북: "jeonbuk", 전남: "jeonnam", 경북: "gyeongbuk", 경남: "gyeongnam", 제주: "jeju",
};

// route(동선) 코스 테마 — 해수욕장은 여기서 제외(별도 "해수욕장 베스트" 리스트로만 다룸).
const THEMES = [
  { key: "문화유적", slug: "heritage", cat: /A0201/, re: /궁|사찰|유적|고택|한옥|서원|향교|성곽|왕릉|문화재|고분|읍성|종묘|사(?=\s|$)/ },
  { key: "자연힐링", slug: "nature", cat: /A0101/, re: /숲|수목원|공원|산(?!업)|정원|호수|둘레길|생태|습지|폭포|계곡|전망대|휴양림/ },
  { key: "가족체험", slug: "family", cat: /A0203|A0206/, re: /체험|박물관|과학관|미술관|테마파크|농원|목장|동물원|아쿠아리움|어린이|기념관|천문/ },
];
// 해수욕장 판별 — route 코스에서 제외 + 베스트 리스트 대상
const isBeach = (p) => /해수욕장|해변|해수욕/.test(String(p.title || ""));

// 배편(다리 없음) 섬 — addr 기준. 같은 섬끼리만 코스로 묶어 "육지↔배편섬 혼합"을 원천 차단하고,
//  섬 안에서만 도는 "섬 단독 코스"가 자연스럽게 만들어지게 한다. (다리 섬: 강화·거제·남해·안면·영흥·대부·선유·진도·완도 → 육지 취급)
const FERRY_ISLE = [
  ["울릉", /울릉군/], ["백령", /옹진군\s*백령/], ["대청", /옹진군\s*대청/], ["연평", /옹진군\s*연평/],
  ["덕적", /옹진군\s*덕적/], ["자월", /옹진군\s*자월/],
  ["거문", /여수시\s*삼산면/], ["욕지", /통영시\s*욕지/], ["한산", /통영시\s*한산/], ["사량", /통영시\s*사량/],
  ["청산", /완도군\s*청산면/], ["보길", /완도군\s*보길면/], ["노화", /완도군\s*노화면/], ["소안", /완도군\s*소안면/],
  ["흑산", /신안군\s*흑산면/], ["추자", /제주시\s*추자면/], ["조도", /진도군\s*조도면/],
];
const ferryIsleOf = (p) => { const a = String(p.addr || ""); for (const [k, re] of FERRY_ISLE) if (re.test(a)) return k; return ""; };
// 같은 섬(또는 둘 다 육지)일 때만 한 코스로 묶을 수 있음
const sameReach = (a, b) => ferryIsleOf(a) === ferryIsleOf(b);

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

  // ── 이미 "발행된" 자동 코스는 그대로 보존 ──────────────────────────────
  //  상한을 낮추면 스팟 조합이 바뀌어 코스 ID(스팟해시)도 바뀐다 → 기존 발행글이 사이트에서
  //  사라지고(고아화) 새 ID로 다시 쓰게 되어 API 비용이 든다. 이를 막기 위해:
  //   · 지금까지 발행된 코스는 이전 courses-auto.json에서 "원본 그대로" 유지(ID·스팟 불변).
  //   · 그 코스가 차지한 슬롯(지역|테마|기간|씨앗)은 새로 만들지 않음(작은 쌍둥이 방지).
  //  → 발행 안 된 나머지(대다수)만 새 상한으로 재조합. 새로 발행되면 다음 빌드부터 자동 보존.
  const prevCourses = (() => {
    try { return JSON.parse(fs.readFileSync(OUT, "utf8")).courses || []; } catch { return []; }
  })();
  const publishedIds = (() => {
    try {
      const arts = JSON.parse(fs.readFileSync(ARTICLES, "utf8")).articles || {};
      return new Set(Object.keys(arts).filter((id) => arts[id]?.status === "published"));
    } catch { return new Set(); }
  })();
  const prevById = new Map(prevCourses.map((c) => [c.id, c]));
  const preserved = [...publishedIds].map((id) => prevById.get(id)).filter(Boolean);
  // 슬롯키: 지역|테마|기간|씨앗(placeId). 리스트형(해수욕장 베스트)은 ID가 안정적이라 제외.
  const slotKey = (area, theme, dur, seedId) => `${area}|${theme}|${dur}|${seedId}`;
  const preservedSlots = new Set(
    preserved
      .filter((c) => c.format !== "list" && c.stops?.[0]?.placeId)
      .map((c) => slotKey(c.area, (c.themes || [])[0], c.duration, c.stops[0].placeId))
  );

  const areas = [...new Set(places.map((p) => p.area))];
  // 기간별: 일수 기반 시간예산으로 스팟 수를 "현실적으로" 산출(고정 아님).
  //  하루 예산 안에서 [방문시간 + 이동시간(거리÷속도)]을 누적, 초과 전까지만 담음. 식사시간은 예산에서 미리 뺌.
  const DURS = [
    { key: "당일", days: 1, km: 22, per: 12 },
    { key: "1박2일", days: 2, km: 45, per: 10 },
    { key: "2박3일", days: 3, km: 75, per: 8 },
  ];
  // 사람 기준 현실 계산: 한 곳 둘러보는 데 ~2시간 + 휴식, 이동시간 별도, 식사 제외.
  //  → 당일 ≈ 3곳, 1박2일 ≈ 4~5곳, 2박3일 ≈ 5~6곳. (2박3일 8곳은 너무 빡세 → 상한 6으로)
  const VISIT_MIN = 100;         // 한 곳 관람+휴식(≈1.5~2시간)
  const SPEED_KMH = 45;          // 지역 내 평균 이동 속도
  const DAY_USABLE_MIN = 420;    // 하루 실사용(≈7h; 식사·숙소이동 제외분)
  const MIN_STOPS = 2;           // 최소 2곳(멀면 적게)
  //  ★ 상한(테두리) — 실제 개수는 시간예산(방문+이동거리)으로 이 상한 "안에서" 유동 산출.
  //     가까우면 상한까지, 멀면 2~3곳으로 자동. 당일 3 · 1박2일 5 · 2박3일 6.
  const MAX_PER_DUR = { "당일": 3, "1박2일": 5, "2박3일": 6 };

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

      // 씨앗(코스 첫 장소)은 테마를 확실히 대표하는 곳만. 해수욕장은 route에서 제외.
      const strongSeed = (p) =>
        !isBeach(p) && (th.key === "문화유적" ? (/A0201/.test(p.cat2 || "") || kindOf(p) === "역사") : true);
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
          // 이미 발행된 코스가 이 슬롯(지역|테마|기간|씨앗)을 차지 → 원본 보존, 재조합 스킵.
          if (preservedSlots.has(slotKey(area, th.key, dur.key, seed.id))) continue;
          // 이웃은 지역 전체에서 다양하게. 단 해수욕장은 route에서 제외(베스트 리스트로만).
          //  ★ 배편 섬은 같은 섬끼리만(sameReach) — 육지↔배편섬 혼합 방지 + 섬 단독 코스 형성.
          const byId = new Map(areaPlaces.filter((p) => p.id !== seed.id && !isBeach(p) && sameReach(seed, p) && km(seed, p) <= MAX_KM).map((p) => [p.id, p]));
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
            id: `${AREA_SLUG[area] || area}-${th.slug}-${DUR_SLUG[dur.key]}-${hash(sig)}`,
            title, area, image: seed.image, mapx: String(cx), mapy: String(cy), tel: "",
            overview: "", stops, stopCount: stops.length,
            duration: dur.key, themes: [th.key], source: "auto",
          });
          made++;
        }
      }
    }

    // ── "지역 해수욕장 베스트 N" 리스트(코스 아님) — 해안 지역만. 인기(소개 있는 명소·정식 해수욕장) 우선. ──
    // 전국 유명 해수욕장(인기 상위) 가점 — 이런 게 있으면 베스트 앞순위로
    const FAMOUS = /해운대|광안리|송정|경포|낙산|정동진|속초|망상|대천|무창포|만리포|을왕리|왕산|협재|함덕|이호테우|중문|월정|김녕|구룡포|영일대|나정|상주|송정|일광|진하|다대포|변산|채석강|명사십리|천리포|꽃지|안면/;
    const beachScore = (p) =>
      (FAMOUS.test(p.title) ? 8 : 0) +               // 전국구 유명 해수욕장 최우선
      (ovOf(p.id) ? 4 : 0) +                        // 소개 자료 있음 = 문서화된 명소(인기 신호)
      (/해수욕장/.test(p.title) ? 2 : 0) +           // 정식 "해수욕장"이 "해변"보다 대체로 유명
      (p.title.length <= 8 ? 1 : 0);                 // 짧은 대표 지명 가점
    const beaches = areaPlaces
      .filter(isBeach)
      .filter((p, i, arr) => arr.findIndex((x) => x.title === p.title) === i)
      .sort((a, b) => beachScore(b) - beachScore(a) || a.title.length - b.title.length);
    if (beaches.length >= 5) {
      const top = beaches.slice(0, 10);
      const stops = top.map((p, i) => ({
        num: i, name: p.title, overview: ovOf(p.id), image: p.image, placeId: p.id, addr: p.addr, mapx: p.mapx, mapy: p.mapy,
      }));
      const hero = top.find((p) => p.image)?.image || "";
      out.push({
        id: `${AREA_SLUG[area] || area}-beaches`,
        title: `${area} 해수욕장 베스트 ${top.length}`,
        area, image: hero, mapx: "", mapy: "", tel: "",
        overview: "", stops, stopCount: stops.length,
        duration: "베스트", format: "list", themes: ["바다피서"], source: "auto",
      });
    }
  }

  // 발행된 코스 원본을 합침(이미 있으면 보존본 우선). 리스트형 해수욕장 베스트도 여기서 유지.
  const outIds = new Set(out.map((c) => c.id));
  let keptCount = 0;
  for (const c of preserved) if (!outIds.has(c.id)) { out.push(c); outIds.add(c.id); keptCount++; }

  const byArea = {}, byTheme = {}, byDur = {};
  for (const c of out) {
    byArea[c.area] = (byArea[c.area] || 0) + 1;
    byDur[c.duration] = (byDur[c.duration] || 0) + 1;
    for (const t of c.themes) byTheme[t] = (byTheme[t] || 0) + 1;
  }

  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: out.length, courses: out }, null, 0));
  console.log(`\n🧩 자동 코스 ${out.length}개 생성 → data/courses-auto.json`);
  console.log(`   보존(발행됨) ${keptCount}개 · 상한 당일 ${MAX_PER_DUR["당일"]} · 1박2일 ${MAX_PER_DUR["1박2일"]} · 2박3일 ${MAX_PER_DUR["2박3일"]}`);
  console.log(`   기간: ${Object.entries(byDur).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
  console.log(`   테마: ${Object.entries(byTheme).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
  console.log(`   지역: ${Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(" · ")}\n`);
}

main();
