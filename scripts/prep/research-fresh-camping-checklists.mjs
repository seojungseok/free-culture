import fs from 'node:fs';
import {coupangFetch} from './coupang.mjs';
import {affiliateUrl} from './content.mjs';
import {loadRuntimeEnv} from './runtime-env.mjs';

const envFile = process.env.PREP_ENV_FILE;
if (envFile && fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}
loadRuntimeEnv({localGit: true});

const output = 'data/weekend-prep-fresh-cooking-research.json';
const report = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : {version: 1, createdAt: new Date().toISOString(), records: []};
const queries = [
  ['pollack-roe-soup', '명란 알탕 밀키트'],
  ['shrimp', '냉동 새우살'],
  ['curry', '카레가루'],
  ['doenjang', '된장찌개 된장'],
  ['pork-neck', '국내산 목살 구이용'],
  ['sweet-potato', '호박고구마'],
  ['bagel', '플레인 베이글'],
  ['corn', '스위트콘 캔'],
];

for (const [key, keyword] of queries) {
  if (report.records.some(record => record.key === key)) continue;
  const url = new URL('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search');
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('limit', '1');
  const response = await coupangFetch(url.toString());
  if (!response.ok) throw Error(`쿠팡 조회 HTTP ${response.status}; 반복 호출 중지`);
  const data = await response.json();
  if (data.rCode && data.rCode !== '0') throw Error(`쿠팡 응답 코드 ${data.rCode}; 반복 호출 중지`);
  const found = data.data?.productData?.[0];
  const candidate = found ? {id: String(found.productId), name: found.productName, image: found.productImage, affiliateUrl: found.productUrl, source: `https://www.coupang.com/vp/products/${found.productId}`, checkedAt: new Date().toISOString(), verified: false} : null;
  report.records.push({key, keyword, queriedAt: new Date().toISOString(), fromCache: response.headers.get('X-Prep-Cache') === 'hit', status: !candidate ? 'no-result' : !affiliateUrl(candidate.affiliateUrl) ? 'invalid-affiliate-link' : 'needs-photo-option-review', candidate});
  fs.writeFileSync(output, `${JSON.stringify({...report, updatedAt: new Date().toISOString()}, null, 2)}\n`);
  console.log(`${key}: ${candidate?.id || 'no-result'}`);
}
