// TourAPI(일 1,000회 공유) 일일 예산 자동 배분 — 완전 무인 운영용.
//  우선순위: 음식점 영업정보(RIN) → 방문팁(intro) → 볼거리(info).
//  RIN이 남아있으면 현행(RIN 500 / intro 250 / info 150) 유지.
//  RIN이 완주(미수집↓)되면 남는 예산을 intro·info로 자동 이관 → 손 안 대도 다음으로 넘어감.
//
//  envelope(축제·목록·글overview 제외한 세 수집의 합) = 900. festivals(100)와 합쳐 ≈1,000.
//  결과를 GITHUB_OUTPUT(rin_daily·intro_daily·info_daily)으로 내보냄. daily.yml이 이 값을 캡으로 사용.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f, fb) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "data", f), "utf8")); } catch { return fb; } };

// 각 수집의 "미수집 남은 개수"
const restaurants = read("restaurants.json", { restaurants: [] }).restaurants || [];
const rIntro = read("restaurant-intro.json", { intro: {} }).intro || {};
const rinRemaining = restaurants.filter((r) => !(r.id in rIntro)).length;

const places = read("places.json", { spots: [] }).spots || [];
const pIntro = read("place-intro.json", { intro: {} }).intro || {};
const pInfoRaw = read("place-info.json", {});
const pInfo = pInfoRaw.info || pInfoRaw;
const introRemaining = places.filter((p) => !(p.id in pIntro)).length;
const infoRemaining = places.filter((p) => !(p.id in pInfo)).length;

// 기본 배분(현행) + RIN이 덜 쓰는 만큼(freed)을 intro·info로 이관(60:40)
const RIN_BASE = 500, INTRO_BASE = 250, INFO_BASE = 150; // 합 900

const rin = Math.min(RIN_BASE, rinRemaining);
const freed = RIN_BASE - rin; // RIN 완주에 가까울수록 커짐

const introWant = INTRO_BASE + Math.round(freed * 0.6);
const intro = Math.min(introWant, introRemaining);
const introLeftover = introWant - intro; // intro도 완주면 그 몫까지 info로

const infoWant = INFO_BASE + Math.round(freed * 0.4) + introLeftover;
const info = Math.min(infoWant, infoRemaining);

const out = process.env.GITHUB_OUTPUT;
const lines = `rin_daily=${rin}\nintro_daily=${intro}\ninfo_daily=${info}\n`;
if (out) fs.appendFileSync(out, lines);

console.log("📊 TourAPI 예산 자동 배분");
console.log(`   미수집 — 음식점영업(RIN) ${rinRemaining} · 방문팁 ${introRemaining} · 볼거리 ${infoRemaining}`);
console.log(`   오늘 배분 — RIN ${rin} · 방문팁 ${intro} · 볼거리 ${info} (합 ${rin + intro + info} + 축제 100 ≈ ${rin + intro + info + 100})`);
if (freed > 0) console.log(`   ♻ RIN 여유분 ${freed} → 방문팁·볼거리로 자동 이관`);
