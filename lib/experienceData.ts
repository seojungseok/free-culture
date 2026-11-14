import rural from '@/data/rural-experiences.json';
import youth from '@/data/youth-experiences.json';
import science from '@/data/science-experiences.json';
import {normalizeRural,normalizeYouth} from './experiences.mjs';
import {todayIso} from './publicDiscovery';
export type RuralExperience=NonNullable<ReturnType<typeof normalizeRural>>;
export type YouthExperience=NonNullable<ReturnType<typeof normalizeYouth>>;
export type ScienceExperience={id:string;title:string;institution:string;area:string;city:string;audience:string;period:string;start:string;end:string;registration:string;registrationEnd:string;method:string;price:string;sourceStatus:string;officialUrl:string;source:string;checkedAt:string};
export type ExperienceKind='family'|'science'|'rural';
export const experienceTopics={
 family:{title:'어린이·청소년 체험 프로그램',short:'가족·청소년 체험',description:'만들기·캠프·탐방·문화 활동을 날짜와 지역별로 찾아보세요. 청소년 활동 원문에 등록된 참가비·대상·운영기관을 함께 확인할 수 있습니다. 보호자 동반과 정확한 연령 조건은 운영기관에서 확인해 주세요.'},
 science:{title:'과학관 교육·체험 프로그램',short:'과학관 교육·행사',description:'직접 만들고 실험하는 과학관 프로그램을 찾아보세요. 현재 국립중앙과학관과 인천학생과학관의 공식 교육 일정에서 확인한 프로그램을 제공합니다. 접수 종료와 교육 진행 일정을 구분해 안내합니다.'},
 rural:{title:'농촌·어촌 체험마을',short:'농촌·어촌 체험',description:'과일 따기와 농산물 수확, 두부·떡 만들기, 공예와 생태 체험까지. 마을에 등록된 프로그램을 지역과 활동별로 찾아보세요. 체험 비용·운영 계절·개인 예약 가능 여부는 마을에 확인해 주세요.'},
};
export function ruralExperiences(){return rural.records as RuralExperience[];}
export function youthExperiences(){return (youth.records as YouthExperience[]).filter(record=>record.end>=todayIso()).filter(record=>/체험|가족|만들기|캠프|축제|탐방|문화|과학|공예|관측|공연|여행|요리|모험|메이커|목공|댄스|생태|환경|텃밭|자연|스포츠|스케이트|보드게임|진로/.test(record.title+' '+record.summary));}
export function scienceExperiences(){return (science.records as ScienceExperience[]).filter(record=>record.end>=todayIso());}
export const experienceUpdatedAt={rural:rural.refresh.checkedAt,family:youth.refresh.checkedAt,science:science.refresh.checkedAt};
