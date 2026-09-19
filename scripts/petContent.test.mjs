import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {petQuality,petOverview} from '../lib/petContent.mjs';
const data=JSON.parse(fs.readFileSync('data/pet-travel.json','utf8'));
const all=Object.values(data.places);
const ready=all.filter(p=>petQuality(p).publishable);
test('thin records stay stored but are not publishable',()=>{
 assert(all.length>=535);assert(ready.length>=100);
 assert.equal(petQuality({title:'장소',address:'서울',summary:'반려동물과 함께 여행할 수 있는 장소'}).publishable,false);
});
test('published records contain unique source overview and concrete pet rules',()=>{
 assert.equal(new Set(ready.map(p=>petOverview(p))).size,ready.length);
 for(const p of ready){assert(petOverview(p).length>=100);assert(p.petRaw);assert(p.enrichedAt);assert(p.images.length>=3);assert(Object.keys(p.intro).length || p.info.length);}
});
test('explicitly forbidden or guide-dog-only places are withheld',()=>{
 for(const petRaw of [{acmpyTypeCd:'동반 불가'},{etcAcmpyInfo:'안내견만 동반 가능'}]) assert.equal(petQuality({...ready[0],petRaw}).publishable,false);
});
test('IDs and unprocessed records are preserved',()=>{
 const before=JSON.parse(execFileSync('git',['show','HEAD:data/pet-travel.json'],{encoding:'utf8',maxBuffer:10e6}));
 assert.deepEqual(Object.keys(data.places),Object.keys(before.places));
 for(const p of all.filter(p=>!p.enrichedAt))assert.deepEqual(p,before.places[p.id]);
});
test('regional/list/sitemap consumers share the gate and detail no longer invents copy',()=>{
 const lib=fs.readFileSync('lib/petTravel.ts','utf8');assert(lib.includes('filter(p => petQuality(p).publishable)'));
 const detail=fs.readFileSync('app/pet-travel/[id]/page.tsx','utf8');
 assert(detail.includes('petOverview(spot)'));assert(detail.includes('index:false'));
 assert(!detail.includes('가을에는 한결'));assert(!detail.includes('반려동물과 함께 방문을 계획하기 좋은'));
 assert(!fs.readFileSync('app/api/pet-travel/route.ts','utf8').includes('fetch('));
});
test('basic refresh preserves description and picture request has no unsupported type parameter',()=>{
 assert(fs.readFileSync('scripts/collectPetTravel.mjs','utf8').includes("summary: old.overview || old.summary || ''"));
 const client=fs.readFileSync('scripts/lib/tourClient.mjs','utf8').split('export async function petImageListRaw')[1].split('export async function petAreaBasedPage')[0];
 assert(!client.includes('{ contentId, contentTypeId,'));
});
test('pet pages use prebuilt JSON with no client refetch or timed regeneration',()=>{
 const detail=fs.readFileSync('app/pet-travel/[id]/page.tsx','utf8');
 assert(detail.includes('revalidate = false'));assert(detail.includes('getPetTravelPlaces().map(p=>({id:p.id}))'));
 assert(!detail.includes('fetchPetTravelDetail'));
 assert(!fs.readFileSync('components/PetTravelBrowser.tsx','utf8').includes('fetch('));
 assert(fs.readFileSync('app/api/pet-travel/route.ts','utf8').includes("dynamic = 'force-static'"));
});
test('every qualifying result is reachable without the old 120-place cap',()=>{
 const browser=fs.readFileSync('components/PetTravelBrowser.tsx','utf8');
 assert(!browser.includes('.slice(0, 120)'));assert(browser.includes('여행지 더 보기'));assert(browser.includes('list.slice(0,visibleCount)'));
});
