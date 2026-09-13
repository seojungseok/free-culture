import fs from 'node:fs';
import {loadRuntimeEnv} from './runtime-env.mjs';
import {coupangFetch} from './coupang.mjs';
import {affiliateUrl} from './content.mjs';
loadRuntimeEnv({localGit:!process.env.GITHUB_ACTIONS});
const plan=JSON.parse(fs.readFileSync('data/weekend-prep-rewrite-plan.json','utf8'));
const output='data/weekend-prep-rewrite-candidates.json';
const report=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):{version:1,createdAt:new Date().toISOString(),records:[]};
const limit=Math.max(1,Number(process.env.PREP_RESEARCH_LIMIT)||100);
let attempts=0;
function save(){fs.writeFileSync(output,JSON.stringify({...report,updatedAt:new Date().toISOString()},null,2)+'\n');}
for(const topic of plan.topics)for(const keyword of topic.keywords){
 if(report.records.some(r=>r.slug===topic.slug&&r.keyword===keyword))continue;
 if(attempts>=limit)break;
 attempts++;
 const url=new URL('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search');url.searchParams.set('keyword',keyword);url.searchParams.set('limit','1');
 const response=await coupangFetch(url.toString());
 if(!response.ok)throw Error(`쿠팡 조회 HTTP ${response.status}; 반복 호출 중지`);
 const data=await response.json();
 if(data.rCode&&data.rCode!=='0')throw Error(`쿠팡 응답 코드 ${data.rCode}; 반복 호출 중지`);
 const found=data.data?.productData?.[0];
 const candidate=found?{id:String(found.productId),name:found.productName,image:found.productImage,affiliateUrl:found.productUrl,source:`https://www.coupang.com/vp/products/${found.productId}`,checkedAt:new Date().toISOString(),verified:false}:null;
 const duplicate=candidate&&report.records.find(r=>r.candidate?.id===candidate.id&&r.slug!==topic.slug);
 const record={slug:topic.slug,category:topic.category,keyword,queriedAt:new Date().toISOString(),fromCache:response.headers.get('X-Prep-Cache')==='hit',status:!candidate?'no-result':!affiliateUrl(candidate.affiliateUrl)?'invalid-affiliate-link':duplicate?'duplicate-product':'needs-photo-option-review',candidate};
 report.records.push(record);save();
 console.log(`${report.records.length}. ${topic.category} / ${keyword}: ${record.status}${candidate?' / '+candidate.name:''}`);
}
console.log(`저장된 조회 결과 ${report.records.length}개. 상품·옵션·사진 대조 전 발행하지 않습니다.`);
