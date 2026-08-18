// scripts/testCoupang.mjs
// 쿠팡 파트너스 오픈 API 키가 실제로 작동하는지(승인됐는지) 확인하는 테스트.
//   실행: node scripts/testCoupang.mjs
//   준비: .env.local 에 COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY 추가
//
// 성공하면 상품 몇 개가 출력됩니다. 실패하면 원인(인증/미승인 등)이 찍힙니다.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gate } from "./coupangThrottle.mjs";

// --- .env.local 직접 로드 (dotenv 없이) ---------------------------------
function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ 키가 없습니다. .env.local 에 아래 두 줄을 추가하세요:");
  console.error("   COUPANG_ACCESS_KEY=발급받은_액세스_키");
  console.error("   COUPANG_SECRET_KEY=발급받은_시크릿_키");
  process.exit(1);
}

const DOMAIN = "https://api-gateway.coupang.com";

// --- HMAC 서명 (쿠팡 CEA 방식) ------------------------------------------
function generateHmac(method, urlPathWithQuery) {
  const [path_, query = ""] = urlPathWithQuery.split("?");
  // yyMMdd'T'HHmmss'Z' (GMT) — toISOString은 UTC라 그대로 사용
  const datetime =
    new Date().toISOString().substr(2, 17).replace(/[-:]/g, "") + "Z";
  const message = datetime + method + path_ + query;
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message)
    .digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;
}

async function main() {
  const keyword = encodeURIComponent("캠핑의자");
  const urlPath =
    `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search` +
    `?keyword=${keyword}&limit=5`;

  const authorization = generateHmac("GET", urlPath);

  console.log("🔎 쿠팡 오픈 API 호출 중… (products/search, keyword=캠핑의자)\n");

  let res;
  try {
    await gate(); // 다른 스크립트와 동일하게 레이트리밋 게이트 통과 (예외 없이 전부)
    res = await fetch(DOMAIN + urlPath, {
      method: "GET",
      headers: { Authorization: authorization },
    });
  } catch (e) {
    console.error("❌ 네트워크 오류:", e.message);
    process.exit(1);
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  console.log(`HTTP ${res.status} ${res.statusText}`);

  if (res.ok && json?.data?.productData?.length) {
    console.log("\n✅ 성공! 오픈 API 작동합니다. 받은 상품:\n");
    for (const p of json.data.productData) {
      console.log(
        `  · ${p.productName}\n    ${p.productPrice}원 · 로켓배송:${p.isRocket ? "O" : "X"}`
      );
      console.log(`    이미지: ${p.productImage}`);
      console.log(`    링크: ${p.productUrl}\n`);
    }
    console.log("→ 다음 단계(수집 스크립트 + 카드 UI)로 진행 가능합니다.");
  } else {
    console.log("\n⚠️ 상품을 받지 못했습니다. 응답 원문:\n");
    console.log(text.slice(0, 1500));
    console.log("\n힌트:");
    console.log("  - 401/인증 오류  → 키 오타 또는 서명 문제");
    console.log("  - 권한/미승인    → 오픈 API(특히 상품검색) 미승인 상태일 수 있음");
    console.log("  - rParam/GATEWAY → 파트너스 계정에서 오픈 API 신청·승인 필요");
  }
}

main();
