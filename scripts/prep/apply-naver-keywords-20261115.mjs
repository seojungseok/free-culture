import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const file = 'data/weekend-prep.json';
const before = JSON.parse(await fs.readFile(file,'utf8'));
const plan = JSON.parse(await fs.readFile('data/camping-naver-keywords-20261115.json','utf8'));
if(plan.entries.every(entry=>before.articles.some(article=>article.slug===entry.slug&&article.title===entry.title&&article.description===entry.description&&(!entry.dishName||article.dishName===entry.dishName)))){
  console.log('The reviewed search copy is already applied; publication and update dates were left unchanged.');
  process.exit(0);
}
const research = JSON.parse(await fs.readFile('output/camping-naver-20261115/naver-autocomplete.json','utf8'));
const after = structuredClone(before);
const changedAt = new Date().toISOString();
const published = before.articles.filter(article=>article.status==='published');
assert.equal(plan.entries.length,published.length);
assert.equal(new Set(plan.entries.map(entry=>entry.slug)).size,plan.entries.length);
const report=[];
for (const entry of plan.entries) {
  const article=after.articles.find(article=>article.slug===entry.slug);
  assert(article?.status==='published',entry.slug);
  assert(entry.title.length<=32,entry.slug+' title');
  assert(entry.description.length<=80,entry.slug+' description');
  const evidence=research.results.find(result=>result.seed===entry.seed);
  assert(evidence&&!evidence.error&&evidence.suggestions.length,entry.slug+' needs observed autocomplete wording');
  report.push({slug:entry.slug,intent:entry.intent,seed:entry.seed,beforeTitle:article.title,title:entry.title,description:entry.description,observedSuggestions:evidence.suggestions});
  article.title=entry.title;
  article.description=entry.description;
  article.updatedAt=changedAt;
  if(entry.dishName)article.dishName=entry.dishName;
}
// Verify only search-facing copy and the independent dish label changed.
for(let index=0;index<before.articles.length;index++){
  const old=before.articles[index],updated=after.articles[index];
  for(const [key,value] of Object.entries(old)){
    if(['title','description','updatedAt'].includes(key))continue;
    assert.deepEqual(updated[key],value,old.slug+' / '+key);
  }
}
await fs.mkdir('output/camping-naver-20261115',{recursive:true});
await fs.writeFile('output/camping-naver-20261115/baseline.json',JSON.stringify(before,null,2)+'\n');
await fs.writeFile(file,JSON.stringify(after,null,2)+'\n');
await fs.writeFile('data/camping-naver-research-20261115.json',JSON.stringify({...research,scope:'Public autocomplete wording, not measured query volume or rankings',officialGuidance:['https://searchadvisor.naver.com/guide/markup-content','https://searchadvisor.naver.com/guide/diagnose-site','https://searchadvisor.naver.com/guide/content-basic']},null,2)+'\n');
await fs.writeFile('output/camping-naver-20261115/title-review.json',JSON.stringify({changedAt,articleCount:report.length,report},null,2)+'\n');
console.log(JSON.stringify({articlesUpdated:report.length,changedAt,maxTitleLength:Math.max(...report.map(entry=>entry.title.length)),maxDescriptionLength:Math.max(...report.map(entry=>entry.description.length))}));
