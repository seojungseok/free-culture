// Read-only release check. Example:
// node scripts/check-winter-release.mjs http://127.0.0.1:3106 --output docs/local-winter-release.json
// node scripts/check-winter-release.mjs https://mwohaji.kr --output docs/public-winter-release.json
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {load} from 'cheerio';
import {isPublicWinterCourse} from '../lib/winter-course-validation.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
const normalize=value=>String(value||'').replace(/\s+/g,' ').trim();
const hasType=(value,type)=>[value?.['@type']].flat().includes(type);
const sameDate=(a,b)=>Number.isFinite(Date.parse(a))&&Date.parse(a)===Date.parse(b);
const origin=value=>{
 const url=new URL(value);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Use a plain HTTP(S) origin without credentials, query, or path');
 return url.origin;
};

async function main(){
 const args=process.argv.slice(2);let baseArg,output;
 for(let i=0;i<args.length;i++){
  if(args[i]==='--output')output=args[++i];
  else if(args[i]==='--base')baseArg=args[++i];
  else if(args[i].startsWith('-')||baseArg)throw Error('Invalid arguments');
  else baseArg=args[i];
 }
 if(!baseArg)throw Error('A local or production base origin is required');
 const base=origin(baseArg);
 const siteSource=fs.readFileSync(path.join(ROOT,'lib/site.ts'),'utf8');
 const canonicalBase=origin(process.env.NEXT_PUBLIC_SITE_URL||siteSource.match(/url:\s*process\.env\.NEXT_PUBLIC_SITE_URL\s*\|\|\s*"([^"]+)"/)?.[1]||'https://mwohaji.kr');
 const outputFile=output?path.resolve(ROOT,output):null;
 if(outputFile&&!outputFile.startsWith(path.join(ROOT,'docs')+path.sep))throw Error('Output must be a file inside this repository docs directory');
 const daytrips=read('data/winter-courses.json').courses;
 const overnights=read('data/winter-overnight-courses.json').courses;
 const optionalCollections=['data/winter-metropolitan-daytrips.json','data/winter-metropolitan-overnights.json']
  .filter(file=>fs.existsSync(path.join(ROOT,file)))
  .map(file=>read(file).courses);
 if(!Array.isArray(daytrips)||!daytrips.length||!Array.isArray(overnights)||!overnights.length||optionalCollections.some(collection=>!Array.isArray(collection)))throw Error('Invalid winter course collections');
 const candidates=[...daytrips,...overnights,...optionalCollections.flat()];
 if(candidates.some(course=>course?.status==='published'&&!isPublicWinterCourse(course)))throw Error('A published winter course failed visibility validation');
 const courses=candidates.filter(course=>isPublicWinterCourse(course));
 const coursePhotos=course=>[...new Map(course.stops.flatMap(stop=>[stop.photo,...(stop.gallery||[])]).filter(Boolean).map(photo=>[photo.src,photo])).values()];
 const retired=read('data/winter-retired-slugs.json').slugs;
 const livePaths=courses.map(course=>'/winter-travel/'+course.slug);
 const oldPaths=retired.map(slug=>'/winter-travel/'+slug);
 const photos=[...new Set(courses.flatMap(course=>coursePhotos(course).map(photo=>photo.src)))];
 const representativePaths=['/','/events','/festivals','/places','/food','/camping','/pet-travel','/course'];
 if(!courses.length||new Set(livePaths).size!==courses.length||new Set(oldPaths).size!==oldPaths.length||!photos.length||oldPaths.some(url=>livePaths.includes(url)))throw Error('Invalid, duplicate, or retired winter course paths');
 if([...livePaths,...oldPaths].some(value=>!/^\/winter-travel\/[a-z0-9-]+$/.test(value))||photos.some(value=>!/^\/winter-photos\/[A-Za-z0-9._-]+\.webp$/.test(value)))throw Error('Unexpected local release path');
 const started=Date.now(),results=[];
 let requestCount=0;
 async function request(route,kind='html'){
  requestCount++;
  const response=await fetch(base+route,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'user-agent':'mwohaji-release-check/1.0','accept':kind==='image'?'image/webp':'text/html,application/xml;q=0.9,*/*;q=0.5'}});
  const type=response.headers.get('content-type')||'';
  if(kind==='image'){
   const bytes=new Uint8Array(await response.arrayBuffer());
   const magic=bytes.length>=12&&Buffer.from(bytes.subarray(0,4)).toString()==='RIFF'&&Buffer.from(bytes.subarray(8,12)).toString()==='WEBP';
   return {status:response.status,type,magic,bytes:bytes.length};
  }
  return {status:response.status,type,body:await response.text()};
 }
 function jsonLd($){
  const objects=[];let malformed=0;
  function visit(value){if(Array.isArray(value))return value.forEach(visit);if(value&&typeof value==='object'){objects.push(value);if(value['@graph'])visit(value['@graph']);}}
  $('script[type="application/ld+json"]').each((_,node)=>{try{visit(JSON.parse($(node).text()));}catch{malformed++;}});
  return {objects,malformed};
 }
 function absolute(value){try{return new URL(value,canonicalBase).href;}catch{return '';}}
 function add(group,route,checks,status){results.push({group,path:route,status,passed:Object.values(checks).every(Boolean),failedChecks:Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name)});}
 const jobs=[
  {group:'hub',path:'/winter-travel',run:async()=>{
   const r=await request('/winter-travel'),$=load(r.body);
   const links=[...new Set($('[data-winter-cards] a[href]').map((_,node)=>$(node).attr('href')).get())];
   const {objects,malformed}=jsonLd($),list=objects.find(item=>hasType(item,'ItemList'));
   add('hub','/winter-travel',{http200:r.status===200,h1:$('h1').length===1,canonical:$("link[rel='canonical']").attr('href')===canonicalBase+'/winter-travel',allServerRenderedCards:links.length===courses.length&&livePaths.every(route=>links.includes(route)),durationFilters:$('[aria-label="겨울 여행 일정"] button').length===3,noRetiredLinks:oldPaths.every(route=>!links.includes(route)),validJsonLd:malformed===0,itemListMatchesCourses:list?.numberOfItems===courses.length&&list.itemListElement?.length===courses.length},r.status);
  }},
  ...courses.map(course=>({group:'articles',path:'/winter-travel/'+course.slug,run:async()=>{
   const route='/winter-travel/'+course.slug,r=await request(route),$=load(r.body),{objects,malformed}=jsonLd($);
   const articles=objects.filter(item=>hasType(item,'Article')),article=articles[0];
   const expectedImages=coursePhotos(course).map(photo=>absolute(photo.src));
   const minimumPhotos=course.validation?.version===4?2:3;
   const articleImages=[article?.image].flat().filter(Boolean).map(value=>absolute(typeof value==='string'?value:value.url||value.contentUrl));
   const bodyImages=new Set($('img[src]').map((_,node)=>absolute($(node).attr('src'))).get());
   const canonical=canonicalBase+route;
   add('articles',route,{http200:r.status===200,h1:$('h1').length===1&&normalize($('h1').text())===normalize(course.title),canonical:$("link[rel='canonical']").length===1&&$("link[rel='canonical']").attr('href')===canonical,validJsonLd:malformed===0,oneArticle:articles.length===1,articleHeadline:article?.headline===course.title,articleCanonical:article?.url===canonical&&article?.mainEntityOfPage===canonical,reviewedArticlePhotos:articleImages.length===expectedImages.length&&new Set(articleImages).size>=minimumPhotos&&expectedImages.every(url=>articleImages.includes(url)),reviewedBodyPhotos:expectedImages.every(url=>bodyImages.has(url)),dayPlan:course.duration==='당일'||($('[aria-label="1박 2일 코스 순서"] h3').length===2&&$('body').text().includes(course.overnightArea)),datePublished:sameDate(article?.datePublished,course.publishedAt),dateModified:sameDate(article?.dateModified,course.updatedAt||course.publishedAt)},r.status);
  }})),
  ...oldPaths.map(route=>({group:'retired',path:route,run:async()=>{const r=await request(route);add('retired',route,{http404:r.status===404},r.status);}})),
  {group:'sitemap',path:'/sitemap.xml',run:async()=>{
   const r=await request('/sitemap.xml'),$=load(r.body,{xmlMode:true}),urls=$('url > loc').map((_,node)=>$(node).text()).get(),set=new Set(urls);
   const winter=urls.filter(url=>new URL(url).pathname.startsWith('/winter-travel/'));
   add('sitemap','/sitemap.xml',{http200:r.status===200,uniqueUrls:set.size===urls.length,allWinterArticles:winter.length===courses.length&&livePaths.every(route=>set.has(canonicalBase+route)),noRetiredArticles:oldPaths.every(route=>!set.has(canonicalBase+route)),winterHub:set.has(canonicalBase+'/winter-travel')},r.status);
  }},
  ...photos.map(route=>({group:'photos',path:route,run:async()=>{const r=await request(route,'image');add('photos',route,{http200:r.status===200,webpContentType:/^image\/webp(?:;|$)/i.test(r.type),webpSignature:r.magic},r.status);}})),
  ...representativePaths.map(route=>({group:'existingPages',path:route,run:async()=>{const r=await request(route);add('existingPages',route,{http200:r.status===200},r.status);}})),
 ];
 let index=0;
 // Two concurrent reads at most; no provider API calls, retries, or mutations.
 await Promise.all(Array.from({length:2},async()=>{while(index<jobs.length){const job=jobs[index++];try{await job.run();}catch(error){add(job.group,job.path,{[error?.name==='TimeoutError'?'requestTimeout':'requestOrParseFailed']:false},null);}}}));
 const groups={};
 for(const row of results){const group=groups[row.group]??={total:0,passed:0,failed:0};group.total++;group[row.passed?'passed':'failed']++;}
 const summary={passed:results.every(row=>row.passed),checkedAt:new Date().toISOString(),base,canonicalBase,durationMs:Date.now()-started,concurrency:2,requests:requestCount,groups,failures:results.filter(row=>!row.passed).map(({group,path,status,failedChecks})=>({group,path,status,failedChecks}))};
 if(outputFile){fs.mkdirSync(path.dirname(outputFile),{recursive:true});fs.writeFileSync(outputFile,JSON.stringify(summary,null,2)+'\n');}
 console.log(JSON.stringify(summary));
 if(!summary.passed)process.exitCode=1;
}

main().catch(()=>{console.log(JSON.stringify({passed:false,error:'Release checker could not start; verify arguments, repository data, and dependencies.'}));process.exitCode=1;});
