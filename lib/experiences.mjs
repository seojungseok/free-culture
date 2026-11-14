import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {text,dateOnly,addressArea,safePublicUrl} from './learning.mjs';
export const RURAL_SOURCE='https://www.data.go.kr/data/15013113/standard.do';
export const YOUTH_SOURCE='https://www.data.go.kr/data/15073963/openapi.do';
const identity=parts=>createHash('sha256').update(parts.join('|')).digest('hex').slice(0,20);
export function youthApplicationSearchUrl(title){const url=new URL('https://www.youth.go.kr/youth/act/actSearch/allActSearchLst.yt');url.search=new URLSearchParams({curMenuSn:'334',sKeyword:title,sCurSearchFlag:'Y',sChkSearchFlag:'Y'}).toString();return url.href;}
export function experienceCity(address){const match=text(address).match(/^\S+\s+(\S+(?:시|군|구))(?:\s+(\S+구))?/);return match?[match[1],match[2]].filter(Boolean).join(' '):'';}
export function normalizeRural(row){
 const title=text(row.exprnVilageNm),address=text(row.rdnmadr||row.lnmadr),programs=text(row.exprnCn).split('+').map(text).filter(Boolean),referenceDate=dateOnly(row.referenceDate);
 if(!title||!address||!programs.length||!referenceDate)return null;
 return {id:identity([title,address]),title,address,area:addressArea(address),city:text(row.signguNm),programs:[...new Set(programs)],programType:text(row.exprnSe),facilities:text(row.holdFclty),homepage:safePublicUrl(row.homepageUrl),phone:text(row.phoneNumber),institution:text(row.institutionNm||row.insttNm),referenceDate,source:RURAL_SOURCE,imageSource:safePublicUrl(row.exprnPicUrl),latitude:Number(row.latitude)||0,longitude:Number(row.longitude)||0,designatedAt:dateOnly(row.appnDate)};
}
export function normalizeYouth(row){
 const id=text(row.key1),title=text(row.pgmNm),start=dateOnly(text(row.sdate).replaceAll('/','-')),end=dateOnly(text(row.edate).replaceAll('/','-'));
 if(!/^\d+$/.test(id)||!title||!start||!end||start>end)return null;
 const content=String(row.atContent||'').replace(/&#(?:13|10);/g,'\n').replace(/<br\s*\/?>/gi,'\n');
 const describedTarget=content.match(/(?:참가\s*)?대상\s*[:：]\s*([^\n\r]{1,150})/)?.[1];
 const rawTarget=text(row.target);
 // The live API sometimes returns a participant count in "target". A bare
 // number is never interpreted as a child's age or school grade.
 const audience=describedTarget?text(describedTarget):/[가-힣]/.test(rawTarget)?rawTarget:'공식 안내에서 연령·학년 확인';
 const price=text(row.price),free=/^(무료|0|0원)$/.test(price);
 return {id,title,start,end,area:addressArea(text(row.sido)+' '+text(row.sigungu)),city:text(row.sigungu),institution:text(row.organNm),audience,price:price||'참가비 확인',free,summary:text(content.replace(/https?:\/\/[^\s<>]+/g,'')).slice(0,650),source:YOUTH_SOURCE,officialUrl:youthApplicationSearchUrl(title),content:experienceParagraphs(content),address:'',phone:'',imageSource:''};
}
export function experienceParagraphs(value){
 const $=load(String(value||'').replace(/&#(?:13|10);/g,'\n'));
 $('script,style,iframe,object,noscript').remove();$('br').replaceWith('\n');$('p,div,li,tr,h1,h2,h3,h4').append('\n');
 return [...new Set($.root().text().split(/\r?\n/).map(text).filter(Boolean))];
}
export function mergeYouthDetail(record,row,checkedAt){
 if(String(row?.key1)!==record.id||text(row.pgmNm)!==record.title)throw new Error('Detail identity mismatch');
 const content=experienceParagraphs(row.info1),activities=experienceParagraphs(row.info2);
 const combined=[...new Set([...content,...activities])];
 if(!combined.length||dateOnly(text(row.edate).replaceAll('/','-'))!==record.end)throw new Error('Detail content or dates missing');
 const described=combined.join('\n').match(/(?:참가\s*)?대상\s*[:：]\s*([^\n]{1,150})/)?.[1];
 const address=text(row.addr),price=text(row.price)||record.price;
 const located=addressArea(address);
 return {...record,address,area:located==='지역 확인'?record.area:located,city:experienceCity(address)||record.city,phone:text(row.tel),content,activities,summary:combined.join(' ').slice(0,650),audience:described?text(described):record.audience,price,free:/^(무료|0|0원)$/.test(price),detailCheckedAt:checkedAt};
}
export const ruralThemes={harvest:{label:'수확·농사',test:/따기|캐기|수확|농사|영농|모내기/},food:{label:'음식 만들기',test:/김장|떡|두부|피자|빵|과자|쿠키|음식|먹거리|장담|고추장|된장/},craft:{label:'공예·만들기',test:/공예|도예|도자|목공|염색|향초|비누|만들기/},nature:{label:'자연·생태',test:/자연|생태|숲|곤충|탐조|별관측|갯벌/}};
