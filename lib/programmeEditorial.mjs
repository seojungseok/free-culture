import {cleanExperienceText,experienceIntro} from './experienceText.mjs';
import {KEYWORD_DEMAND} from './programmeKeywordDemand.mjs';

export const areaSearchNames={서울:'서울',부산:'부산',대구:'대구',인천:'인천',광주:'광주',대전:'대전',울산:'울산',세종:'세종',경기:'경기도',강원:'강원도',충북:'충북',충남:'충남',전북:'전북',전남:'전남',경북:'경북',경남:'경남',제주:'제주'};
const compact=value=>cleanExperienceText(value).replace(/\s+/g,'');
const text=value=>cleanExperienceText(value||'');
const cap=(value,max=150)=>value.length>max?value.slice(0,max-1).trimEnd()+'…':value;
const topics=[
 {id:'kimchi',label:'김장 체험',keyword:'김장체험',test:/김장/},
 {id:'strawberry',label:'딸기 따기 체험',keyword:'딸기체험',test:/딸기.{0,6}(따기|수확|체험)|딸기따기/},
 {id:'mudflat',label:'갯벌 체험',keyword:'갯벌체험',test:/갯벌|조개캐기|바지락캐기/},
 {id:'tofu',label:'두부 만들기 체험',keyword:'두부만들기체험',test:/두부.{0,4}만들/},
 {id:'pottery',label:'도자기 체험',keyword:'도자기체험',test:/도자|도예|물레|청자|백자/},
 {id:'wood',label:'목공 체험',keyword:'목공체험',test:/목공|목재|나무공예|원목|우드/},
 {id:'cooking',label:'요리·음식 만들기',keyword:'요리체험',test:/요리|제과|제빵|베이킹|피자|쿠키|떡만들|떡만들기|한과|경단|케이크|고추장|된장|장담그/},
 {id:'craft',label:'공예·만들기 체험',keyword:'공예체험',test:/공예|키링|키캡|컵.?만들|향수|향초|뜨개|염색|비누|마크라메/},
 {id:'astronomy',label:'천문·우주 체험',keyword:'천문체험',test:/천문|별관측|별.?관측|우주|행성|천체/},
 {id:'science',label:'과학 체험·교육',keyword:'과학체험',test:/과학(?!습)|실험|테라리움|보로노이|탐구/},
 {id:'nature',label:'생태·숲 체험',keyword:'생태체험',test:/생태|숲체험|숲교육|곤충|자연관찰|탐조|습지/},
 {id:'harvest',label:'농장·수확 체험',keyword:'농장체험',test:/수확|따기|캐기|모내기|농사|텃밭|벼베기/},
 {id:'coding',label:'코딩·AI 교육',keyword:'코딩체험',test:/코딩|프로그래밍|로봇|\bAI\b|인공지능|3D펜|메이커/i},
 {id:'music',label:'음악·악기 교육',keyword:'악기강좌',test:/음악|악기|우쿨렐레|오카리나|통기타|기타교실|기타연주|피아노|난타|젬베|합주|노래|밴드|드럼/},
 {id:'art',label:'미술·그림 강좌',keyword:'미술강좌',test:/미술|드로잉|수채|그림|민화|서양화|유화|캘리|서예|어반스케치|웹툰/},
 {id:'photo',label:'사진 강좌',keyword:'사진강좌',test:/사진|디카시|카메라/},
 {id:'reading',label:'독서·인문 교육',keyword:'평생학습강좌',test:/독서|그림책|동화|인문|문해|논술|글쓰기/},
 {id:'language',label:'외국어 강좌',keyword:'영어회화강좌',test:/영어|회화|중국어|일본어|이중언어/},
 {id:'mentoring',label:'학습 멘토링',keyword:'학습멘토링',test:/학습.{0,4}멘토|멘토.{0,4}학습|학습지원|방과후아카데미/},
 {id:'career',label:'청소년 진로 체험',keyword:'청소년진로체험',test:/진로|직업/},
 {id:'dance',label:'댄스·무용 강좌',keyword:'문화강좌',test:/댄스|무용|줌바/},
 {id:'sport',label:'스포츠 교육',keyword:'문화강좌',test:/체육|수영|스포츠|줄넘기|필라테스|요가|태권/},
 {id:'history',label:'역사·전통문화 체험',keyword:'체험학습',test:/역사|박물관|전통문화|민속/},
 {id:'culture',label:'문화예술 활동',keyword:'청소년체험',test:/공연|연극|송년|축제|문화행사/},
 {id:'digital',label:'컴퓨터·디지털 교육',keyword:'스마트폰교육',test:/스마트폰|컴퓨터|디지털|영상편집/},
];

export function programmeLocation(item) {
 const city=text(item.city)||text(item.address).match(/^\S+\s+(\S+(?:시|군|구))(?:\s+(\S+구))?/)?.slice(1).filter(Boolean).join(' ')||'';
 return [...new Set([areaSearchNames[item.area]||text(item.area),city].filter(Boolean))].join(' ');
}
function programmeTopics(item,isClass=false) {
 const title=text(item.title),body=[item.description,item.summary,...(item.content||[]),...(item.activities||[]),...(item.programs||[])].filter(Boolean).join(' ');
 // Provider goals can mention unrelated outcomes. An activity name or programme
 // title is stronger evidence than incidental vocabulary in those goals.
 const programmeNames=(item.programs||[]).join(' ');
 const matches=topics.map(topic=>({...topic,score:(topic.test.test(title)?20:0)+(topic.test.test(programmeNames)?8:0)+(topic.test.test(body)?2:0)})).filter(topic=>topic.score);
 for(const topic of matches)topic.score+=Math.min(2,Math.log10(1+(KEYWORD_DEMAND[topic.keyword]||0))*.4);
 matches.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 if(matches.length)return matches.slice(0,3);
 return [{id:'general',label:isClass?'문화·취미 강좌':item.kind==='rural'?'농촌·어촌 체험':item.kind==='science'?'과학관 교육':'청소년 체험 프로그램',keyword:isClass?'문화강좌':item.kind==='rural'?'농촌체험':item.kind==='science'?'과학관체험':'청소년체험',score:0}];
}
export function programmeWinter(item,today=new Date(Date.now()+9*3600000).toISOString().slice(0,10)) {
 const currentYear=Number(today.slice(0,4)),month=Number(today.slice(5,7)),year=month<=2?currentYear-1:currentYear;
 const named=/겨울\s*방학/.test([item.title,item.description,...(item.content||[])].filter(Boolean).join(' '));
 const current=item.active!==false&&(!item.end||item.end>=today);
 const overlaps=!!item.start&&!!item.end&&item.start<=`${year+1}-02-28`&&item.end>=`${year}-12-01`;
 const bounded=!!item.start&&item.start>=`${year}-12-01`&&item.end<=`${year+1}-02-28`;
 return {named:named&&current&&overlaps,planning:current&&overlaps&&bounded,year,season:month>=9||month<=2};
}
function knownAudience(value) {return !!value&&!/확인|미기재|예[:：]|누구나/.test(value);}
function shortSubject(item) {
 const title=text(item.title),description=experienceIntro([item.description||''],46);
 return /^(문화강좌|평생학습|평생학습프로그램|교육프로그램|문화교실|취미교실)$/.test(compact(title))&&description?description:title;
}
function focusInTitle(title,focus) {
 const aliases={kimchi:/김장/,strawberry:/딸기/,mudflat:/갯벌|조개|바지락/,tofu:/두부/,pottery:/도자|도예|청자|백자/,wood:/목공|우드|나무|원목/,cooking:/요리|제과|제빵|베이킹|피자|쿠키|떡|한과|경단|고추장/,craft:/공예|만들기|키링|키캡|향수|향초|뜨개|염색|비누/,astronomy:/천문|우주|별|행성/,science:/과학|실험|테라리움|탐구/,coding:/코딩|AI|인공지능|로봇|메이커|3D/i,music:/음악|악기|노래|피아노|난타|젬베|밴드|기타|우쿨렐레|오카리나/,art:/미술|그림|드로잉|서예|캘리|수채|민화|웹툰/,reading:/독서|인문|문해|그림책|동화|논술/,mentoring:/멘토|학습|방과후/,career:/진로|직업/,dance:/댄스|무용|줌바/,sport:/수영|스포츠|체육|요가|필라테스/,photo:/사진|디카시|카메라/,language:/영어|회화|중국어|일본어/,nature:/생태|숲|곤충|자연/,harvest:/수확|따기|캐기|농장|농사/,history:/역사|전통|박물관/,culture:/공연|축제|연극|송년|문화/,digital:/스마트폰|컴퓨터|디지털/};
 return aliases[focus.id]?.test(title)||focus.id==='general';
}

export function experienceEditorial(item,today) {
 const location=programmeLocation(item),selected=programmeTopics(item),focus=selected[0],winter=programmeWinter(item,today);
 const names=(item.programs||[]).map(text).filter(name=>name&&name.length<=32&&!/[<>_`]|\b\d{4}\b/.test(name));
 const primaryNames=names.filter(name=>topics.find(topic=>topic.id===focus.id)?.test.test(name)).slice(0,2);
 let title=`${location} ${text(item.title)}`.trim();
 if(item.kind==='rural')title+=` | ${primaryNames.length?primaryNames.join('·'):focus.label}`;
 else if(winter.named){title=title.replace(/겨울방학프로그램/g,'겨울방학 프로그램');const activities=['손뜨개','웹툰','보드게임','댄스','과학','목공'].filter(word=>(item.content||[]).some(line=>line.includes(word))).slice(0,2);if(activities.length&&!activities.every(word=>title.includes(word)))title+=' | '+activities.join('·');}
 else if(!focusInTitle(title,focus)&&title.length<48)title+=` | ${focus.label}`;
 if(item.active===false)title+=' (이전 등록자료)';
 const officialName=text(item.title),institution=text(item.institution);
 const mainActivity=item.kind==='rural'?(primaryNames.length?primaryNames:names.slice(0,3)).join('·'):experienceIntro(item.content||[],110);
 const introduction=item.kind==='rural'
  ? `${location}의 ${officialName}에서 ${focus.label} 관련 등록 정보를 확인할 수 있습니다. 공개자료에는 ${mainActivity||focus.label} 등이 등록되어 있습니다.`
  : `${location}의 ${institution||'운영기관'}에서 안내하는 ${officialName}입니다.`;
 const details=[knownAudience(item.audience)?`대상: ${item.audience}`:'',item.free?'참가비 무료':item.price?`참가비: ${item.price}`:'',item.start?`${item.start}~${item.end}`:''].filter(Boolean);
 const lead=item.kind==='rural'?`${names.slice(0,4).join(' · ')}${names.length?' · ':''}체험 내용과 위치·예약 문의처를 확인하세요.`:details.join(' · ')||text(item.summary);
 const paragraphs=[];
 if(item.kind==='rural') {
  if(['kimchi','tofu','cooking','strawberry'].includes(focus.id))paragraphs.push('먹거리 만들기나 수확 체험은 사용하는 재료, 시식 여부, 어린이 참여 조건을 먼저 확인해 주세요. 같은 마을에서도 계절과 예약 인원에 따라 운영하는 프로그램이 달라질 수 있습니다.');
  else if(['craft','wood','pottery'].includes(focus.id))paragraphs.push('만들기 체험을 고를 때는 사용할 도구와 재료, 보호자 참여 조건, 작품을 가져가는 방법을 문의해 보세요. 공개자료에는 체험 이름만 등록된 경우가 있어 실제 진행 방식은 마을의 안내가 필요합니다.');
  else if(['nature','harvest','mudflat'].includes(focus.id))paragraphs.push('자연·수확 체험은 방문 시기와 날씨에 따라 진행 여부가 달라질 수 있습니다. 체험복과 준비물, 취소 조건은 날짜를 정하기 전에 운영기관에 문의해 주세요.');
  else paragraphs.push('체험별 참가비, 운영 시기와 최소 인원을 문의한 뒤 방문 일정을 정해 주세요. 마을에 등록된 전체 체험이 같은 날 모두 열리는 것은 아닙니다.');
 }
 if(winter.named)paragraphs.push(`겨울방학 프로그램으로 안내된 활동입니다. 등록된 활동일은 ${item.start}부터 ${item.end}까지이며, 학년·연령 조건과 신청기간을 공식 안내에서 확인해 주세요.`);
 else if(winter.planning&&item.kind!=='rural')paragraphs.push(`겨울방학에 참여할 활동을 찾고 있다면 ${item.start}~${item.end}의 등록 일정이 학교 방학일과 맞는지 비교해 보세요. 방학 전·후 운영 여부와 남은 자리는 기관에 확인해야 합니다.`);
 return {title,officialName,location,focus:focus.label,topicId:focus.id,keyword:winter.named?'겨울방학프로그램':focus.keyword,relatedKeywords:[...(winter.named?['겨울방학프로그램']:[]),...selected.map(topic=>topic.keyword)],introduction,lead,paragraphs,winter,description:cap(`${title}. ${details.length?details.join(' · ')+'. ':''}${item.kind==='rural'?'등록된 체험과 예약 문의처를':'활동 내용과 신청 방법을'} 확인하세요.`)};
}

export function classEditorial(course,today) {
 const location=programmeLocation(course),selected=programmeTopics(course,true),focus=selected[0],subject=shortSubject(course),winter=programmeWinter(course,today);
 const oneDay=!!course.start&&course.start===course.end;
 const specific=/^(문화강좌|평생학습|교육프로그램|문화교실|취미교실)$/.test(compact(course.title));
 let title=`${location} ${subject}`.trim();
 if(specific&&!/강좌|교실|수업|교육/.test(subject))title+=' 강좌';
 if(oneDay&&!/원데이|일일|하루|팝업/.test(subject))title+=' | 원데이 클래스';
 else if(!focusInTitle(subject,focus)&&title.length<45)title+=` | ${focus.label}`;
 const tuition=course.tuition===0?'수강료 0원':course.tuition===null?'수강료 기관 확인':`수강료 ${Number(course.tuition).toLocaleString('ko-KR')}원`;
 const audience=knownAudience(course.audience)?`${course.audience} 대상`:'대상 조건 기관 확인';
 const date=course.start===course.end?course.start:`${course.start}~${course.end}`;
 const time=[course.startTime,course.endTime].filter(Boolean).join('~');
 const introduction=`${location}의 ${text(course.institution)||'운영기관'}에서 안내하는 ${subject}${/강좌$/.test(subject)?'':' 강좌'}입니다. ${knownAudience(course.audience)?'참여 대상은 '+course.audience+'입니다. ':''}${date}${time?' '+time:''} 일정과 ${tuition} 조건을 함께 확인할 수 있습니다.`;
 const paragraphs=[];
 if(oneDay)paragraphs.push('교육 시작일과 종료일이 같은 하루 일정으로 등록된 강좌입니다. 준비물과 재료비·교재비 포함 여부를 확인한 뒤 신청해 주세요.');
 if(winter.named)paragraphs.push(`겨울방학을 주제로 안내된 강좌입니다. ${date}의 교육기간과 학교 방학일을 비교하고 연령·학년 및 접수 조건을 확인해 주세요.`);
 else if(winter.planning&&/아동|어린이|초등|청소년|가족|유아/.test(course.audience))paragraphs.push(`겨울방학 활동을 찾는 가정은 ${date}의 교육기간과 학교별 방학일을 비교해 주세요. 등록된 수강료 외 비용과 보호자 동반 조건은 운영기관 확인이 필요합니다.`);
 return {title,officialName:text(course.title),location,focus:focus.label,topicId:focus.id,keyword:oneDay?'원데이클래스':focus.keyword,relatedKeywords:selected.map(topic=>topic.keyword),introduction,lead:`${audience} · ${tuition} · ${date}${time?' · '+time:''}`,paragraphs,winter,description:cap(`${title}. ${audience}, ${tuition}. ${date}${time?' '+time:''}. ${course.venue}의 수업 내용과 접수 방법을 확인하세요.`)};
}

export function uniqueClassEditorials(courses,today) {
 const entries=courses.map(course=>({course,editorial:classEditorial(course,today)}));
 const buckets=new Map();for(const entry of entries){const key=entry.editorial.title;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(entry);}
 for(const bucket of buckets.values())if(bucket.length>1){
  // Distinguish actual sessions with the fewest useful source facts. Do not add
  // keyword variants or opaque identifiers merely to manufacture uniqueness.
  const fields=[c=>c.venue,c=>`${c.start}~${c.end}`,c=>[c.startTime,c.endTime].filter(Boolean).join('~'),c=>c.weekdays,c=>c.audience,c=>`자료 기준 ${c.referenceDate}`];
  const keys=new Map(bucket.map(entry=>[entry,[]]));
  const distinguish=(group,offset=0)=>{
   if(group.length<2)return;
   for(let index=offset;index<fields.length;index++){
    const values=group.map(entry=>text(fields[index](entry.course)));
    if(index!==0&&new Set(values).size<2)continue;
    const smaller=new Map();
    group.forEach((entry,i)=>{if(values[i])keys.get(entry).push(values[i]);if(!smaller.has(values[i]))smaller.set(values[i],[]);smaller.get(values[i]).push(entry);});
    for(const subgroup of smaller.values())distinguish(subgroup,index+1);
    return;
   }
  };
  distinguish(bucket);
  bucket.forEach(entry=>{entry.editorial.title+=' | '+keys.get(entry).join(' · ');entry.editorial.description=cap(`${entry.editorial.title}. ${entry.editorial.lead}. 수업 내용과 접수 방법을 확인하세요.`);});
 }
 return new Map(entries.map(({course,editorial})=>[course.id,editorial]));
}

/**
 * @template {Record<string,any>} T
 * @param {{region?:string,kind?:string,records?:T[],today?:string}} options
 */
export function experienceDirectoryEditorial({region='',kind,records=[],today}) {
 const area=areaSearchNames[region]||region,place=area||'전국';
 const winterItems=records.filter(item=>programmeWinter(item,today).named).slice(0,3);
 const family=records.filter(item=>item.kind==='family').length,science=records.filter(item=>item.kind==='science').length,rural=records.filter(item=>item.kind==='rural').length;
 const kinds=[family?'가족·청소년 활동':'',science?'과학관 교육':'',rural?'농촌·어촌 체험':''].filter(Boolean);
 const title=region?`${area} 체험·교육 프로그램${winterItems.length?' | 겨울방학·청소년 활동':''}`:kind==='family'?'어린이·청소년 체험 프로그램 | 활동·방학 일정':kind==='science'?'과학관 교육·체험 프로그램 | 대상·일정·예약 안내':kind==='rural'?'농촌·어촌 체험마을 | 만들기·수확 프로그램':`전국 체험·교육 프로그램 | 가족·과학관·농촌 체험`;
 const example=records.filter(item=>item.kind==='rural').flatMap(item=>item.programs||[]).filter(name=>name.length<20&&!/[<>_`]/.test(name));
 const examples=[...new Set(example)].slice(0,4).join('·');
 const description=cap(`${place}의 ${kinds.join(', ')} ${records.length.toLocaleString('ko-KR')}개를 살펴보세요. ${examples?examples+' 등 체험 내용과 ':''}참여 대상·비용·활동일·신청처를 확인할 수 있습니다.`);
 const introduction=`${place}에 등록된 ${[family?`가족·청소년 프로그램 ${family}개`:'',science?`과학관 교육 ${science}개`:'',rural?`농촌·어촌 체험 ${rural}개`:''].filter(Boolean).join(', ')}를 모았습니다.${examples?' '+examples+' 같은 활동부터 관심 있는 체험을 골라보세요.':''}`;
 const winterNote=winterItems.length?'겨울방학을 주제로 안내된 프로그램입니다. 활동일과 접수기간을 따로 확인하고, 참여 가능한 학년·연령을 공식 모집 안내와 대조해 주세요.':'겨울방학에 참여할 활동을 찾는다면 교육·활동일이 학교별 방학일과 맞는지 먼저 확인해 주세요. 현재 등록된 프로그램이 모두 방학 동안 운영되는 것은 아니며, 새 모집 공고와 남은 자리는 기관 확인이 필요합니다.';
 return {title,description,introduction,winterItems,winterNote,kinds};
}
