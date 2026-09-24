const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join('.next', 'server', 'app');
const matches = [];
let pages = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith('.html') && !file.includes(`${path.sep}admin${path.sep}`) && !file.includes(`${path.sep}weekend-prep${path.sep}manage`)) {
      pages++;
      const html = fs.readFileSync(file, 'utf8');
      if (/link\.coupang\.com|waug\.com(?:\\\/|\/)r(?:\\\/|\/)|3ha\.in(?:\\\/|\/)r(?:\\\/|\/)|toss\.im(?:\\\/|\/)_m(?:\\\/|\/)/i.test(html) ||
        (file.endsWith(`${path.sep}index.html`) && /WEEKEND DEALS|오늘의 특가 소식/.test(html))) matches.push(file);
    }
  }
}
walk(root);
assert.deepEqual(matches, [], `Affiliate exposure remains in: ${matches.join(', ')}`);
console.log(`${pages} public HTML pages have no affiliate destinations`);
