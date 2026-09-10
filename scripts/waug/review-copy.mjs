import fs from 'node:fs';
import {callOpenAI} from '../lib/articleGen.mjs';
import {decodeHtml} from './parse.mjs';
const env=fs.readFileSync('.env.local','utf8');const key=process.env.OPENAI_API_KEY||env.match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g,'');
const file='data/waug/editorial.json',state=JSON.parse(fs.readFileSync(file,'utf8')),db=JSON.parse(fs.readFileSync('data/waug/catalog.json','utf8'));
const clean=s=>decodeHtml(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' '));
const official=/visitkorea\.or\.kr|\.go\.kr|namisum\.com|koreanfolk\.co\.kr|aquaplanet\.co\.kr|seohaerang\.com|ganghwa-resort\.co\.kr|ludensia\.com|nhasfarmland\.com|pfcamp\.com|begoniabirdpark\.com|zoolungzoolung\.com|aquafield-ssg\.co\.kr|starfield\.co\.kr|zoozoo\.kr|artisthemepark\.co\.kr|seoulland\.co\.kr/;
const queue=state.articles.filter(a=>a.review?.textReviewStatus!=='reviewed');
fs.mkdirSync('data/waug/copy-review',{recursive:true});
async function review(a){try{
  const products=a.productIds.map(id=>db.products.find(p=>p.id===id));
  const facts=products.map(p=>{const r=JSON.parse(fs.readFileSync(`.cache/waug/research/${p.id}.json`,'utf8'));return {url:p.detailUrl,checkedAt:p.lastCheckedAt,text:r.text.split('매력포인트')[1]?.split('상품 ID:')[0]||r.usage};});
  const pages=[];
  const urls=[...new Set(a.sources.map(s=>s.url).filter(u=>{try{return official.test(new URL(u).hostname)&&!u.includes('.pdf')&&!/findMemberPwd/.test(u);}catch{return false;}}))].slice(0,2);
  if(a.slug==='korean-folk-village')urls.unshift('https://www.koreanfolk.co.kr/');
  for(const url of urls){try{const res=await fetch(url,{signal:AbortSignal.timeout(12000)});if(res.ok&&res.headers.get('content-type')?.includes('text/html')){const text=clean(await res.text());if(text.length>200){pages.push({url,text:text.slice(0,22000),checkedAt:new Date().toISOString()});}}}catch{}}
  const prompt=`너는 여행 정보 사실 검수 편집자다. 다음 초안의 모든 구체적 주장(시설명·수치·운영·티켓·무료·주차·연령·기간·코스)을 직접 읽은 아래 근거와 비교하고 근거 없는 내용은 삭제하거나 단정 없는 일반적인 일정 제안으로 수정하라. 현재 한국 날짜는 ${new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})}이다. 이전 검색 요약은 오래된 기간을 포함할 수 있으므로 사용하지 말고 아래 실제 상품 본문과 직접 수집한 공식 페이지 텍스트만 사용한다. 공식 페이지에 없는 가격·운영시간은 고정 수치로 쓰지 말고 방문일별 안내로 바꾼다. 구체성이 없는 반복 확인 문구나 무의미한 요약을 줄여라. 행사 홍보는 확실한 개최기간이 없으면 삭제한다. 원문 문장을 베끼지 않는다. 최초 초안이 잘못된 프로그램을 독립 장소처럼 다루면 바로잡는다. 구매 유도보다 장소와 방문 준비를 먼저 설명한다. 출처가 부족하면 mustHold=true와 이유를 적어라. 각 섹션에 실제 근거의 URL을 provenance에 적어라. JSON만 반환: {"title":"","description":"","intro":"","sections":[{"heading":"","paragraphs":[""],"tickets":false}],"mustHold":false,"corrections":["고친 내용"],"provenance":[{"heading":"","urls":["근거 URL"]}]}. 본문은 1400~2400자 정도이나 근거 없는 말로 분량을 늘리지 마라.\n초안:${JSON.stringify({title:a.title,description:a.description,intro:a.intro,sections:a.sections})}\n실제 상품 본문:${JSON.stringify(facts)}\n직접 읽은 공식 자료:${JSON.stringify(pages)}`;
  const raw=(await callOpenAI(prompt,{apiKey:key,model:'gpt-5.6-luna'})).text;
  const result=JSON.parse(raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
  if(!result.title||!result.intro||!Array.isArray(result.sections)||result.sections.length<3)throw new Error('검수 응답 형식 오류');
  Object.assign(a,{title:result.title,description:result.description,intro:result.intro,sections:result.sections});
  a.review={...a.review,status:'pending',textReviewStatus:'reviewed',textReviewedAt:new Date().toISOString(),mustHold:result.mustHold,corrections:result.corrections,notes:'본문 근거 대조 완료. 최종 편집·사진·실제 옵션·공개 화면 검수 대기.'};
  for(const p of pages){const old=a.sources.find(s=>s.url===p.url);if(old)Object.assign(old,{kind:'official',checkedAt:p.checkedAt});else a.sources.push({url:p.url,label:'시설 공식 안내',kind:'official',checkedAt:p.checkedAt});}
  fs.writeFileSync(`data/waug/copy-review/${a.slug}.json`,JSON.stringify({checkedAt:new Date().toISOString(),corrections:result.corrections,provenance:result.provenance,mustHold:result.mustHold,officialUrls:pages.map(p=>p.url)},null,2)+'\n');
  fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');console.log(a.slug,result.mustHold?'본문 보류':'본문 대조 완료',JSON.stringify(result.corrections));
}catch(e){console.error(a.slug,String(e.message).replaceAll(key,'[redacted]'));}}
await Promise.all(Array.from({length:3},async()=>{while(queue.length)await review(queue.shift());}));
