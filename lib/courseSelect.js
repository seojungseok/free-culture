// lib/courseSelect.js
// 여행코스 "관광지 선별" 단일 규칙 — 앱(lib/courses.ts)과 생성 스크립트(scripts/*.mjs)가 **같은 모듈**을 공유한다.
// 예전엔 같은 규칙을 세 곳(lib/courses.ts · articleGen.mjs · buildCourses.mjs)에 각각 적어두어
// 값이 서로 어긋났고(4/6/9 vs 3/5/6), 그래서 "하루 최대 3곳"이 지켜지지 않았다. 이 파일이 유일한 출처다.
//
// 규칙
//   ① 식당·카페 스팟은 동선에서 제외(페이지 '근처 맛집'으로 안내)
//   ② 기간별 상한: 당일 3곳 · 1박2일 6곳 · 2박3일 7곳  = 하루 최대 3곳
//   ③ 상한을 넘으면 그냥 앞에서 자르지 않고 **동선 최적화**로 고른다.
//      좌표가 있는 코스(자동 조합)는 첫 스팟(대표)에서 최근접 이웃으로 이어붙여 이동거리가 가장 짧은 조합을 남긴다.
//      좌표가 없는 코스(정부 공식)는 큐레이션 순서가 곧 동선이라 앞에서부터 상한만큼.
//   ④ 일차 분배는 균등하게: 2박3일 7곳 → 3·2·2 (예전 ceil 방식은 3·3·1로 마지막 날이 텅 비었다)

/** 기간별 관광지 상한 (식당 제외 기준). "베스트"(리스트형)는 상한 없음. */
export const COURSE_ATT_CAP = { "당일": 3, "1박2일": 6, "2박3일": 7 };
/** 기간별 일수 */
export const COURSE_DAY_COUNT = { "당일": 1, "1박2일": 2, "2박3일": 3 };
/** 하루에 배치할 수 있는 최대 관광지 수 */
export const COURSE_MAX_PER_DAY = 3;
/**
 * 선별 규칙 버전 — 규칙이 바뀌면 올린다.
 * 이미 발행된 글은 이 버전 도장이 없으면 generateCourses가 다시 점검해
 * (상한을 지키면 도장만, 어기면 재생성 큐로) 글과 페이지를 다시 일치시킨다.
 */
export const COURSE_CAP_VERSION = 3;

/** 식당/카페 판별 — 이름 + 소개 앞부분 키워드 */
const FOOD_RE = /횟집|식당|맛집|푸줏간|고기집|한정식|정식|국밥|국수|갈비|막국수|분식|카페|찻집|베이커리|빵집|커피|치킨|피자|해장|먹거리/;

/**
 * @param {{name?: string, overview?: string}} s
 * @returns {boolean}
 */
export function isCourseFoodStop(s) {
  return FOOD_RE.test(`${(s && s.name) || ""} ${String((s && s.overview) || "").slice(0, 80)}`);
}

/**
 * 스팟 좌표 (없으면 null)
 * @param {{mapx?: string|number, mapy?: string|number}} s
 * @returns {{x: number, y: number} | null}
 */
function coordOf(s) {
  const x = parseFloat(String((s && s.mapx) || ""));
  const y = parseFloat(String((s && s.mapy) || ""));
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

/** 두 좌표 사이 대략 거리(km) — 순위 비교용이라 등거리 근사로 충분 */
function kmBetween(a, b) {
  const dx = (a.x - b.x) * 88.9; // 경도 1도 ≈ 88.9km (위도 36° 기준)
  const dy = (a.y - b.y) * 111;  // 위도 1도 ≈ 111km
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 글·페이지에 실제로 노출할 관광지 목록.
 * 식당 제외 → 기간별 상한 적용(초과 시 동선 최적화로 선별·정렬).
 * @template {{name?: string, overview?: string, mapx?: string|number, mapy?: string|number}} T
 * @param {{duration?: string, stops?: T[]}} course
 * @returns {T[]}
 */
export function selectCourseStops(course) {
  const atts = ((course && course.stops) || []).filter((s) => !isCourseFoodStop(s));
  const cap = COURSE_ATT_CAP[(course && course.duration) || ""];
  if (!cap || atts.length <= cap) return atts;

  const pts = atts.map(coordOf);
  if (pts.some((p) => !p)) return atts.slice(0, cap); // 좌표 없음(공식 코스) — 큐레이션 순서 유지

  // 최근접 이웃: 대표 스팟(0번)에서 출발해 가장 가까운 곳으로 계속 이어붙인다.
  // → 상한만큼 잘라도 "멀리 떨어진 한 곳 때문에 하루가 무너지는" 조합이 남지 않는다.
  const picked = [0];
  const used = new Set([0]);
  while (picked.length < cap) {
    const cur = /** @type {{x:number,y:number}} */ (pts[picked[picked.length - 1]]);
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < atts.length; i++) {
      if (used.has(i)) continue;
      const d = kmBetween(cur, /** @type {{x:number,y:number}} */ (pts[i]));
      if (d < bestD) { bestD = d; best = i; } // 동률이면 먼저 나온(원본 순서 앞) 스팟 — 결정적
    }
    if (best < 0) break;
    used.add(best);
    picked.push(best);
  }
  return picked.map((i) => atts[i]);
}

/**
 * 선별된 관광지를 일차별로 균등 분배. (당일=1일, 1박2일=2일, 2박3일=3일 / 하루 최대 3곳)
 * @template T
 * @param {T[]} stops
 * @param {string} duration
 * @returns {T[][]}
 */
export function splitCourseDays(stops, duration) {
  const list = stops || [];
  const days = COURSE_DAY_COUNT[duration] || 1;
  if (!list.length) return [];
  if (days <= 1) return [list];
  const base = Math.floor(list.length / days);
  const rem = list.length % days;
  const out = [];
  let i = 0;
  for (let d = 0; d < days; d++) {
    const n = base + (d < rem ? 1 : 0); // 앞 일차부터 한 곳씩 더 — 7곳/3일 → 3·2·2
    if (n > 0) out.push(list.slice(i, i + n));
    i += n;
  }
  return out;
}
