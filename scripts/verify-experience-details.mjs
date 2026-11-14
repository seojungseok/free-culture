// Read-only HTML/asset checks. This never follows an application, affiliate or public-data API.
import fs from 'node:fs';
import {load} from 'cheerio';
const base=process.env.VERIFY_BASE||'http://127.0.0.1:3317',full=process.env.VERIFY_FULL==='1',results=[];
const read=file=>JSON.parse(fs.readFileSync('data/'+file,'utf8'));
const check=(condition,message)=>{if(!condition)throw new Error(message);};
const sources=['rural','youth','science'].flatMap(kind=>read(kind+'-experiences.json').records.map(row=>({path:`/experiences/${kind==='youth'?'family':kind}/${row.id}`,title:row.title,kind:kind==='youth'?'family':kind,active:row.active!==false,address:row.address||'',content:[...(row.content||[]),...(row.activities||[])]})));
const expected=full?sources:sources.filter(row=>row.active).filter((row,index,list)=>list.filter(other=>other.kind===row.kind).indexOf(row)<12);
const classes=read('learning-classes.json').courses.slice(0,12).map(row=>({path:'/classes/detail/'+row.id,title:row.title,kind:'class',active:true}));
const access=Object.values(read('accessible-travel.json').places).slice(0,full?100:8).map(row=>({path:'/accessible-travel/'+row.id,title:row.title,kind:'access',active:true}));
const indexedTitles=new Map(),indexedDescriptions=new Map();let maxHtmlBytes=0;
async function html(path){const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(45000)});check(response.ok,'HTTP '+response.status);const text=await response.text();maxHtmlBytes=Math.max(maxHtmlBytes,Buffer.byteLength(text));return load(text);}
async function detail(row){
 try{
  const $=await html(row.path),title=$('title').text(),description=$('meta[name=description]').attr('content')||'',canonical=new URL($('link[rel=canonical]').attr('href')).pathname;
  check($('h1').length===1&&$('h1').text()===row.title,'Wrong or duplicate H1');check(canonical===row.path,'Canonical mismatch');check(description.length>=15,'Description missing');
  const detail=$('[data-experience-detail],[data-public-program-detail]');check(detail.length===1&&detail.find('h2').length>=3,'Internal body missing');
  const schemas=$('script[type="application/ld+json"]').map((_,node)=>JSON.parse($(node).text())).get();check(schemas.some(schema=>schema['@graph']?.some(entity=>entity['@type']==='BreadcrumbList')),'Breadcrumb missing');check(schemas.some(schema=>schema['@graph']?.some(entity=>entity['@type']==='WebPage')),'WebPage schema missing');
  if(['family','science','rural'].includes(row.kind))check(schemas.some(schema=>schema['@graph']?.some(entity=>['Event','EducationEvent','TouristAttraction'].includes(entity['@type']))),'Main entity missing');
  if(row.kind==='family')for(const paragraph of row.content.slice(0,2))check(detail.text().includes(paragraph),'Detailed API content missing');
  if(row.address)check(detail.text().includes(row.address),'Address missing');
  for(const a of $('[data-experience-card] a').toArray())check($(a).attr('href')?.startsWith('/experiences/'),'Related card leaves the site');
  for(const a of $('[data-external-application]').toArray())check(/^https?:\/\//.test($(a).attr('href')||'')&&$(a).attr('target')==='_blank','Application should open official external site');
  const noindex=($('meta[name=robots]').attr('content')||'').includes('noindex');
  if(!row.active)check(noindex,'Archived page indexes as current');
  if(!noindex){check(!indexedTitles.has(title),'Duplicate indexable title: '+indexedTitles.get(title));check(!indexedDescriptions.has(description),'Duplicate indexable description: '+indexedDescriptions.get(description));indexedTitles.set(title,row.path);indexedDescriptions.set(description,row.path);}
  results.push({path:row.path,ok:true,indexed:!noindex});
 }catch(error){results.push({path:row.path,ok:false,error:error.message});}
}
const tasks=[...expected,...classes,...access];let cursor=0;
await Promise.all(Array.from({length:full?4:2},async()=>{while(cursor<tasks.length){const item=tasks[cursor++];await detail(item);if(results.length%200===0)console.log(JSON.stringify({checked:results.length,failures:results.filter(result=>!result.ok).length}));}}));
const areas=['seoul','busan','daegu','incheon','gwangju','daejeon','ulsan','sejong','gyeonggi','gangwon','chungbuk','chungnam','jeonbuk','jeonnam','gyeongbuk','gyeongnam','jeju'];
for(const path of ['/experiences','/experiences/family','/experiences/science','/experiences/rural',...areas.map(area=>'/experiences/region/'+area)]){
 try{const $=await html(path),cards=$('[data-experience-card]');check(cards.length>0&&cards.length<=24,'Card pagination missing');check($('nav[aria-label="체험 지역"] a').length===18,'17 region navigation missing');for(const a of cards.find('a').toArray())check(/^\/experiences\/(family|science|rural)\/[^/]+$/.test($(a).attr('href')||''),'Primary card link must be internal');if(path.includes('/region/'))check(new Set(cards.map((_,node)=>$(node).attr('data-area')).get()).size===1,'Region filter mixes areas');results.push({path,ok:true,cards:cards.length});}catch(error){results.push({path,ok:false,error:error.message});}
}
for(const path of ['/experiences/rural?area='+encodeURIComponent('경기')+'&theme=food&q='+encodeURIComponent('두부'),'/experiences?q='+encodeURIComponent('없는체험-verify-1827'),'/experiences/region/gyeonggi?cost=free']){
 try{const $=await html(path);check(($('meta[name=robots]').attr('content')||'').includes('noindex'),'Query variants should not index');if(path.includes('1827'))check($('[data-experience-card]').length===0,'Empty state missing');if(path.includes('cost=free'))check($('[data-experience-card]').toArray().every(node=>$(node).text().includes('참가비 무료')),'Free filter mismatch');results.push({path,ok:true});}catch(error){results.push({path,ok:false,error:error.message});}
}
try{
 const $=await html('/');check($('[aria-labelledby="home-public-discovery"] [data-experience-card]').length>=4,'Home still only shows topic banners');
 const sitemap=await fetch(new URL('/sitemap.xml',base)).then(response=>response.text());for(const path of indexedTitles.values())check(sitemap.includes(path+'</loc>'),'Indexed detail missing from sitemap: '+path);
 const linkedFamily=new Set();let familyPages=1;for(let page=1;page<=familyPages;page++){const $=await html('/experiences/family'+(page>1?'?page='+page:''));$('[data-experience-card] a').each((_,node)=>linkedFamily.add($(node).attr('href')));if(page===1)familyPages=Number($('nav[aria-label="체험 목록 페이지"] span').text().split('/').at(-1).trim())||1;}
 for(const path of indexedTitles.values())if(path.startsWith('/experiences/family/'))check(linkedFamily.has(path),'Indexed detail has no category card: '+path);
 const photos=Object.values(read('experience-media.json').images).filter(image=>image.src).slice(0,8);for(const photo of photos){const r=await fetch(new URL(photo.src,base));check(r.ok&&r.headers.get('content-type')?.includes('image/webp'),'Compressed photo unavailable');}
 if(process.env.EXPECTED_COMMIT){const status=await fetch(new URL('/api/site-status',base)).then(response=>response.json());check(status.commit===process.env.EXPECTED_COMMIT,'Wrong deployed release');}
 results.push({path:'home/sitemap/images/release',ok:true});
}catch(error){results.push({path:'home/sitemap/images/release',ok:false,error:error.message});}
const report={base,full,checkedAt:new Date().toISOString(),passed:results.filter(result=>result.ok).length,failed:results.filter(result=>!result.ok).length,indexedDetails:indexedTitles.size,maxHtmlBytes,results};
fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/internal-experience-'+(base.includes('127.0.0.1')?'local':'public')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined,failures:results.filter(result=>!result.ok)}));if(report.failed)process.exitCode=1;
