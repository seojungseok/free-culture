import { load } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { loadKey, QuotaError, sleep } from './tourClient.mjs';
const parser=new XMLParser({ignoreAttributes:true});
export const textOf=value=>String(value??'').replace(/<\/?[a-z][a-z0-9]*(?:\s[^>]*)?\s*\/?\s*>/gi,' ').replace(/&amp;/gi,'&').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();
export const SOURCE_PARSER_VERSION=2;
const factLabels=/^(공연시간|관람시간|운영시간|행사시간|교육시간|교육대상|교육인원|러닝타임|소요시간|관람연령|관람등급|등급|참여대상|신청대상|대상|예약방법|신청방법|접수방법|접수기간|신청기간|정원|모집인원|준비물|프로그램명|체험프로그램|체험내용|프로그램|출연|연주곡목|장르)$/;
function dateRangesConflict(value,event) {
  const dates=[...value.matchAll(/(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/g)].map(m=>m[1]+m[2].padStart(2,'0')+m[3].padStart(2,'0'));
  const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10).replace(/-/g,'');
  return dates.length>=2&&event.startDate&&event.endDate&&(dates[dates.length-1]<event.startDate||dates[0]>event.endDate||event.endDate>=today&&dates[dates.length-1]<today);
}
export function publicSourceUrl(value) {
  try {
    const url=new URL(String(value||'').replace(/&amp;/g,'&'));
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.hostname==='localhost'||/\.(?:local|internal)$/i.test(url.hostname)||/[?&](?:serviceKey|token|password|access_token)=/i.test(url.search)) return '';
    if(url.port&&!['80','443'].includes(url.port)&&!(url.port==='447'&&url.hostname.endsWith('.moonhwain.kr'))) return '';
    if(isIP(url.hostname)&&!publicIp(url.hostname)) return '';
    url.hash='';return url.href;
  }catch{return '';}
}
function publicIp(ip) {
  if(ip.includes(':')) return /^2[0-9a-f]{3}:/i.test(ip);
  const [a,b]=ip.split('.').map(Number);
  return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&[0,168].includes(b)||a===100&&b>=64&&b<=127||a===198&&[18,19,51].includes(b)||a===203&&b===0);
}
export async function fetchSourcePage(raw,{fetcher=fetch,resolve=lookup}={}) {
  let url=publicSourceUrl(raw);
  if(!url) throw new Error('unsafe-source');
  for(let redirects=0;redirects<5;redirects++) {
    const addresses=await resolve(new URL(url).hostname,{all:true});
    if(!addresses.length||addresses.some(row=>!publicIp(row.address))) throw new Error('unsafe-source');
    const response=await fetcher(url,{redirect:'manual',headers:{'User-Agent':'mwohaji.kr public-event-information/1.0','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(12000)});
    if([301,302,303,307,308].includes(response.status)) {
      url=publicSourceUrl(new URL(response.headers.get('location')||'',url).href);
      if(!url) throw new Error('unsafe-source');continue;
    }
    if(!response.ok) throw new Error(`source-http-${response.status}`);
    if(!/html/i.test(response.headers.get('content-type')||'')) throw new Error('source-not-html');
    const chunks=[];let bytes=0;
    for await(const chunk of response.body) {bytes+=chunk.length;if(bytes>2000000) throw new Error('source-too-large');chunks.push(chunk);}
    const buffer=Buffer.concat(chunks);
    const charset=(response.headers.get('content-type')||'').match(/charset=([^;\s]+)/i)?.[1]||'utf-8';
    let html;try{html=new TextDecoder(charset).decode(buffer);}catch{html=buffer.toString('utf8');}
    return {url,html};
  }
  throw new Error('source-redirect-limit');
}
let cultureNextRequestAt=0;
async function cultureThrottle(){const start=Math.max(Date.now(),cultureNextRequestAt);cultureNextRequestAt=start+650;if(start>Date.now())await sleep(start-Date.now());}
export async function cultureDetail(id,budget,{fetcher=fetch,key=loadKey('public'),throttle=cultureThrottle,pause=sleep}={}) {
  if(!key) throw new Error('공공 API 인증키 없음');
  for(let attempt=0;attempt<3;attempt++) {
  await throttle();
  if(budget.stopped)throw budget.quotaError;
  if(budget.used>=budget.max) throw new QuotaError('local');
  budget.used++;
  const url=new URL('https://apis.data.go.kr/B553457/cultureinfo/detail2');
  url.search=new URLSearchParams({serviceKey:key,seq:id});
  const response=await fetcher(url,{signal:AbortSignal.timeout(20000)});
  const raw=await response.text();
  const limitCode=raw.match(/<(?:returnReasonCode|resultCode)>\s*(22|23)\s*</)?.[1];
  if((limitCode==='23'||/LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND_EXCEEDS_ERROR/.test(raw))&&attempt<2&&budget.used<budget.max) {
    const seconds=Math.max(1.5,Math.min(30,Number(response.headers.get('retry-after'))||1.5));await pause(seconds*1000);continue;
  }
  if(response.status===429||/LIMITED_NUMBER_OF_SERVICE_REQUESTS|<(?:returnReasonCode|resultCode)>\s*22\s*</i.test(raw)) {
    const code=raw.match(/LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR/)?.[0]||raw.match(/<(?:returnReasonCode|resultCode)>\s*(22|23)\s*</)?.[1];
    const error=new QuotaError('provider',{status:response.status,endpoint:'detail2',code});budget.stopped=true;budget.quotaError=error;throw error;
  }
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  const data=parser.parse(raw),code=data?.response?.header?.resultCode;
  if(!['0','00','0000'].includes(String(code))) throw new Error(`resultCode=${/^\d+$/.test(String(code))?code:'unknown'}`);
  const rows=data?.response?.body?.items?.item;
  const item=Array.isArray(rows)?rows[0]:rows;
  if(!item||String(item.seq)!==String(id)) throw new Error('Invalid event identity');
  return item;
  }
}
export const titleKey=value=>String(value??'').replace(/^\[(?:서울|경기|인천|대전|대구|부산|울산|광주|세종|강원|충북|충남|전북|전남|경북|경남|제주|송도|안동|포항|창원|용인|수원|고양|성남|청주|천안|춘천|전주|대학로|김포|목포|강릉|평택|양산|부천|안산|송파|원주|동탄|김해|진주|거제|구미|의정부|의왕|안양|군포|과천|화성|여수|순천)\]\s*/,'').replace(/[^가-힣a-z0-9]/gi,'').toLowerCase();
export function validFact(label,value) {
  if(!value||value.length>160||/^(?:명|별\s*상이|정보|안내|이용안내|내용|사진|프로그램|신청|\d+회차)$/.test(value)||/[{}]|로그인|회원가입|개인정보|쿠키|copyright|나열된 표|고객센터/i.test(value))return false;
  if(label==='운영시간')return false; // 기관·매표소 운영시간을 행사 진행시간으로 표시하지 않는다.
  if(/프로그램|체험내용|연주곡목/.test(label)&&/^(?:PROGRAM|내용일시|상세내용 바로가기|\(제목 클릭)|세부사항은|사정에 따라 변경|일정, 모집인원|프로그램별 상이/i.test(value))return false;
  if(label==='장르')return /^(?:클래식|뮤지컬|연극|무용|국악|오페라|재즈|대중음악|전시|복합|기타)(?:\s*[/,·]\s*[가-힣]+)*$/.test(value);
  if(/시간|러닝타임/.test(label))return /분|시간|\d\s*시|\d:\d|오[전후]|PT\d/.test(value);
  if(/연령|등급/.test(label))return /세|관람|학생|성인|미취학|학년/.test(value);
  return true;
}
export function sourceExcerpt(value,title) {
  const description=textOf(value);
  if(!description||/로그인|회원가입|{{|문화생활의 즐거움|가격,?\s*일정 상세 정보|공연장, LG아트센터|진흥원 소개,/.test(description)||titleKey(description)===titleKey(title))return '';
  return description.split(/\s+/).slice(0,24).join(' ').slice(0,140);
}
export function extractEventSource(html,event,url) {
  const $=load(html),key=titleKey(event.title);
  const title=textOf($('meta[property="og:title"]').attr('content')||$('title').text());
  const ld=[];
  $('script[type="application/ld+json"]').each((_,node)=>{try{const data=JSON.parse($(node).text());const visit=x=>{if(Array.isArray(x))return x.forEach(visit);if(x&&typeof x==='object'){if([].concat(x['@type']||[]).some(t=>/Event$/.test(t)))ld.push(x);if(x['@graph'])visit(x['@graph']);}};visit(data);}catch{}});
  const identity=key.length>=2&&!/^(?:뮤지컬|연극|공연|전시|축제)$/.test(key)&&(titleKey(title).includes(key)||ld.some(item=>titleKey(item.name).includes(key)));
  if(!identity) return {status:'identity-unconfirmed',title,url,facts:[]};
  const matched=ld.find(item=>titleKey(item.name).includes(key));
  if(matched?.startDate&&event.startDate&&String(matched.startDate).replace(/\D/g,'').slice(0,8)!==event.startDate) return {status:'schedule-conflict',title,url,facts:[]};
  $('script,style,nav,header,footer,form,iframe,noscript,[hidden],[aria-hidden="true"]').remove();
  const main=$('main,article,[role="main"],#content,#contents,.view_cont,.view-content,.board_view').first();
  const body=main.length?main:$('body');
  const tableFacts=[],sessionFacts=[];let scheduleConflict=false;
  $('body tr').each((_,node)=>{
    const cells=$(node).children('th,td');if(cells.length<2)return;
    const label=textOf(cells.first().text()).replace(/\s/g,''),value=textOf(cells.slice(1).text());
    if(factLabels.test(label)&&body.find(node).length)tableFacts.push({label,value});
    if(/^(?:공연|교육|전시|행사|운영)기간$/.test(label)&&dateRangesConflict(value,event))scheduleConflict=true;
    const columns=cells.toArray().map(cell=>textOf($(cell).text()));
    const session=columns[0].match(/^프로그램\s*(\d+회차)$/),when=columns.find(t=>/^교육일시\s*20\d{2}/.test(t)),status=columns.at(-1);
    const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
    if(session&&when&&when.replace(/^교육일시\s*/,'').slice(0,10)>=today&&/^(?:마감|접수중|접수예정|대기접수)$/.test(status))sessionFacts.push({label:`${session[1]} 신청 현황`,value:`${when.replace(/^교육일시\s*/,'')} / ${status}`});
    if(/^\d{1,2}:\d{2}\s*[~～-]\s*\d{1,2}:\d{2}/.test(columns[0])&&columns.length===3&&columns[1])tableFacts.push({label:`${columns[0]} 프로그램`,value:columns[1]});
  });
  body.find('br').replaceWith('\n');body.find('tr,li,p,div,dt,dd,h1,h2,h3,h4,section').append('\n');
  const lines=[...new Set(body.text().split(/\n/).map(textOf).filter(Boolean))];
  for(let index=0;index<lines.length;index++) {
    const period=lines[index].match(/^(?:공연|교육|전시|행사|운영)기간\s*[:：]?\s*(.*)$/);
    if(period&&dateRangesConflict(period[1]||lines[index+1]||'',event))scheduleConflict=true;
  }
  if(scheduleConflict)return {status:'schedule-conflict',title,url,facts:[]};
  const facts=[];
  const add=(label,value)=>{value=textOf(value).replace(/^[:：\s]+/,'');if(validFact(label,value)&&!facts.some(f=>f.label===label))facts.push({label,value});};
  tableFacts.forEach(({label,value})=>add(label,value));
  for(let index=0;index<lines.length;index++) {
    const line=lines[index];
    const match=line.match(/^(공연시간|관람시간|운영시간|행사시간|교육시간|교육대상|교육인원|러닝타임|소요시간|관람연령|관람등급|등급|참여대상|신청대상|예약방법|신청방법|접수기간|신청기간|정원|모집인원|준비물|프로그램명|체험프로그램|체험내용|프로그램|출연|연주곡목|장르)(?:\s*[:：]\s*|\s+|$)(.*)$/);
    if(match) add(match[1],match[2]||lines[index+1]);
    const time=line.match(/^(?:공연|관람)?\s*(\d{2,3}\s*분(?:\s*\(?인터미션[^)]*\)?)?)$/);
    if(time) add('소요시간',time[1]);
    const age=line.match(/^((?:만\s*)?\d{1,2}\s*세\s*이상(?:\s*관람(?:가|가능))?|전체\s*관람가)$/);
    if(age) add('관람연령',age[1]);
  }
  if(matched?.duration&&/^PT\d+[HM]/.test(matched.duration)) add('소요시간',matched.duration);
  sessionFacts.forEach(({label,value})=>add(label,value));
  const description=textOf(matched?.description||$('meta[property="og:description"]').attr('content')||$('meta[name="description"]').attr('content')||'');
  const excerpt=sourceExcerpt(description,title);
  return {status:facts.length||excerpt?'verified':'no-readable-detail',title,url,facts:facts.slice(0,12),excerpt};
}
