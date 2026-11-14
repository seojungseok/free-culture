import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {isYouthExperience} from '../lib/experiences.mjs';
const base=(process.env.VERIFY_BASE||'http://127.0.0.1:3317').replace(/\/$/,''),today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const records=JSON.parse(fs.readFileSync('data/youth-experiences.json','utf8')).records;
const media=JSON.parse(fs.readFileSync('data/experience-media.json','utf8')).images;
const current=records.filter(record=>record.active!==false&&record.end>=today&&isYouthExperience(record));
const withPhotos=current.filter(record=>media[record.imageSource]?.src),results=[];
async function check(path,verify){try{const response=await fetch(base+path,{signal:AbortSignal.timeout(25000)});assert.equal(response.status,200);await verify(response);results.push({path,ok:true});}catch(error){results.push({path,ok:false,message:String(error.message).slice(0,180)});}}
for(const path of ['/experiences','/experiences/family'])await check(path,async response=>{
 const $=load(await response.text()),cards=$('[data-experience-card][data-kind=family]');assert(cards.length>0);
 cards.each((_,card)=>{const href=$(card).find('a').attr('href'),record=current.find(record=>href==='/experiences/family/'+record.id);if(record&&media[record.imageSource]?.src){assert.equal($(card).find('img').attr('src'),media[record.imageSource].src);assert($(card).find('img').attr('alt').includes('공식 안내 이미지'));}});
});
for(const id of ['384587','384745','384548'])await check('/experiences/family/'+id,async response=>{
 const record=records.find(record=>record.id===id);assert(media[record?.imageSource]?.src,'The reported missing picture has no verified official image');
 const $=load(await response.text());assert.equal($('[data-experience-detail] figure img').attr('src'),media[record.imageSource].src);assert($('figure figcaption').text().includes(record.institution));assert.equal($('figure figcaption a').attr('href'),record.imageSourcePage);
});
for(const record of withPhotos)await check(media[record.imageSource].src,async response=>{assert((response.headers.get('content-type')||'').includes('image/webp'));assert((await response.arrayBuffer()).byteLength>500);});
if(process.env.EXPECTED_COMMIT)await check('/api/site-status',async response=>assert.equal((await response.json()).commit,process.env.EXPECTED_COMMIT));
const report={base,checkedAt:new Date().toISOString(),currentPrograms:current.length,withOfficialPhotos:withPhotos.length,passed:results.filter(result=>result.ok).length,failed:results.filter(result=>!result.ok).length,results};
fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/experience-photos-'+(base.includes('127.0.0.1')?'local':'public')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,results:undefined,failures:results.filter(result=>!result.ok)}));if(report.failed)process.exitCode=1;
