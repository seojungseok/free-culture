const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');

// Load the same course IDs as the production route without creating another list.
const modules = new Map();
function load(file) {
  file = path.resolve(file);
  if (!path.extname(file)) file += ['.ts', '.tsx', '.js'].find((ext) => fs.existsSync(file + ext)) || '.ts';
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const local = (name) => name === 'server-only' ? {} : name.startsWith('@/') ? load(name.slice(2))
    : name.startsWith('.') ? load(path.resolve(path.dirname(file), name)) : require(name);
  new Function('exports', 'module', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText)(module.exports, module, local);
  return module.exports;
}

const courses = load('lib/kidCourses').getKidCourses();
const base = process.argv[2] || 'http://127.0.0.1:3027';
const decode = (text) => text.replace(/<[^>]+>/g, ' ').replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (entity) => ({
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'",
}[entity] || entity)).replace(/\s+/g, ' ').trim();
const paragraphs = (body, marker) => [...body.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)]
  .filter((match) => new RegExp(`\\b${marker}(?:\\s|=|$)`).test(match[1]))
  .map((match) => decode(match[2])).filter(Boolean);
const sentences = (values) => values.flatMap((value) => value.split(/(?<=[.!?。])\s+|\n+/))
  .map((value) => value.trim()).filter(Boolean);
const signature = (sentence, course) => {
  let text = sentence.toLowerCase();
  for (const value of [course.spot.title, course.park?.title, course.food?.title,
    course.spot.addr, course.park?.addr, course.food?.addr].filter(Boolean)) {
    text = text.replaceAll(value.toLowerCase(), '장소');
  }
  return text.replace(/\d+(?:[.,]\d+)?\s*(?:km|m|분|시간)?/gi, '수치').replace(/\s+/g, ' ').trim();
};
async function fetchCourse(course) {
  const route = `/kids/c/${encodeURIComponent(course.id)}`;
  const response = await fetch(base + route, { signal: AbortSignal.timeout(30000), redirect: 'manual' });
  assert.equal(response.status, 200, route);
  const html = await response.text();
  const body = html.match(/<article\b[^>]*data-kid-course-content[^>]*>([\s\S]*?)<\/article>/)?.[1];
  assert(body, `${route} missing article body`);
  const intro = paragraphs(body, 'data-kid-intro');
  const routeText = paragraphs(body, 'data-kid-route');
  const descriptions = paragraphs(body, 'data-kid-stop-description');
  const facts = paragraphs(body, 'data-kid-stop-fact');
  const stopCount = [...body.matchAll(/<section\b[^>]*data-kid-stop(?:\s|=|>)/g)].length;
  assert(stopCount >= 2 && stopCount <= 3, `${route} invalid stop count`);
  const narrative = [...intro, ...descriptions, ...routeText];
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/)?.[1] || '';
  return { course, route, intro, routeText, descriptions, facts, stopCount, narrative, robots };
}

(async () => {
  const documents = new Array(courses.length);
  let next = 0;
  let done = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (next < courses.length) {
      const index = next++;
      documents[index] = await fetchCourse(courses[index]);
      done++;
      if (done % 200 === 0) console.error(`rendered ${done}/${courses.length}`);
    }
  }));

  const frequency = new Map();
  for (const doc of documents) {
    for (const key of new Set(sentences(doc.narrative).map((sentence) => signature(sentence, doc.course)))) {
      frequency.set(key, (frequency.get(key) || 0) + 1);
    }
  }
  const sitemapResponse = await fetch(base + '/sitemap.xml', { signal: AbortSignal.timeout(30000) });
  assert.equal(sitemapResponse.status, 200, 'sitemap');
  const sitemap = await sitemapResponse.text();
  const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname));
  const results = documents.map((doc) => {
    const prose = sentences(doc.narrative).map((text) => ({ text, repeated: (frequency.get(signature(text, doc.course)) || 0) > 1 }));
    const allChars = prose.reduce((sum, sentence) => sum + sentence.text.length, 0);
    const repeatedChars = prose.filter((sentence) => sentence.repeated).reduce((sum, sentence) => sum + sentence.text.length, 0);
    const uniqueChars = allChars - repeatedChars;
    const repeatedRatio = allChars ? repeatedChars / allChars : 0;
    const factChars = [...doc.facts, doc.course.spot.title, doc.course.park?.title, doc.course.food?.title]
      .filter(Boolean).join(' ').length;
    const failures = {
      shortUniqueDescription: uniqueChars < 300,
      missingIntroduction: doc.intro.length === 0,
      missingStopDescriptions: doc.descriptions.length < doc.stopCount,
      mostlyNamesAddressesDistances: doc.stopCount === 3 && allChars < factChars,
      repeatedTemplateAtLeast70Percent: allChars > 0 && repeatedRatio >= 0.7,
      missingRouteExplanation: doc.routeText.length === 0,
    };
    const noindex = Object.values(failures).filter(Boolean).length >= 2 ||
      uniqueChars < 300 || !doc.intro.length || doc.descriptions.length < doc.stopCount ||
      !doc.routeText.length || (allChars > 0 && repeatedRatio >= 0.7);
    assert.equal(/\bnoindex\b/i.test(doc.robots), noindex, `${doc.route} robots mismatch`);
    assert.equal(listed.has(doc.route), !noindex, `${doc.route} sitemap mismatch`);
    return { url: `https://mwohaji.kr${doc.route}`, noindex, uniqueChars, repeatedRatio, failures };
  });
  const hub = await fetch(base + '/kids', { signal: AbortSignal.timeout(30000) });
  assert.equal(hub.status, 200, '/kids');
  assert(!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(await hub.text()), '/kids hub noindex');
  assert(listed.has('/kids'), '/kids hub missing from sitemap');
  const noindexed = results.filter((item) => item.noindex);
  const sample = Array.from({ length: 10 }, (_, index) => noindexed[Math.floor(index * (noindexed.length - 1) / 9)]?.url).filter(Boolean);
  assert.equal(sample.length, 10, 'Ten noindex samples required');
  console.log(JSON.stringify({ total: results.length, noindex: noindexed.length, index: results.length - noindexed.length,
    sitemapExcluded: noindexed.filter((item) => !listed.has(new URL(item.url).pathname)).length,
    samples: sample, failureCounts: Object.fromEntries(Object.keys(results[0].failures).map((key) =>
      [key, results.filter((item) => item.failures[key]).length])), hubIndex: true }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
