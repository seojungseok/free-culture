import test from 'node:test';
import assert from 'node:assert/strict';
import {collectRestaurants} from './collectRestaurants.mjs';
import {normalizeIntro} from './lib/tourClient.mjs';
import {eventVenueUrl} from './lib/cultureSource.mjs';

test('national restaurant results retain prior IDs and allocate new slots across regions', async () => {
  const rows = [['1','11'],['2','11'],['3','11'],['4','26']].map(([id,region]) => ({
    contentid:id, lDongRegnCd:region, lclsSystm3:'FD020200', title:'음식점 '+id, firstimage:'https://example.org/photo',
  }));
  const result = await collectRestaurants({restaurants:[{id:'1',addr:'기존 주소'},{id:'old'}]}, {
    max:4, daily:1, fetchPage:async (params,budget) => {
      assert.equal(params.areaCode,undefined); budget.used++; return {items:rows,total:4};
    },
  });
  assert.deepEqual(result.snapshot.restaurants.map(r => r.id),['1','old','2','4']);
  assert.equal(result.snapshot.restaurants[0].addr,'기존 주소');
  assert.equal(result.snapshot.restaurants[3].area,'부산');
  assert.equal(result.snapshot.restaurants[3].cat3,'A05020300');
  assert.equal(result.snapshot.refresh.complete,true);
  await assert.rejects(collectRestaurants({restaurants:[{id:'old'}]}, {
    daily:1,max:4,fetchPage:async()=>({items:[],total:0}),
  }));
});

test('source facts retain separate lines, and venue homepages belong only to matching places', () => {
  assert.deepEqual(normalizeIntro('15',{bookingplace:'현장 매표소',spendtimefestival:'75분',subevent:'1부<br>2부'}),{
    duration:'75분',bookingPlace:'현장 매표소',sideEvents:'1부\n2부',
  });
  assert.deepEqual(normalizeIntro('39',{opentimefood:'11:00~14:00<br/>17:00~20:00'}),{usetime:'11:00~14:00\n17:00~20:00'});
  const previous={place:'이전 공연장',venueUrl:'https://old.example/'};
  assert.equal(eventVenueUrl('새 공연장',undefined,previous),'');
  assert.equal(eventVenueUrl('새 공연장',{place:'새 공연장',placeUrl:'https://venue.example'}),'https://venue.example/');
});
