import fs from 'node:fs';
import {loadRuntimeEnv} from './runtime-env.mjs';
import {coupangFetch} from './coupang.mjs';
import {affiliateUrl} from './content.mjs';

loadRuntimeEnv({localGit: !process.env.GITHUB_ACTIONS});

const plan = JSON.parse(fs.readFileSync('data/weekend-prep-sales-research-plan.json', 'utf8'));
const output = 'data/weekend-prep-sales-research.json';
const report = fs.existsSync(output)
  ? JSON.parse(fs.readFileSync(output, 'utf8'))
  : {version: 1, createdAt: new Date().toISOString(), records: []};
const limit = Math.min(10, Math.max(1, Number(process.env.PREP_RESEARCH_LIMIT) || 10));
let attempts = 0;

function save() {
  fs.writeFileSync(output, `${JSON.stringify({...report, updatedAt: new Date().toISOString()}, null, 2)}\n`);
}

for (const topic of plan.topics) {
  for (const keyword of topic.keywords) {
    if (report.records.some((record) => record.slug === topic.slug && record.keyword === keyword)) continue;
    if (attempts >= limit) break;
    attempts += 1;
    const url = new URL('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search');
    url.searchParams.set('keyword', keyword);
    url.searchParams.set('limit', '1');
    const response = await coupangFetch(url.toString());
    if (!response.ok) throw new Error(`쿠팡 조회 HTTP ${response.status}; 반복 호출 중지`);
    const data = await response.json();
    if (data.rCode && data.rCode !== '0') throw new Error(`쿠팡 응답 코드 ${data.rCode}; 반복 호출 중지`);
    const found = data.data?.productData?.[0];
    const candidate = found ? {
      id: String(found.productId),
      name: found.productName,
      image: found.productImage,
      affiliateUrl: found.productUrl,
      source: `https://www.coupang.com/vp/products/${found.productId}`,
      checkedAt: new Date().toISOString(),
      verified: false
    } : null;
    report.records.push({
      slug: topic.slug,
      category: topic.category,
      keyword,
      queriedAt: new Date().toISOString(),
      fromCache: response.headers.get('X-Prep-Cache') === 'hit',
      status: !candidate ? 'no-result' : !affiliateUrl(candidate.affiliateUrl) ? 'invalid-affiliate-link' : 'needs-photo-option-review',
      candidate
    });
    save();
    console.log(`${keyword}: ${candidate?.name || '결과 없음'}`);
  }
}

console.log(`저장된 후보 ${report.records.length}개. 실제 API 호출 시 공용 제한 기록을 사용했습니다.`);
