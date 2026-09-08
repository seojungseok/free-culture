const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const modules=new Map();
function load(file){file=path.resolve(file);if(!path.extname(file))file+=['.ts','.tsx','.js'].find(ext=>fs.existsSync(file+ext))||'.ts';if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(modules.has(file))return modules.get(file).exports;const m={exports:{}};modules.set(file,m);const local=name=>name==='server-only'?{}:name.startsWith('@/')?load(name.slice(2)):name.startsWith('.')?load(path.resolve(path.dirname(file),name)):require(name);new Function('exports','module','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(m.exports,m,local);return m.exports;}
const {eventOffer}=load('lib/eventSeo');
assert.equal(eventOffer({priceType:'free',priceMin:0,priceMax:0}).price,0);
assert.equal(eventOffer({priceType:'paid',priceMin:10000,priceMax:10000}).price,10000);
for(const priceType of ['free_estimated','partial_free','unknown'])assert.equal(eventOffer({priceType,priceMin:0,priceMax:10000}),undefined);
assert.equal(eventOffer({priceType:'paid',priceMin:10000,priceMax:20000}),undefined);
assert(!('availability' in eventOffer({priceType:'free',priceMin:0,priceMax:0})));
const sitemap=load('app/sitemap').default(),urls=sitemap.map(s=>s.url),set=new Set(urls);
assert.equal(urls.length,set.size,'Unique sitemap URLs');
assert(!urls.some(u=>u.includes('/traditional-market')), 'Hidden markets stay out of sitemap');
assert(urls.length<50000,'Single sitemap URL limit');
assert(urls.every(u=>u.startsWith('https://mwohaji.kr')&&!u.includes('?')&&!u.includes('undefined')));
assert(!urls.some(u=>/\/(search|saved|plan|admin)(\/|$)/.test(u)));
for(const p of ['/season','/camping/collections'])assert(set.has('https://mwohaji.kr'+p));
const {getKidCourses}=load('lib/kidCourses'),{getAllBundles}=load('lib/campingCollections');
assert(getKidCourses().every(c=>set.has('https://mwohaji.kr/kids/c/'+c.id)));
assert(getAllBundles().every(c=>set.has('https://mwohaji.kr/camping/collections/'+c.slug)));
const {getAllArticles}=load('lib/articles'),{getAllPlaces}=load('lib/tour');
const live=new Set(getAllPlaces().map(p=>p.id));
for(const a of getAllArticles())if(!live.has(a.id))assert(!set.has('https://mwohaji.kr/places/spot/'+a.id));
const robots=load('app/robots').default();
const matches=(rule,url)=>new RegExp('^'+rule.split('*').map(p=>p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')).test(url);
for(const r of robots.rules){const dis=[r.disallow||[]].flat();for(const url of ['/_next/static/chunks/app.js?dpl=test','/_next/image?url=photo.jpg&w=640&q=75','/search?q=서울','/api/pet-travel?area=서울','/region/seoul','/?utm_source=test'])assert(!dis.some(d=>matches(d,url)),r.userAgent+' can crawl '+url);}
const eventStory=load('lib/eventStory').eventStory;
assert(eventStory({title:'test',realmName:'전시',area:'서울',sigungu:'',place:'',startDate:'20260901',endDate:'20260910',priceLabel:'무료 추정',priceType:'free_estimated'}).some(s=>s.includes('추정')));
console.log(JSON.stringify({passed:true,sitemapUrls:urls.length,kidCourses:getKidCourses().length,bundles:getAllBundles().length,petDetails:urls.filter(u=>u.includes('/pet-travel/')).length,checks:['prices','no invented availability','sitemap coverage and uniqueness','canonical targets','robots asset and AI search access','estimated free copy']}));
