const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync('lib/eventContents.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(mod.exports);
const { eventContentsText: text, eventContentsParagraphs: paragraphs } = mod.exports;
assert.equal(text('<!-- wp:paragraph --><p>첫 문단</p><!-- /wp:paragraph --><p>둘째<br>줄</p>'), '첫 문단\n\n둘째\n줄');
assert.equal(text('&amp;lt;p&amp;gt;안내&amp;lt;/p&amp;gt;'), '안내');
assert.equal(text('<script>alert(1)</script><style>body{}</style><p>안전한 안내</p>'), '안전한 안내');
assert.equal(text('A &amp; B &#x1F3A8; &#54620; &nbsp; &#99999999;'), 'A & B 🎨 한');
assert.equal(text('2 < 3, 5 > 4. 관람료 1,000원'), '2 < 3, 5 > 4. 관람료 1,000원');
assert.deepEqual(paragraphs(''), []);
assert.equal(text('<ul><li>첫 항목</li><li>둘째 항목</li></ul>'), '• 첫 항목\n\n• 둘째 항목');
const events = require('../data/events.json').events;
const example = events.find(e => e.id === '391098');
const result = paragraphs(example.contents);
assert.ok(result.length > 3);
assert.ok(!result.join('').includes('wp:paragraph'));
assert.equal(result.join(' ').replace(/\s/g, ''), text(example.contents).replace(/\s/g, ''));
for (const event of events.filter(e => e.contents)) {
  assert.ok(!/<!--|<\/?(?:p|div|br|script)\b/i.test(text(event.contents)), event.id);
}
console.log(JSON.stringify({ result: 'PASS', checked: events.filter(e => e.contents).length, exampleParagraphs: result.length }));
