import fs from 'node:fs';
import {loadRuntimeEnv} from './runtime-env.mjs';
import {coupangFetch} from './coupang.mjs';
import {affiliateUrl} from './content.mjs';

loadRuntimeEnv({localGit:true});
const queries = [
  ['crab','국내산 손질 꽃게 냉동 1kg'], ['roe','알곤이 모듬 냉동 1kg'],
  ['fishcake','모듬 어묵 탕용'], ['sausage','부대찌개 햄 소시지'],
  ['beef','소고기 샤브샤브용'], ['mushroom','모듬 버섯'], ['radish','국내산 무 1개'],
  ['green-onion','국내산 대파'], ['onion','국내산 양파'], ['zucchini','국내산 애호박'],
  ['chili','국내산 청양고추'], ['crown-daisy','국내산 쑥갓'], ['tofu','국산 두부'],
  ['bean-sprout','국산 콩나물'], ['doenjang','된장 500g'], ['chili-powder','고춧가루 500g'],
  ['garlic','냉장 다진마늘'], ['soup-soy','국간장'], ['fish-sauce','멸치액젓'],
  ['water','생수 2L'], ['stove','휴대용 가스버너 캠핑'], ['butane','부탄가스 4개'],
  ['knife-board','캠핑 칼 도마 세트'],
];
const output='data/weekend-prep-soup-checklist-research.json';
const report=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):{version:1,createdAt:new Date().toISOString(),records:[]};
const limit=Math.min(10,Math.max(1,Number(process.env.PREP_RESEARCH_LIMIT)||10));
let attempts=0;
const save=()=>fs.writeFileSync(output,`${JSON.stringify({...report,updatedAt:new Date().toISOString()},null,2)}\n`);
for(const [key,keyword] of queries){
  if(report.records.some(r=>r.key===key))continue;
  if(attempts>=limit)break;
  attempts++;
  const url=new URL('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search');
  url.searchParams.set('keyword',keyword);url.searchParams.set('limit','1');
  const response=await coupangFetch(url.toString());
  if(!response.ok)throw Error(`쿠팡 조회 HTTP ${response.status}; 반복 호출 중지`);
  const data=await response.json();
  if(data.rCode&&data.rCode!=='0')throw Error(`쿠팡 응답 코드 ${data.rCode}; 반복 호출 중지`);
  const found=data.data?.productData?.[0];
  const candidate=found?{id:String(found.productId),name:found.productName,image:found.productImage,affiliateUrl:found.productUrl,source:`https://www.coupang.com/vp/products/${found.productId}`,checkedAt:new Date().toISOString(),verified:false}:null;
  report.records.push({key,keyword,queriedAt:new Date().toISOString(),fromCache:response.headers.get('X-Prep-Cache')==='hit',status:!candidate?'no-result':!affiliateUrl(candidate.affiliateUrl)?'invalid-affiliate-link':'needs-photo-option-review',candidate});
  save();console.log(`${key}: ${candidate?.name||'결과 없음'}`);
}
console.log(`이번 실행 ${attempts}개, 누적 ${report.records.length}개`);
