import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cleanExperienceText,experienceFact,experienceContentBlocks,experienceIntro} from '../lib/experienceText.mjs';
import {experienceParagraphs} from '../lib/experiences.mjs';

test('provider bullet corruption is removed without deleting questions or URL query strings',()=>{
 assert.equal(cleanExperienceText('? 기 간 : 2026. 10월 ~ 12월'),'기 간 : 2026. 10월 ~ 12월');
 assert.equal(cleanExperienceText('??모집대상 : 청소년'),'모집대상 : 청소년');
 assert.equal(cleanExperienceText('☎?문 의 : 02-123-4567'),'☎ 문 의 : 02-123-4567');
 for(const sentence of ['“나는 무엇을 좋아할까?”','가족과 무엇을 만들까요?','가족과 무엇을 만들까요 ? 공식 안내를 확인하세요.','https://example.org/apply?id=1&kind=family']) assert.equal(cleanExperienceText(sentence),sentence);
 assert.equal(cleanExperienceText('기초 &rarr; 실습 &amp; 발표'),'기초 → 실습 & 발표');
 assert.deepEqual(experienceParagraphs('<p>? 장 소 : 체험관</p><p>무엇을 만들까요?</p><p>?</p><script>bad()</script>'),['장 소 : 체험관','무엇을 만들까요?']);
});

test('compressed provider bullet lists become readable items without changing their words',()=>{
 assert.deepEqual(experienceContentBlocks(['․ AI 기초․ 음악 제작․ 개인 발표']),[{type:'list',items:['AI 기초','음악 제작','개인 발표']}]);
 assert.equal(experienceIntro(['․ AI 기초․ 음악 제작․ 개인 발표']),'AI 기초 · 음악 제작 · 개인 발표');
 assert.equal(experienceIntro(['? 기간: 2026년 12월']), '');
});

test('labels become facts while ratios, narrative colons and links stay intact',()=>{
 assert.deepEqual(experienceFact('? 대 상 : 만 13세 ~ 24세'),['대상','만 13세 ~ 24세']);
 assert.equal(experienceFact('대학생 : 중학생 1:2 방식으로 과목 및 시간 선택'),null);
 assert.equal(experienceFact('https://example.org/?id=1'),null);
 assert.deepEqual(experienceContentBlocks(['? 기간: 2026년 12월','? 장소: 청소년수련관','활동은 무엇인가요?']),[
  {type:'facts',items:[['기간','2026년 12월'],['장소','청소년수련관']]},
  {type:'paragraph',items:['활동은 무엇인가요?']},
 ]);
});

test('the reported mentoring article keeps every activity and official application URL',()=>{
 const rows=JSON.parse(fs.readFileSync('data/youth-experiences.json','utf8')).records;
 const item=rows.find(row=>row.id==='384587');
 const content=experienceContentBlocks(item.content),activities=experienceContentBlocks(item.activities,true);
 assert.equal(content[0].type,'facts');
 assert.deepEqual(content[0].items.map(([label])=>label),['기간','장소','인원','내용']);
 assert.equal(activities.flatMap(block=>block.items).length,item.activities.length);
 assert(activities.flatMap(block=>block.items).includes('대학생 : 중학생 1:2 방식으로 과목 및 시간 선택'));
 assert(item.officialUrl.includes('sKeyword='));
 for(const row of rows) {
  for(const line of [...(row.content||[]),...(row.activities||[])]) assert(!/^[?？\ufffd]/u.test(cleanExperienceText(line)),row.id);
 }
});
