// Read-only HTTP checks. Never follow affiliate links or call a product API.
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {load} from 'cheerio';
const base=process.env.VERIFY_BASE || 'http://127.0.0.1:3314';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const cooking=JSON.parse(fs.readFileSync('data/prep-cooking-guides.json','utf8'));
const sandbox={exports:{},URL,Date};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/prep-affiliate.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
const {prepGuideItems,reviewedPrepAffiliate}=sandbox.exports;
const results=[];
const check=(condition,message)=>{if(!condition)throw Error(message);};
for(const article of store.articles.filter(article=>article.status==='published')){
 try{
  const response=await fetch(new URL('/weekend-prep/'+article.slug,base),{signal:AbortSignal.timeout(30000)});
  check(response.ok,'HTTP '+response.status);
  const $=load(await response.text());
  check($('article h1').text()===article.title,'H1 differs');
  check(new URL($('link[rel="canonical"]').attr('href')).pathname==='/weekend-prep/'+article.slug,'Canonical differs');
  const items=prepGuideItems(article,store.articles);
  const labels=$('#prep-checklist .prep-simple-items strong').map((_,el)=>$(el).text()).get();
  check(JSON.stringify(labels)===JSON.stringify(items.map(item=>item.label)),'Shopping list differs');
  const links=$('#prep-checklist a.prep-order').map((_,el)=>$(el).attr('href')).get();
  check(JSON.stringify(links)===JSON.stringify(items.map(reviewedPrepAffiliate).filter(Boolean).map(product=>product.url)),'Affiliate route differs');
  const schemas=$('script[type="application/ld+json"]').map((_,el)=>JSON.parse($(el).text())).get();
  check(schemas.some(schema=>schema['@type']==='Article'),'Article schema missing');
  check(schemas.some(schema=>schema['@type']==='BreadcrumbList'),'Breadcrumb missing');
  const photos=$('article .prep-photo img').length;
  check(photos>=3&&photos<=4,'Expected 3–4 distinct preparation images');
  if(article.checklist?.length)check(!/냄비|국자|국그릇|조리도구|집게/.test($('.prep-lead').text()),'Household purchases remain in description');
  if(cooking.guides[article.slug]){
   check($('#prep-cooking').length===1,'Cooking section duplicated');
   check($('#prep-cooking .prep-cooking-steps li').length===cooking.guides[article.slug].steps.length,'Detailed steps missing');
   check($('.prep-recipe-fixes dt').length>=2,'Troubleshooting missing');
   check($('.prep-recipe-sources a').length>=2,'Sources missing');
  }
  results.push({slug:article.slug,ok:true,items:labels.length,links:links.length,photos,detailed:!!cooking.guides[article.slug]});
 }catch(error){results.push({slug:article.slug,ok:false,error:error.message});}
}
try{
 const status=await fetch(new URL('/api/data-status',base)).then(response=>response.json());
 check(status.sources.length===6&&status.healthy===true,'Data is not current');
 const $=load(await fetch(new URL('/about',base)).then(response=>response.text()));
 check($('#data-updates time').length===6,'About page collection dates missing');
 if(process.env.EXPECTED_COMMIT){const live=await fetch(new URL('/api/site-status',base)).then(response=>response.json());check(live.commit===process.env.EXPECTED_COMMIT,'Deployment commit differs');}
 results.push({slug:'data-status/about',ok:true,sources:status.sources});
}catch(error){results.push({slug:'data-status/about',ok:false,error:error.message});}
fs.mkdirSync('.cache',{recursive:true});
const report={base,checkedAt:new Date().toISOString(),passed:results.filter(result=>result.ok).length,failed:results.filter(result=>!result.ok).length,results};
fs.writeFileSync('.cache/freshness-cooking-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({base,passed:report.passed,failed:report.failed,failures:results.filter(result=>!result.ok)}));
if(report.failed)process.exitCode=1;
