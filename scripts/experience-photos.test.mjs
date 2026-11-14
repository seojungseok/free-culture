import test from 'node:test';
import assert from 'node:assert/strict';
import {parseYouthPoster,preservedYouthPhoto,createYouthPublicFetch,youthPosterUrl} from './lib/youthPhotos.mjs';
import {enrichExperiencePhotos} from './enrichExperiencePhotos.mjs';
const record={id:'384587',title:'가족 만들기 체험',institution:'완주군청소년수련관',start:'2026-11-20',end:'2026-12-26'};
const photo='/youth/cmm/imgView/imgView.do?atchmnflId=00000000000008209405&thumbTySn=10';
const html=({id=record.id,title=record.title,institution=record.institution,src=photo}={})=>`<li><a onclick="fnDtl('7455','','${id}','001005');">${title}</a><dd>기관명 : ${institution}</dd><img src="${src}" alt="${title}"></li>`;
const at='2026-11-14T15:00:00Z';
test('a poster must match programme ID, title and institution and use the official image endpoint',()=>{
 assert.equal(parseYouthPoster(html(),record,at).imageSource,'https://www.youth.go.kr'+photo);
 for(const changed of [{id:'999'},{title:'다른 체험'},{institution:'동명 기관 다른 지점'},{src:'https://example.org/photo.jpg'}])assert.equal(parseYouthPoster(html(changed),record,at),null);
 assert.equal(parseYouthPoster(html()+html({src:photo.replace('8209405','8209406')}),record,at),null);
 assert.equal(youthPosterUrl('https://www.youth.go.kr@127.0.0.1/youth/cmm/imgView/imgView.do'), '');
 assert.equal(youthPosterUrl(photo+'&serviceKey=synthetic-secret'),'');
});
test('anonymous redirect cookies stay on their issuing host and unsafe redirects stop',async()=>{
 const requests=[];const get=createYouthPublicFetch(async(url,options)=>{
  requests.push({url,cookie:options.headers.cookie});
  if(requests.length===1)return new Response(null,{status:307,headers:{location:url,'set-cookie':'TMOSHCooKie=synthetic-cookie; Secure; HttpOnly'}});
  return new Response('ok',{status:200});
 });
 await get('https://www.youth.go.kr/youth/act/actSearch/allActSearchLst.yt');
 assert.equal(requests[0].cookie,'');assert.equal(requests[1].cookie,'TMOSHCooKie=synthetic-cookie');
 await get('https://youth.go.kr/youth/act/actSearch/allActSearchLst.yt');assert.equal(requests[2].cookie,'');
 const unsafe=createYouthPublicFetch(async()=>new Response(null,{status:302,headers:{location:'https://example.org/private'}}));
 await assert.rejects(()=>unsafe('https://www.youth.go.kr/youth/act/actSearch/allActSearchLst.yt'),/not allowed/);
});
test('fresh images survive collection and provider errors but changed programmes do not retain stale posters',async()=>{
 const old={...record,imageSource:'https://www.youth.go.kr'+photo,imageKind:'poster',imageCheckedAt:at};
 assert.equal(preservedYouthPhoto(record,old).imageSource,old.imageSource);
 assert.deepEqual(preservedYouthPhoto({...record,end:'2026-12-27'},old),{});
 const store={records:[old]};const result=await enrichExperiencePhotos(store,{max:1,now:()=>new Date(at),pause:async()=>{},fetchPage:async()=>{throw new Error('provider failed');}});
 assert.equal(result.failed,1);assert.equal(old.imageSource,'https://www.youth.go.kr'+photo);
 const fresh={...record,imageAttemptedAt:at};let calls=0;
 await enrichExperiencePhotos({records:[fresh]},{max:1,now:()=>new Date(at),fetchPage:async()=>{calls++;}});assert.equal(calls,0);
});
