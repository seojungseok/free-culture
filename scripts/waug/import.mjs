import fs from 'node:fs';
import path from 'node:path';

export function importLinks(db, text) {
  let added = 0;
  for (const match of text.matchAll(/^\|\s*([^|\n]+?)\s*\|\s*(https:\/\/www\.waug\.com\/r\/([A-Za-z0-9]+))\s*\|/gm)) {
    const [, name, affiliateUrl, id] = match;
    if (db.products.some(p => p.id === id)) continue;
    const outdoor = ['a1npVRlZ', '3ITSj4AU', 'rSGdfJXv'].includes(id);
    const water = ['9eBGFj06','5S3Va60e','zkLHNEae','tL8qi56O','MTumZ6ys','T4bCaTIz','z3R3IrOc','vM2xPeg7','srPdUMCN','DMB5JEsR','WEKUE1Co'].includes(id);
    db.products.push({ id, suppliedName: name.trim(), affiliateUrl, productId: null, detailUrl: null, actualName: null, placeId: null, branch: null, area: null, address: null, saleStatus: 'pending', eligibility: outdoor ? 'excluded' : 'pending', exclusionReason: outdoor ? '사용자 지정 실외 물놀이 제외' : null, waterReviewRequired: water, duplicateOf: null, articleSlug: null, scheduledAt: null, lastCheckedAt: null, createdAt: new Date().toISOString(), verification: null });
    added++;
  }
  // Preserve explicitly excluded affiliate codes to prevent re-registration.
  for (const [id, duplicateOf, name] of [['OuI5fLEv','coKARBau','신북온천 실내 바데풀'],['HFtOsjRX','srPdUMCN','수원 라이프스포츠'],['P8ro21BY','vF4Z6VsG','남이섬']]) {
    if (db.products.some(p => p.id === id)) continue;
    db.products.push({ id, suppliedName: name, affiliateUrl: `https://www.waug.com/r/${id}`, productId: null, detailUrl: null, actualName: null, placeId: null, branch: null, area: null, address: null, saleStatus: 'pending', eligibility: 'excluded', exclusionReason: '사용자 확인 동일 상품 중복', duplicateOf, articleSlug: null, scheduledAt: null, lastCheckedAt: null, createdAt: new Date().toISOString(), verification: null });
  }
  return added;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/waug/import.mjs')) {
  if (!process.argv[2]) throw new Error('사용법: node scripts/waug/import.mjs <Markdown 파일>');
  const file = 'data/waug/catalog.json';
  const db = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { version: 1, products: [] };
  const added = importLinks(db, fs.readFileSync(process.argv[2], 'utf8'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db, null, 2) + '\n');
  console.log(JSON.stringify({ added, total: db.products.length }));
}
