import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { factCheckGemini } from './lib/articleGen.mjs';
import { publicationBudget } from './lib/publication-budget.mjs';
import { isNewPublicationEnabled } from './lib/publication-policy.mjs';
import { withUsableOverview } from './lib/article-source.mjs';

test('independent review accepts only an explicit PASS and holds absent or malformed results', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [answer, expected] of [['{"result":"PASS"}', 'PASS'], ['{"result":"FAIL"}', 'FAIL'], ['{}', 'ERROR'], ['{"result":"unknown"}', 'ERROR'], ['bad json', 'ERROR']]) {
      globalThis.fetch = async () => ({ok:true,json:async()=>({candidates:[{content:{parts:[{text:answer}]}}]})});
      assert.equal((await factCheckGemini('본문', {apiKey:'test-only'})).result, expected);
    }
    assert.equal((await factCheckGemini('본문', {})).result, 'SKIP');
    globalThis.fetch = async () => { throw Error('network unavailable'); };
    assert.equal((await factCheckGemini('본문', {apiKey:'test-only'})).result, 'ERROR');
  } finally { globalThis.fetch = originalFetch; }
});

test('Korean-day budget counts prior published articles across the three general categories', () => {
  fs.mkdirSync('.cache', {recursive:true});
  const root=fs.mkdtempSync(path.resolve('.cache/publication-test-'));
  try {
    fs.mkdirSync(path.join(root,'data'));
    const save=(name,value)=>fs.writeFileSync(path.join(root,'data',name+'.json'),JSON.stringify(value));
    save('publication-policy',{general:{daily:5}});
    save('place-articles',{articles:{a:{status:'published',publishedAt:'2026-10-27T15:00:00Z'},old:{status:'published',publishedAt:'2026-10-27T14:59:59Z'},draft:{status:'draft',publishedAt:'2026-10-28T00:00:00Z'}}});
    save('course-articles',{articles:{b:{status:'published',publishedAt:'2026-10-28T00:00:00Z'}}});
    save('city-tour-articles',{articles:[{id:'c',publishedAt:'2026-10-28T00:00:00Z'}]});
    const actual=publicationBudget(root,new Date('2026-10-28T01:00:00Z'));
    assert.equal(actual.day,'2026-10-28');assert.equal(actual.published,3);assert.equal(actual.unreserved,2);
    save('course-articles',{articles:{b:{status:'published',publishedAt:'2026-10-28T00:00:00Z'},d:{status:'published',publishedAt:'2026-10-28T00:00:00Z'},e:{status:'published',publishedAt:'2026-10-28T00:00:00Z'},f:{status:'published',publishedAt:'2026-10-28T00:00:00Z'}}});
    assert.equal(publicationBudget(root,new Date('2026-10-28T01:00:00Z')).unreserved,0);
    assert.equal(isNewPublicationEnabled(root),false);
    fs.writeFileSync(path.join(root,'data','publication-policy.json'),'{broken');
    assert.equal(isNewPublicationEnabled(root),false);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test('missing independent verifier key fails without changing existing articles', () => {
  const filename=path.resolve('data/place-articles.json');
  const hash=()=>createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
  assert.equal(fs.existsSync('.env.local'),false,'test must not read local secrets');
  const before=hash();
  const env={...process.env,OPENAI_API_KEY:'test-only'};delete env.GEMINI_API_KEY;
  const child=spawnSync(process.execPath,['scripts/generateArticles.mjs'],{env,encoding:'utf8'});
  assert.equal(child.status,1);assert.match(child.stderr,/발행 보류/);assert.equal(hash(),before);
});

test('candidate selection skips missing or too short public source before spending generation attempts', () => {
  const places=[{id:'missing'},{id:'short'},{id:'enough'}];
  const cache={short:'<p>짧은 자료</p>',enough:`<p>${'가'.repeat(200)}</p>`};
  assert.deepEqual(withUsableOverview(places,cache).map(place=>place.id),['enough']);
});
