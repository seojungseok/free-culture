import {createHash} from 'node:crypto';
import {text,dateOnly,addressArea,safePublicUrl} from './learning.mjs';
export const RURAL_SOURCE='https://www.data.go.kr/data/15013113/standard.do';
export const YOUTH_SOURCE='https://www.data.go.kr/data/15073963/openapi.do';
const identity=parts=>createHash('sha256').update(parts.join('|')).digest('hex').slice(0,20);
export function normalizeRural(row){
 const title=text(row.exprnVilageNm),address=text(row.rdnmadr||row.lnmadr),programs=text(row.exprnCn).split('+').map(text).filter(Boolean),referenceDate=dateOnly(row.referenceDate);
 if(!title||!address||!programs.length||!referenceDate)return null;
 return {id:identity([title,address]),title,address,area:addressArea(row.ctprvnNm||address),city:text(row.signguNm),programs:[...new Set(programs)],programType:text(row.exprnSe),facilities:text(row.holdFclty),homepage:safePublicUrl(row.homepageUrl),phone:text(row.phoneNumber),institution:text(row.institutionNm||row.insttNm),referenceDate,source:RURAL_SOURCE};
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
 return {id,title,start,end,area:addressArea(row.sido),city:text(row.sigungu),institution:text(row.organNm),audience,price:price||'참가비 확인',free,summary:text(content.replace(/https?:\/\/[^\s<>]+/g,'')).slice(0,650),source:YOUTH_SOURCE,officialUrl:'https://www.youth.go.kr/youth/'};
}
export const ruralThemes={harvest:{label:'수확·농사',test:/따기|캐기|수확|농사|영농|모내기/},food:{label:'음식 만들기',test:/김장|떡|두부|피자|빵|과자|쿠키|음식|먹거리|장담|고추장|된장/},craft:{label:'공예·만들기',test:/공예|도예|도자|목공|염색|향초|비누|만들기/},nature:{label:'자연·생태',test:/자연|생태|숲|곤충|탐조|별관측|갯벌/}};
