import {load} from 'cheerio';
import {youthApplicationSearchUrl} from '../../lib/experiences.mjs';

const hosts=new Set(['www.youth.go.kr','youth.go.kr']);
const paths=new Set(['/youth/act/actSearch/allActSearchLst.yt','/youth/cmm/imgView/imgView.do']);
const normalized=value=>String(value||'').normalize('NFKC').replace(/\s+/g,'').trim();
export function youthPublicUrl(value){
 try{const url=new URL(value,'https://www.youth.go.kr');
  if(url.protocol!=='https:'||!hosts.has(url.hostname)||url.username||url.password||url.port||!paths.has(url.pathname)||[...url.searchParams.keys()].some(key=>/token|session|csrf|servicekey/i.test(key)))return '';
  return url.href;
 }catch{return '';}
}
export function youthPosterUrl(value){
 const safe=youthPublicUrl(value);if(!safe)return '';
 const url=new URL(safe);
 return url.pathname==='/youth/cmm/imgView/imgView.do'&&/^\d{20}$/.test(url.searchParams.get('atchmnflId')||'')&&Number(url.searchParams.get('atchmnflId'))>0?safe:'';
}
// The public service sets an anonymous load-balancer cookie before returning a
// page. Keep it only in memory and on its issuing host, never in saved data.
export function createYouthPublicFetch(fetchImpl=fetch){
 const jars=new Map();
 return async function fetchPublic(value){
  let url=youthPublicUrl(value);if(!url)throw new Error('Public youth URL not allowed');
  for(let attempt=0;attempt<6;attempt++){
   const host=new URL(url).hostname,jar=jars.get(host)||new Map();jars.set(host,jar);
   const response=await fetchImpl(url,{redirect:'manual',headers:{cookie:[...jar].map(([key,value])=>key+'='+value).join('; ')},signal:AbortSignal.timeout(18000)});
   for(const entry of response.headers.getSetCookie()){
    const pair=entry.split(';')[0],index=pair.indexOf('=');
    if(index>0&&pair.length<4096&&jar.size<24)jar.set(pair.slice(0,index),pair.slice(index+1));
   }
   if(response.status>=300&&response.status<400){
    const location=response.headers.get('location');await response.body?.cancel();
    url=location?youthPublicUrl(new URL(location,url).href):'';
    if(!url)throw new Error('Public youth redirect not allowed');
    continue;
   }
   return response;
  }
  throw new Error('Public youth redirect limit reached');
 };
}
export function youthPhotoSearchTerm(title){return (String(title).match(/[가-힣]{3,}/g)||[]).sort((a,b)=>b.length-a.length)[0]||title;}
export function parseYouthPoster(html,record,checkedAt,sourcePage=youthApplicationSearchUrl(record.title)){
 const $=load(html),matches=[];
 $('a[onclick]').each((_,element)=>{
  const action=$(element).attr('onclick')||'';if(!/^\s*fnDtl\(/.test(action))return;
  const args=[...action.matchAll(/'([^']*)'/g)].map(match=>match[1]);
  if(args[2]!==String(record.id)||normalized($(element).text())!==normalized(record.title))return;
  const row=$(element).closest('li');
  const institution=row.find('dd').map((_,dd)=>$(dd).text().replace(/\s+/g,' ').trim()).get().find(text=>/^기관명\s*[:：]/.test(text))?.replace(/^기관명\s*[:：]\s*/,'');
  if(normalized(institution)!==normalized(record.institution))return;
  const image=row.find('img').filter((_,img)=>normalized($(img).attr('alt'))===normalized(record.title)).first();
  const source=youthPosterUrl(image.attr('src'));if(source)matches.push(source);
 });
 const sources=[...new Set(matches)];if(sources.length!==1)return null;
 return {imageSource:sources[0],imageSourcePage:youthPublicUrl(sourcePage)||youthApplicationSearchUrl(record.title),imageCredit:'e청소년 · '+record.institution,imageKind:'poster',imageCheckedAt:checkedAt};
}
export function preservedYouthPhoto(record,old){
 if(!old||record.id!==old.id||record.title!==old.title||record.institution!==old.institution||record.start!==old.start||record.end!==old.end)return {};
 return Object.fromEntries(['imageSource','imageSourcePage','imageCredit','imageKind','imageCheckedAt','imageAttemptedAt'].filter(key=>old[key]).map(key=>[key,old[key]]));
}
