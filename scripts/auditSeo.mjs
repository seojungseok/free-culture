import fs from 'node:fs';
import path from 'node:path';

// Read-only audit of every prerendered HTML page, or bounded HTTP samples.
const arg = process.argv.find(a => a.startsWith('--base='));
const base = arg?.slice(7);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] || '';
const clean = s => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
export function inspect(html, url) {
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
  const value = name => attr(meta.find(m => attr(m, 'name') === name || attr(m, 'property') === name) || '', 'content');
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]);
  const json = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m => {try { return JSON.parse(m[1]); } catch {return {'@type':'INVALID'};}});
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  return {url, title:clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''), description:value('description'), h1:[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => clean(m[1])), canonical:attr(links.find(m => attr(m,'rel') === 'canonical') || '', 'href'), robots:value('robots'), ogTitle:value('og:title'), ogUrl:value('og:url'), twitterTitle:value('twitter:title'), types:json.map(j=>j['@type']), images:imgs.length, missingAlt:imgs.filter(i=>!i.includes('alt=')).length, emptyAlt:imgs.filter(i=>attr(i,'alt')==='').length, bytes:Buffer.byteLength(html), ga:html.includes('googletagmanager.com/gtag/js')};
}
function files(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);}
const samples=['/','/region/seoul','/region/gyeonggi','/region/incheon','/region/busan','/region/jeju','/events','/event/374432','/places/spot/809490','/course/c/ulsan-nature-day-1uttc9i','/city-tour/b2c85d7e3f7c38','/camping','/food','/pet-travel','/season','/kids','/date','/weekend','/free','/traditional-market','/search?q=서울','/saved'];
const results=[];
if(base) {
 for(const route of samples){try {const start=Date.now();const r=await fetch(base+route,{signal:AbortSignal.timeout(20000)});const html=await r.text();results.push({...inspect(html,route),status:r.status,ms:Date.now()-start});}catch(e){results.push({url:route,error:e.name});}}
} else {
 for(const file of files('.next/server/app')) {results.push(inspect(fs.readFileSync(file,'utf8'),'/'+path.relative('.next/server/app',file).replaceAll('\\','/').replace(/\.html$/,'').replace(/^index$/,'')));}
}
const indexable=results.filter(r=>!r.error&&!r.robots?.includes('noindex')&&r.url!=='/_not-found');
const duplicate=(field)=>Object.entries(Object.groupBy(indexable,r=>r[field])).filter(([k,v])=>k&&v.length>1).map(([value,rows])=>({value,count:rows.length,urls:rows.slice(0,5).map(r=>r.url)}));
const summary={pages:results.length,indexable:indexable.length,missingCanonical:indexable.filter(r=>!r.canonical).map(r=>r.url),badH1:indexable.filter(r=>r.h1.length!==1).map(r=>r.url),missingDescription:indexable.filter(r=>!r.description).map(r=>r.url),duplicateTitles:duplicate('title'),duplicateDescriptions:duplicate('description'),duplicateTwitter:duplicate('twitterTitle').slice(0,5),invalidJson:results.filter(r=>r.types?.includes('INVALID')).map(r=>r.url),errors:results.filter(r=>r.error||r.status>=400)};
const out=process.argv.find(a=>a.startsWith('--out='))?.slice(6);
if(out)fs.writeFileSync(out,JSON.stringify({summary,results},null,2));
console.log(JSON.stringify(summary,null,2));
if(base)console.log(JSON.stringify(results,null,2));
