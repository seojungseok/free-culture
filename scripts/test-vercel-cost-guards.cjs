const assert=require('node:assert/strict');
const fs=require('node:fs');
const config=fs.readFileSync('next.config.mjs','utf8');
assert.match(config,/minimumCacheTTL:\s*2678400/,'image transformations stay cached for 31 days');
const widths=JSON.parse('['+config.match(/deviceSizes:\s*\[([^\]]+)\]/)[1]+']');
assert(Math.max(...widths)<=1200,'no oversized device transformations');
assert(!widths.some(width=>[1920,2048,3840].includes(width)),'expensive default widths stay disabled');
console.log(`PASS: 31-day image cache and ${widths.join(',')}px device widths`);
