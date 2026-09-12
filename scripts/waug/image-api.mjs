import fs from 'node:fs';import crypto from 'node:crypto';import sharp from 'sharp';import {execFileSync} from 'node:child_process';
import {kstDay} from './core.mjs';
import {TICKET_POLICY,AI_DISCLOSURE} from '../../lib/ticket-guarantee.mjs';
if(process.env.WAUG_SERVER_EXECUTION!=='1')throw Error('예약 서버 전용. 준비/검증 과정에서는 이미지 생성 금지');
const [placeId,recipeFile]=process.argv.slice(2);if(!/^[a-z0-9-]+$/.test(placeId||''))throw Error('잘못된 장소 ID');
if(process.env.WAUG_IMAGE_WORKER!=='1'){const r=await fetch('http://127.0.0.1:47831/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({placeId,recipeFile}),signal:AbortSignal.timeout(380000)});if(!r.ok)throw Error('이미지 서버 작업 실패 HTTP '+r.status);console.log(await r.text());process.exit(0);}
const queue=JSON.parse(fs.readFileSync('data/waug/queue.json'));const job=queue.jobs.find(j=>j.placeId===placeId);
if(!job||job.status!=='working'||job.publicationDay>kstDay())throw Error('활성 예약 작업 아님');
const recipe=JSON.parse(fs.readFileSync(recipeFile,'utf8'));const kind=recipe.kind==='body'?'body':'thumbnail';const slot=kind==='thumbnail'?'thumbnail':recipe.slot;
const article=JSON.parse(fs.readFileSync('data/waug/editorial.json','utf8')).articles.find(a=>a.placeId===placeId);
const newPolicy=article?.contentPolicyVersion===TICKET_POLICY;
if(!(newPolicy?['thumbnail','body-1','body-2','body-3','body-4']:['thumbnail','body-1','body-2']).includes(slot))throw Error('허용 이미지 슬롯 아님');
if(newPolicy&&(!recipe.necessityNote||!recipe.realPhotoSearchNote||recipe.role!=='illustration'))throw Error('신규 글은 실제 사진 조사 후 필요한 보조 이미지에만 생성 허용');
if(newPolicy){const generated=new Set([article.thumbnail,...(article.photos||[])].filter(p=>p?.kind==='ai-generated').map(p=>p.url));const dir=`data/waug/image-jobs/${placeId}`;if(fs.existsSync(dir))for(const f of fs.readdirSync(dir).filter(f=>/^(thumbnail|body-\d+)\.json$/.test(f))){const record=JSON.parse(fs.readFileSync(`${dir}/${f}`,'utf8'));if(record.slot!==slot&&['generated','request_pending','needs_recovery'].includes(record.status))generated.add(record.url||record.slot);}if(generated.size>=4&&!fs.existsSync(`${dir}/${slot}.json`))throw Error('글당 AI 이미지 최대 4장: 불확실한 기존 생성도 복구 전 중복 과금 금지');}
if(!recipe.prompt||!recipe.placeName||!recipe.caption||!recipe.basis||kind==='body'&&!recipe.necessityNote)throw Error('본문 근거·문구·필요성 누락');
const dir=`data/waug/image-jobs/${placeId}`;fs.mkdirSync(dir,{recursive:true});const recordFile=`${dir}/${slot}.json`;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');const inputHash=hash(JSON.stringify(recipe));
if(fs.existsSync(recordFile)){const old=JSON.parse(fs.readFileSync(recordFile));if(old.status==='generated'){console.log(JSON.stringify(old));process.exit(0);}throw Error('기존 과금 요청 존재: 자동 재생성 금지. 결과 복구 또는 수동 검토 필요');}
const record={placeId,slot,inputHash,status:'request_pending',model:'gpt-image-2',quality:'medium',size:'1536x1024',estimatedImageOutputUSD:0.041,costNote:'예상 이미지 출력만. 입력·텍스트 조사 비용 별도; 청구 확정액 아님',createdAt:new Date().toISOString(),recipe};
const save=()=>fs.writeFileSync(recordFile,JSON.stringify(record,null,2)+'\n');const checkpoint=()=>execFileSync(process.execPath,['scripts/waug/checkpoint.mjs'],{stdio:'inherit'});
save();checkpoint(); // Remote durable intent BEFORE billable request; ambiguous results must not retry.
const key=process.env.WAUG_IMAGE_API_KEY||process.env.OPENAI_API_KEY;if(!key)throw Error('서버 이미지 API 비밀값 누락');
try{
 const response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:record.model,quality:record.quality,size:record.size,n:1,output_format:'jpeg',output_compression:90,prompt:`Create a travel editorial background. ${recipe.prompt}\nNo readable text, logos, price charts, timetable or map. No identifiable faces. Do not invent a real facility or present invented scenery as this venue. Use a natural photographic travel mood, never drawing, illustration, cartoon or 3D. Without exact visual evidence use a thematic close-up, not invented facility architecture. The image is visibly labeled AI-generated. Leave central safe space for a concise Korean title to be overlaid. Source facts: ${recipe.basis}`}),signal:AbortSignal.timeout(240000)});
 if(!response.ok)throw Error('이미지 API HTTP '+response.status);
 const result=await response.json();if(!result.data?.[0]?.b64_json)throw Error('이미지 결과 누락');
 const base=await sharp(Buffer.from(result.data[0].b64_json,'base64')).resize(1200,630,{fit:'cover'}).toBuffer();
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 if(recipe.placeName.length>22||recipe.caption.length>23)throw Error('한글 문구 너무 김: 생성 결과 복구 후 합성 검토 필요');
 const svg=Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="shade" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></linearGradient></defs><rect y="300" width="1200" height="330" fill="url(#shade)"/><g fill="white" font-family="Noto Sans CJK KR, Noto Sans KR" text-anchor="middle"><text x="600" y="411" font-size="${recipe.placeName.length>15?44:58}" font-weight="700">${esc(recipe.placeName)}</text><text x="600" y="478" font-size="42" font-weight="500">${esc(recipe.caption)}</text><text x="1148" y="599" font-size="18" text-anchor="end">AI 생성 이미지</text></g></svg>`);
 const overlay=newPolicy?Buffer.from(svg.toString().replace('AI 생성 이미지',AI_DISCLOSURE)):svg;
 const composed=await sharp(base).composite([{input:overlay}]).png().toBuffer();let bytes;for(const quality of [90,86,82,78]){bytes=await sharp(composed).jpeg({quality,mozjpeg:true}).toBuffer();if(bytes.length<=250*1024)break;}
 const asset=`public/ticket-images/${placeId}-${slot}-api.jpg`;fs.mkdirSync('public/ticket-images',{recursive:true});fs.writeFileSync(asset,bytes);
 Object.assign(record,{status:'generated',generatedAt:new Date().toISOString(),url:`https://mwohaji.kr/ticket-images/${placeId}-${slot}-api.jpg`,asset,sha256:hash(bytes),bytes:bytes.length,width:1200,height:630,mimeType:'image/jpeg',usage:result.usage||null,promptHash:inputHash,visualReviewStatus:'pending',qualityNote:bytes.length>250*1024?'가독성 품질 우선':null});save();checkpoint();console.log(JSON.stringify(record));
}catch(error){record.status='needs_recovery';record.failure=error.message;save();checkpoint();throw Error(record.failure);}
