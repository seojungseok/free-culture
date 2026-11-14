import {createHash} from 'node:crypto';

export const LEARNING_SOURCE='https://www.data.go.kr/data/15013110/standard.do';
export const text=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function safePublicUrl(value){
 try{const url=new URL(text(value));return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
export function dateOnly(value){
 const day=text(value);if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return '';
 const parsed=new Date(day+'T00:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===day?day:'';
}
export function addressArea(address){
 const value=text(address);
 if(value.startsWith('전남광주통합특별시'))return /^전남광주통합특별시\s+(광산구|동구|서구|남구|북구)(?:\s|$)/.test(value)?'광주':'전남';
 const match=value.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충청북|충청남|전라북|전북|전라남|전남|경상북|경상남|제주)/)?.[1];
 return ({충청북:'충북',충청남:'충남',전라북:'전북',전라남:'전남',경상북:'경북',경상남:'경남'})[match]||match||'지역 확인';
}
const culture=/문화|예술|공예|미술|그림|드로잉|수채화|민화|서예|캘리|도예|도자|뜨개|자수|퀼트|음악|악기|피아노|기타|우쿨렐레|오카리나|가야금|난타|노래|합창|댄스|무용|사진|요리|제과|제빵|커피|바리스타|꽃꽂이|원예|인문|독서|그림책|동화|역사|탐방|체험|과학|천문|자연|숲|보드게임|생활취미/;
export function normalizeLearningClass(row){
 const title=text(row.lctreNm),start=dateOnly(row.edcStartDay),end=dateOnly(row.edcEndDay),referenceDate=dateOnly(row.referenceDate);
 const description=text(row.lctreCo),address=text(row.edcRdnmadr),venue=text(row.edcPlace),institution=text(row.operInstitutionNm);
 if(!title||!start||!end||start>end||!referenceDate||!culture.test(title+' '+description)||!institution||!venue)return null;
 const rawCost=text(row.lctreCost).replaceAll(',','');
 const tuition=/^\d+$/.test(rawCost)?Number(rawCost):null;
 const id=createHash('sha256').update([title,start,end,institution,venue,text(row.edcStartTime),text(row.edcTrgetType)].join('|')).digest('hex').slice(0,20);
 return {id,title,description,start,end,startTime:text(row.edcStartTime),endTime:text(row.edcColseTime),weekdays:text(row.operDay),audience:text(row.edcTrgetType),method:text(row.edcMthType),tuition,address,area:addressArea(address),venue,institution,phone:text(row.operPhoneNumber),capacity:text(row.psncpa),registrationStart:dateOnly(row.rceptStartDate),registrationEnd:dateOnly(row.rceptEndDate),registrationMethod:text(row.rceptMthType),selection:text(row.slctnMthType),homepage:safePublicUrl(row.homepageUrl),referenceDate,source:LEARNING_SOURCE};
}
export function registrationState(course,today){
 if(course.end<today)return '교육 종료';
 if(course.registrationEnd&&course.registrationEnd<today)return '접수기간 지남';
 if(course.registrationStart&&course.registrationStart>today)return '접수예정';
 if(course.registrationStart&&course.registrationEnd&&course.registrationStart<=today&&course.registrationEnd>=today)return '접수기간 내';
 return '접수일 확인';
}
export function isFamilyClass(course){return /가족|부모|유아|유치|어린이|아동|초등|중학생|청소년|초[1-6]|초\d|유\d/.test(course.audience+' '+course.title);}
export function isWeekendClass(course){return /토|주말|매일|(^|[\s+,/·])일(?:요일)?(?=$|[\s+,/·])/.test(course.weekdays);}
