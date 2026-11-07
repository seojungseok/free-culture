import fs from 'node:fs';
import {isPublicWinterCourse} from '../lib/winter-course-validation.mjs';

// Explicit review ledger (never inferred from Type1 or a matching title):
// {places:{[id]:{approved:true,reviewedAt,officialUrl}},
//  photos:{[localSrc]:{approved:true,reviewedAt,caption,seasonMismatch:boolean}},
//  courses:{[slug]:{sourcesApproved:true,reviewedAt,naverSearchReviewed:true,naverSearchUrl}}}
// All absent or incomplete approvals leave a course as a draft.
const read=(file,fallback)=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fallback;
const evidence=read('data/capital-tour-evidence-20261107.json',{});
const reviews=read('data/capital-review-approvals-20261107.json',{});
const naverEvidence=read('data/capital-naver-review-20261107.json',{}).entries||[];
const rejected=new Set((read('data/capital-photo-review-decisions-20261107.json',{}).rejections||[]).map(x=>x.src));
const places=read('data/places.json',{}).spots||[];
const stamp=new Date().toISOString();
const validDate=value=>Number.isFinite(Date.parse(value||''))&&Date.parse(value)<=Date.now();
const https=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
const outputs=[
 ['data/capital-daytrip-editorial-20261107.json','data/winter-metropolitan-daytrips.json'],
 ['data/winter-metropolitan-overnight-editorial-20261107.json','data/winter-metropolitan-overnights.json']
];
const checkOnly=process.argv.includes('--check');
if(!checkOnly&&(outputs.some(([,dest])=>fs.existsSync(dest))||fs.existsSync('data/capital-build-report-20261107.json')))throw Error('Output exists; preserving existing user data');
const result=[];const reports=[];
for(const [source,dest] of outputs){
 const articles=read(source,[]);if(!Array.isArray(articles)||articles.length!==10)throw Error('Expected ten editorial drafts: '+source);
 const courses=articles.map(article=>{
  const problems=[];const sourceReview=reviews.courses?.[article.slug];
  if(sourceReview?.sourcesApproved!==true||!validDate(sourceReview.reviewedAt))problems.push('공식 출처 검토 미승인');
  if(!Array.isArray(article.sources)||article.sources.some(s=>!https(s.url)||!validDate(s.checkedAt)))problems.push('공식 출처 또는 확인일 누락');
  const stops=article.stops.map(stop=>{
   const key=stop.query||stop.name;const placeId=String(stop.placeId||evidence.searches?.[key]?.selectedId||'');
   const cache=places.find(p=>String(p.id)===placeId);
   const searched=(evidence.searches?.[key]?.candidates||[]).find(p=>String(p.id)===placeId);
   const record=cache||searched||evidence.places?.[placeId];const placeReview=reviews.places?.[placeId];
   if(!record||!Number(record.mapx)||!Number(record.mapy))problems.push(`${stop.name}: 장소 ID 또는 좌표 미확인`);
   if(placeReview?.approved!==true||!validDate(placeReview.reviewedAt)||!https(placeReview.officialUrl))problems.push(`${stop.name}: 장소·공식 주소 검토 미승인`);
   const candidatePhotos=Object.values(evidence.downloads||{}).filter(p=>p.id===placeId&&p.src&&p.copyrightType==='Type1'&&!rejected.has(p.src));
   const approved=candidatePhotos.map(p=>{
    const approval=reviews.photos?.[p.src];
    const rights=(evidence.images?.[placeId]?.images||[]).some(image=>image.sourceUrl===p.sourceUrl&&image.copyrightType==='Type1');
    if(approval?.approved!==true||String(approval.placeId||'')!==placeId||!validDate(approval.reviewedAt)||!approval.caption?.trim()||!rights||!fs.existsSync('public'+p.src))return null;
    const caption=approval.seasonMismatch&&!approval.caption.includes('계절이 다른 자료 사진')?approval.caption+' · 계절이 다른 자료 사진':approval.caption;
    return {src:p.src,sourceUrl:p.sourceUrl,placeId,alt:`${stop.name} 자료 사진`,caption,credit:'한국관광공사 TourAPI · 공공누리 제1유형',kind:'tour-api',copyrightType:'Type1',licenseUrl:'https://www.kogl.or.kr/info/license.do',reviewed:true,reviewedAt:approval.reviewedAt,width:p.width,height:p.height};
   }).filter(Boolean);
   const {query,...rest}=stop;
   return {...rest,placeId,addr:record?.addr||'',mapx:String(record?.mapx||''),mapy:String(record?.mapy||''),officialUrl:placeReview?.officialUrl,...(approved[0]?{image:approved[0].src,photo:approved[0]}:{}),...(approved.length>1?{gallery:approved.slice(1)}:{})};
  });
  const photos=stops.flatMap(s=>[s.photo,...(s.gallery||[])]).filter(Boolean);
  if(article.duration==='당일'&&new Set(photos.map(p=>p.src)).size<2)problems.push('승인된 서로 다른 사진 2장 미만');
  if(article.duration==='1박2일'&&new Set(photos.map(p=>p.src)).size<3)problems.push('승인된 서로 다른 사진 3장 미만');
  const sources=(article.sources||[]).filter(source=>!Array.isArray(sourceReview?.approvedSourceUrls)||sourceReview.approvedSourceUrls.includes(source.url));
  for(const stop of stops)if(stop.officialUrl&&!sources.some(source=>source.url===stop.officialUrl))sources.push({title:`${stop.name} 공식 안내`,url:stop.officialUrl,checkedAt:reviews.places[stop.placeId].reviewedAt});
  if(sources.length<2)problems.push('공식 출처 2개 미만');
  const course={...article,sources,id:`capital-${article.slug}`,status:'published',sourceCourseId:`capital-${article.slug}`,publishedAt:stamp,updatedAt:stamp,lastReviewedAt:stamp,stops,...(photos[0]?{image:photos[0]}:{}),validation:{version:article.duration==='당일'?4:3,sourceKind:article.duration==='당일'?'official-tour-api':'naver-official-tour-api',checkedAt:stamp,checks:['identity','coordinates','route','text','official-sources','photos',...(article.duration==='당일'?['daytrip']:['overnight','day-plan'])]}};
  if(article.duration==='1박2일'&&(sourceReview?.naverSearchReviewed!==true||!https(sourceReview.naverSearchUrl)||new URL(sourceReview.naverSearchUrl).hostname!=='search.naver.com'||!naverEvidence.some(row=>row.slug===article.slug&&row.url===sourceReview.naverSearchUrl&&row.status===200&&row.results?.length)))problems.push('네이버 검색 근거 미확인');
  if(!problems.length&&!isPublicWinterCourse(course))problems.push('기존 공개 조건 검증 실패');
  if(problems.length){course.status='draft';delete course.validation;}
  reports.push({slug:article.slug,status:course.status,reasons:[...new Set(problems)]});return course;
 });
 result.push([dest,{generatedAt:stamp,courses}]);
}
if(!checkOnly){
 for(const [dest,data] of result)fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync('data/capital-build-report-20261107.json',JSON.stringify({generatedAt:stamp,total:reports.length,published:reports.filter(x=>x.status==='published').length,drafts:reports.filter(x=>x.status==='draft').length,courses:reports},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({checkOnly,total:reports.length,published:reports.filter(x=>x.status==='published').length,drafts:reports.filter(x=>x.status==='draft').length,...(checkOnly?{courses:reports}:{})}));
