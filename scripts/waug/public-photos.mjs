import fs from 'node:fs';
const env=fs.readFileSync('.env.local','utf8');
const key=env.match(/^DATA_GO_KR_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g,'');
if(!key)throw new Error('기존 공공데이터 키 없음');
const spots=JSON.parse(fs.readFileSync('data/places.json','utf8')).spots;
const chosen=spots.filter(p=>/^(남이섬|서울랜드|허브아일랜드|가나아트파크|안성팜랜드|루덴시아|한국민속촌)$/.test(p.title));
const results=[];
for(const p of chosen){
  const url=new URL('https://apis.data.go.kr/B551011/KorService2/detailCommon2');
  for(const [k,v]of Object.entries({serviceKey:decodeURIComponent(key),MobileOS:'ETC',MobileApp:'mwohaji',_type:'json',contentId:p.id}))url.searchParams.set(k,v);
  try{
    const res=await fetch(url,{signal:AbortSignal.timeout(20000)});const raw=await res.text();
    const json=JSON.parse(raw);if(json.OpenAPI_ServiceResponse)console.log(JSON.stringify(json.OpenAPI_ServiceResponse).replaceAll(key,'[redacted]').slice(0,500));const items=json.response?.body?.items?.item;const detail=Array.isArray(items)?items[0]:items;
    results.push({place:p,detail:detail||null,checkedAt:new Date().toISOString(),error:detail?null:(json.response?.header?.resultMsg||json.error?.message||json.message||'응답에 detailCommon2 항목 없음'),responseKeys:Object.keys(json)});
    console.log(p.title,detail?.cpyrhtDivCd||detail?.cpyrhtdivcd||'권리코드 없음');
  }catch(e){results.push({place:p,detail:null,error:e.message});console.log(p.title,'확인 실패');}
}
fs.writeFileSync('data/waug/public-photo-research.json',JSON.stringify(results,null,2)+'\n');
