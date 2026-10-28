import test from 'node:test';
import assert from 'node:assert/strict';
import { collectEvidence } from './winter-enrichment.mjs';
import { checkSummaries, buildCourse } from './winter-course.mjs';

test('each quote identifies its internal file and retains only its own check time', () => {
  const text='이 박물관은 지역의 역사와 문화를 소개하는 전시 공간이다.';
  const courses=[{sourceCourseId:'course',stops:[{placeId:'7',name:'박물관'}]}];
  const original=[{id:'course',stops:[{placeId:'7',name:'박물관',overview:text}]}];
  const evidence=collectEvidence(courses,original,{'7':text},{'7':{overview:text,overviewCheckedAt:'2026-10-01T00:00:00Z'}},{});
  assert.deepEqual(evidence.get('7'),[text]);
  assert.deepEqual(evidence.provenance.get('7').get(text),{file:'data/place-details.json',placeId:'7',checkedAt:'2026-10-01T00:00:00Z'});
  const withoutDate=collectEvidence(courses,original,{'7':text},{'7':{overview:text,checkedAt:'2026-10-01T00:00:00Z'}},{});
  assert.equal(withoutDate.provenance.get('7').get(text).checkedAt,null);
});

test('matching a source quote cannot make an invented model paraphrase into a fact', () => {
  const quote='이 박물관은 지역의 역사와 문화를 소개하는 전시 공간이다.';
  const evidence=new Map([['7',[quote]]]);
  evidence.provenance=new Map([['7',new Map([[quote,{file:'data/place-details.json',placeId:'7',checkedAt:null}]])]]);
  const result=checkSummaries(JSON.stringify({stops:[{placeId:'7',quote,summary:'바다를 바라보며 예술품을 만날 수 있습니다.'}]}),evidence);
  assert.equal(result.get('7').summary,quote);
  assert.equal(checkSummaries(JSON.stringify({stops:[{placeId:'7',quote}]}),evidence).get('7').summary,quote);
  const course={sourceCourseId:'course',duration:'당일',area:'서울',stops:[{placeId:'7',name:'박물관',addr:'서울',mapx:'127',mapy:'37',kind:'문화시설',day:1}]};
  const article=buildCourse(course,new Date('2026-10-28T01:00:00Z'),result);
  assert.equal(article.status,'draft');
  assert.doesNotMatch(JSON.stringify(article),/바다를 바라보며/);
  assert.deepEqual(article.sections[1].sourceEvidence,{file:'data/place-details.json',placeId:'7',checkedAt:null});
});
