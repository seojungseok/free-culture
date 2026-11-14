import {text,safePublicUrl,addressArea} from './learning.mjs';
export const ACCESSIBLE_SOURCE='https://www.data.go.kr/data/15101897/openapi.do';
export const ACCESS_FIELDS={parking:'장애인 주차구역',publictransport:'대중교통',route:'접근·이동 경로',ticketoffice:'매표소',promotion:'홍보물',wheelchair:'휠체어 대여',exit:'출입구',elevator:'엘리베이터',restroom:'장애인 화장실',auditorium:'관람석',room:'객실',handicapetc:'기타 이동 편의',braileblock:'점자블록',helpdog:'보조견 동반',guidehuman:'안내 인력',audioguide:'음성 안내',bigprint:'큰 글자 안내',brailepromotion:'점자 안내',guidesystem:'유도·안내 설비',blindhandicapetc:'시각 관련 기타 안내',signguide:'수어 안내',videoguide:'영상 안내',hearingroom:'청각 관련 객실',hearinghandicapetc:'청각 관련 기타 안내',stroller:'유모차 대여',lactationroom:'수유실',babysparechair:'유아용 의자',infantsfamilyetc:'영유아 가족 기타 안내'};
export const familyFields=['stroller','lactationroom','babysparechair','infantsfamilyetc'];
export function normalizeAccessible(list,detail,now){
 const id=text(list.contentid),title=text(list.title),address=text(list.addr1);
 if(!/^\d+$/.test(id)||!title||!address)return null;
 const facts=Object.fromEntries(Object.keys(ACCESS_FIELDS).map(key=>[key,text(detail[key])]).filter(([,value])=>value));
 if(!Object.keys(facts).length)return null;
 return {id,title,address,area:addressArea(address),type:text(list.contenttypeid),facts,checkedAt:now,modifiedAt:text(list.modifiedtime),source:ACCESSIBLE_SOURCE,officialUrl:'https://access.visitkorea.or.kr/',image:safePublicUrl(list.firstimage),copyright:text(list.cpyrhtDivCd)};
}
