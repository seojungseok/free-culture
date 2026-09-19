import fs from 'node:fs';
import {loadRuntimeEnv} from './runtime-env.mjs';
import {githubBackend} from './github-budget.mjs';
import {coupangFetch} from './coupang.mjs';
import {affiliateUrl} from './content.mjs';

// Existing secrets stay in memory; never log response bodies or credentials.
const envFile = process.env.PREP_ENV_FILE;
if (envFile && fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadRuntimeEnv({localGit:true});
const snapshot = await githubBackend.read();
console.log(JSON.stringify({locked:!!snapshot.state.lock,cap:snapshot.state.cap,interval:snapshot.state.interval}));
if (snapshot.state.lock) throw Error('공용 호출 잠금이 남아 있습니다. 자동 해제·신규 조회하지 않습니다.');
if (process.argv.includes('--inspect')) process.exit(0);
const queries = [
 ['doenjang','된장 500g'],['perilla','들깨가루'],['potato','국내산 감자'],['sujebi','생 수제비'],
 ['shrimp','냉동 흰다리새우살'],['butter','무염 버터'],['garlic','다진마늘'],
 ['mackerel','손질 고등어 냉동'],['radish','국내산 생 무'],['soy','진간장'],
 ['chicken','닭볶음탕용 생닭'],['gochujang','고추장'],['tteok','떡볶이떡'],['corn','스위트콘 캔'],['mayonnaise','마요네즈'],
 ['radish-fresh','제주 월동무 흙무 생무 1개'],['gochujang-small','해찬들 태양초 고추장 500g 1개'],
 ['mayonnaise-small','오뚜기 골드 마요네즈 300g 1개'],['butter-small','앵커 무염버터 227g 1개'],
 ['perilla-small','탈피 들깨가루 200g 1개'],['doenjang-small','해찬들 재래식 된장 500g 1개'],
 ['corn-alternative','오뚜기 스위트콘 340g 1개']
];
const file='data/autumn-recipes-20260919-research.json';
const report=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,records:[]};
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7);
if(only&&!queries.some(([key])=>key===only))throw Error('Unknown single query');
const selected=only?queries.filter(([key])=>key===only):queries;
if(only&&selected.length!==1)throw Error('Exactly one query required');
for (const [key,keyword] of selected) {
 if(report.records.some(r=>r.key===key))continue;
 const url=new URL('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search');
 url.searchParams.set('keyword',keyword);url.searchParams.set('limit','1');
 const response=await coupangFetch(url.toString());
 if(!response.ok)throw Error(`상품 조회 HTTP ${response.status}; 자동 재시도 없음`);
 const data=await response.json();
 if(data.rCode&&data.rCode!=='0')throw Error('상품 API 오류; 자동 재시도 없음');
 const p=data.data?.productData?.[0];
 const candidate=p?{id:String(p.productId),name:p.productName,image:p.productImage,affiliateUrl:p.productUrl,source:`https://www.coupang.com/vp/products/${p.productId}`,checkedAt:new Date().toISOString(),verified:false}:null;
 report.records.push({key,keyword,candidate,status:!candidate?'empty':affiliateUrl(candidate.affiliateUrl)?'needs-review':'invalid-link'});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({key,id:candidate?.id,name:candidate?.name}));
}
