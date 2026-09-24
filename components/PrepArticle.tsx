import Link from 'next/link';
import Image from 'next/image';
import PrepImage from './PrepImage';
import PrepChecklist from './PrepChecklist';
import {FoodChecklistDetails} from './FoodChecklistDetails';
import type {PrepArticle as Article} from '@/lib/weekend-prep/types';
import {prepCategoryLabel} from '@/lib/weekend-prep/categoryLabel';
import AdSlot from './AdSlot';

function dishName(title:string){
 return title.split('|')[0].replace(/^(가을 대표 요리|가을 캠핑|캠핑)\s*/,'').replace(/\s*재료 체크리스트.*$/,'').trim();
}

function quickCookingGuide(name:string){
 const soupLike=/(탕|찌개|전골|라면|수제비|떡볶이)/.test(name);
 return soupLike
  ? `${name}은 국물 재료와 익는 데 시간이 필요한 주재료를 먼저 끓이고, 빨리 익는 채소·두부·면·대파는 마무리에 더해 보세요. 간은 마지막에 확인해 조절하고, 제품별 손질·가열 방법은 포장 안내를 우선으로 확인하세요.`
  : `${name}은 주재료와 채소를 쓰기 좋게 준비한 뒤, 사용하는 팬이나 그릴을 예열해 익는 속도에 맞춰 넣어 보세요. 간과 소스는 마지막에 조절하고, 제품별 손질·가열 방법은 포장 안내를 우선으로 확인하세요.`;
}
const completedFoodPhotos:Record<string,string>={
 'autumn-flower-crab-soup-ingredient-checklist':'autumn-crab-soup-checklist-finished','camping-fishcake-soup-ingredient-checklist':'camp-fishcake-soup-finished','camping-budae-jjigae-ingredient-checklist':'camp-budae-soup-finished','camping-beef-mushroom-hotpot-ingredient-checklist':'camp-beef-mushroom-hotpot-finished','camping-seafood-hotpot-ingredient-checklist':'camp-seafood-hotpot-finished','camping-seafood-ramen-ingredients':'camping-seafood-ramen-finished','camping-mussel-soup-ingredients':'camping-mussel-soup-finished','camping-kimchi-fried-rice-ingredients':'camping-kimchi-fried-rice-finished','camping-squid-stir-fry-ingredients':'camping-squid-stir-fry-finished','camping-chicken-skewer-ingredients':'camping-chicken-skewer-finished','camping-kimchi-pancake-ingredients':'camping-kimchi-pancake-finished','camping-pork-belly-bbq-ingredients':'camping-pork-belly-bbq-finished','camping-tofu-kimchi-ingredients':'camping-tofu-kimchi-finished','autumn-camping-pork-kimchi-stew-ingredient-checklist':'autumn-20260919-pork-kimchi-stew-finished','autumn-camping-doenjang-stew-ingredient-checklist':'autumn-20260919-doenjang-stew-finished','autumn-camping-perilla-mushroom-soup-ingredient-checklist':'autumn-20260919-perilla-mushroom-soup-finished','autumn-camping-potato-sujebi-ingredient-checklist':'autumn-20260919-potato-sujebi-finished','autumn-camping-shrimp-butter-grill-ingredient-checklist':'autumn-20260919-shrimp-butter-grill-finished','autumn-camping-mackerel-potato-braise-ingredient-checklist':'autumn-20260919-mackerel-potato-braise-finished','autumn-camping-chicken-potato-stew-ingredient-checklist':'autumn-20260919-chicken-potato-stew-finished','autumn-camping-tteokbokki-ingredient-checklist':'autumn-20260919-tteokbokki-finished','autumn-camping-zucchini-pancake-ingredient-checklist':'autumn-20260919-zucchini-pancake-finished','autumn-camping-corn-cheese-ingredient-checklist':'autumn-20260919-corn-cheese-finished',
 'autumn-20260920-jeyuk-bokkeum-ingredient-checklist':'autumn-20260920-jeyuk-serving',
 'autumn-20260920-sundae-bokkeum-ingredient-checklist':'autumn-20260920-sundae-serving',
 'autumn-20260920-dakgalbi-ingredient-checklist':'autumn-20260920-dakgalbi-serving',
 'autumn-20260920-chicken-kimchi-fried-rice-ingredient-checklist':'autumn-20260920-chicken-kimchi-rice-serving',
 'autumn-20260920-mussel-seaweed-soup-ingredient-checklist':'autumn-20260920-mussel-seaweed-serving'
};

type CookingGuideData={title:string;steps:string[]};
const cookingGuides:Record<string,CookingGuideData>={
 'autumn-flower-crab-soup-ingredient-checklist':{title:'간단한 꽃게탕 끓이는 방법',steps:['냉동 꽃게는 포장 안내에 따라 해동합니다. 손질이 필요한 경우 흐르는 물에 헹군 뒤 아가미와 배딱지를 정리하고, 집게는 조리 가위로 잘라 준비하세요.','냄비에 물과 국물육수 다시팩을 넣어 포장에 안내된 방식으로 국물 바탕을 냅니다. 무를 곁들인다면 먼저 익혀 주세요.','국물이 끓으면 꽃게를 넣고 완전히 익을 때까지 끓입니다. 매운탕 양념은 한 번에 다 넣지 말고 일부부터 풀어 간을 맞춰 보세요.','애호박과 대파를 넣고 한소끔 더 끓인 뒤, 미나리는 불을 끄기 직전에 더합니다. 마지막에 국물 간을 확인해 조절하세요.']},
 'camping-fishcake-soup-ingredient-checklist':{title:'간단한 어묵탕 끓이는 방법',steps:['모둠 어묵은 포장 안내에 따라 준비하고, 대파는 어슷하게 썹니다.','냄비에 물과 국물육수 다시팩을 넣어 국물 바탕을 낸 뒤 어묵을 넣고 끓입니다.','어묵이 충분히 데워지면 대파를 넣고, 잔치국수 분말은 국물 맛을 보며 조금씩 더하세요.','어묵의 해동·가열과 분말 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-budae-jjigae-ingredient-checklist':{title:'간단한 부대찌개 끓이는 방법',steps:['부대찌개 구성과 슬라이스 햄의 포장 안 재료를 먼저 확인하고, 채소는 먹기 좋게 썹니다.','냄비에 물과 국물육수 다시팩을 넣어 끓인 뒤 햄과 준비한 재료를 넣습니다.','재료가 충분히 데워지면 체다 슬라이스 치즈를 올려 녹이고, 국물 간을 확인해 조절하세요.','구성품·가열 방법과 치즈 사용 여부는 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-beef-mushroom-hotpot-ingredient-checklist':{title:'간단한 소고기 버섯전골 끓이는 방법',steps:['소고기 샤브샤브 구성과 전골용 모둠버섯의 포장 상태를 확인하고, 채소는 먹기 좋게 준비합니다.','냄비에 물과 국물육수 다시팩을 넣어 국물 바탕을 낸 뒤 버섯과 채소를 먼저 넣습니다.','국물이 끓으면 소고기를 한 점씩 넣고, 대파는 마무리에 더해 주세요.','고기의 보관·가열과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-seafood-hotpot-ingredient-checklist':{title:'간단한 해물탕 끓이는 방법',steps:['모둠해물탕과 손질 오만둥이는 포장 안내에 따라 해동·준비하고, 채소는 씻어 둡니다.','냄비에 물과 국물육수 다시팩을 넣어 끓인 뒤 해물과 채소를 넣습니다.','국물이 끓으면 매운탕 양념을 일부부터 풀어 간을 확인하고, 미나리는 마지막에 더하세요.','해물의 해동·가열과 양념 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-seafood-ramen-ingredients':{title:'간단한 해물라면 끓이는 방법',steps:['모둠해물은 포장 안내에 따라 준비하고, 대파는 송송 썹니다.','냄비에 물을 끓인 뒤 봉지라면의 면과 스프를 넣습니다.','면이 풀리기 시작하면 모둠해물을 넣고, 대파는 마무리에 더해 주세요.','해물의 해동·가열과 라면의 물 양은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-mussel-soup-ingredients':{title:'간단한 홍합탕 끓이는 방법',steps:['손질 홍합살은 포장 안내에 따라 준비하고, 양파와 대파는 먹기 좋게 썹니다.','냄비에 물과 육수 다시팩을 넣어 국물 바탕을 낸 뒤 양파를 먼저 넣습니다.','국물이 끓으면 홍합살을 넣고 충분히 데운 뒤 대파를 더하세요.','홍합살의 해동·가열과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-kimchi-fried-rice-ingredients':{title:'간단한 김치볶음밥 만드는 방법',steps:['배추김치와 대파는 잘게 썰고, 즉석밥은 포장 안내에 따라 준비합니다.','팬에 식용유를 두르고 김치와 대파를 먼저 볶아 수분을 정리합니다.','밥을 넣어 고루 볶고, 달걀은 따로 익혀 곁들이거나 함께 섞어 주세요.','마지막에 김가루를 더해 마무리하고, 즉석밥과 달걀의 가열 안내는 포장을 우선으로 확인하세요.']},
 'camping-squid-stir-fry-ingredients':{title:'간단한 오징어볶음 만드는 방법',steps:['손질 오징어는 포장 안내에 따라 준비하고, 양파와 대파는 먹기 좋게 썹니다.','팬을 예열해 양파를 먼저 볶고 손질 오징어를 넣어 익힙니다.','오징어볶음 소스는 한 번에 많이 넣지 말고 조금씩 넣어 고루 볶으세요.','오징어의 해동·가열과 소스 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-chicken-skewer-ingredients':{title:'간단한 닭꼬치구이 만드는 방법',steps:['닭꼬치·염통 모둠꼬치는 포장 안내에 따라 해동하고, 새송이버섯과 파프리카는 먹기 좋게 썹니다.','예열한 그리들에 꼬치와 채소를 올려 뒤집어 가며 익힙니다.','닭꼬치가 충분히 익은 뒤 바비큐 양념소스를 발라 한 번 더 구워 주세요.','꼬치의 해동·가열과 소스 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-kimchi-pancake-ingredients':{title:'간단한 김치전 만드는 방법',steps:['배추김치와 대파는 잘게 썰고, 부침가루는 포장 안내에 따라 반죽합니다.','팬을 예열해 식용유를 두르고 반죽을 얇게 펼칩니다.','가장자리가 익으면 뒤집어 두 면을 고르게 익혀 주세요.','부침가루의 물 비율과 가열 방법은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-pork-belly-bbq-ingredients':{title:'간단한 삼겹살 바비큐 굽는 방법',steps:['구이용 삼겹살은 포장 안내에 따라 준비하고, 새송이버섯과 파프리카는 먹기 좋게 손질합니다.','예열한 그리들에 삼겹살을 올려 뒤집어 가며 충분히 익힙니다.','기름이 너무 많으면 정리한 뒤 채소와 배추김치를 곁들여 구워 주세요.','고기의 보관·가열 방법은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'camping-tofu-kimchi-ingredients':{title:'간단한 두부김치 만드는 방법',steps:['배추김치·양파·대파는 먹기 좋게 썰고, 부침용 두부는 포장 상태를 확인합니다.','팬에 식용유를 두르고 양파와 김치를 먼저 볶습니다.','두부는 포장 안내에 따라 데우거나 굽고, 볶은 김치를 곁들여 담아 주세요.','두부의 보관·가열과 김치 조리 방법은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-pork-kimchi-stew-ingredient-checklist':{title:'간단한 돼지고기 김치찌개 끓이는 방법',steps:['생 돼지고기와 배추김치는 포장 상태를 확인하고, 두부와 채소는 먹기 좋게 준비합니다.','냄비에 돼지고기와 김치를 먼저 볶은 뒤 물과 국물육수 다시팩을 넣습니다.','국물이 끓으면 채소를 넣고, 두부는 모양이 부서지지 않게 마무리에 더해 주세요.','고기의 가열·보관과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-doenjang-stew-ingredient-checklist':{title:'간단한 된장찌개 끓이는 방법',steps:['애호박·양파·버섯과 두부를 먹기 좋게 준비합니다.','냄비에 물과 국물육수 다시팩을 넣어 끓인 뒤 재래식 된장을 조금씩 풀어 주세요.','채소를 먼저 넣고 익힌 다음 두부를 더해 한소끔 끓입니다.','된장과 육수의 사용량, 두부의 보관·가열은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-perilla-mushroom-soup-ingredient-checklist':{title:'간단한 들깨버섯탕 끓이는 방법',steps:['모둠버섯과 채소는 먹기 좋게 준비하고, 두부는 마지막에 넣기 좋게 썹니다.','냄비에 물과 국물육수 다시팩을 넣어 끓인 뒤 버섯과 채소를 넣습니다.','들깨가루는 국물에 조금씩 풀어 넣고, 두부를 더해 한소끔 끓여 주세요.','들깨가루·육수의 사용량과 두부 보관은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-potato-sujebi-ingredient-checklist':{title:'간단한 감자수제비 끓이는 방법',steps:['감자·애호박·양파는 먹기 좋게 썰고, 생수제비는 포장 상태를 확인합니다.','냄비에 물과 국물육수 다시팩, 감자를 넣어 먼저 끓입니다.','감자가 익기 시작하면 생수제비를 하나씩 넣고, 애호박과 대파를 마무리에 더하세요.','생수제비의 가열과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-shrimp-butter-grill-ingredient-checklist':{title:'간단한 새우버터구이 만드는 방법',steps:['생 새우살은 포장 안내에 따라 준비하고, 양파와 버섯은 먹기 좋게 썹니다.','예열한 팬에 식용유를 두르고 양파·버섯을 먼저 익힙니다.','새우살을 넣어 충분히 익힌 뒤 무염버터와 다진마늘을 더해 향을 냅니다.','새우의 해동·가열과 버터 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-mackerel-potato-braise-ingredient-checklist':{title:'간단한 고등어감자조림 만드는 방법',steps:['손질 고등어는 포장 안내에 따라 준비하고, 감자와 양파는 비슷한 크기로 썹니다.','냄비 바닥에 감자와 양파를 깔고 물, 진간장, 고추장을 넣어 먼저 끓입니다.','감자가 익기 시작하면 고등어를 올리고, 살이 부서지지 않게 뒤집는 횟수를 줄여 조립니다.','고등어의 해동·가열과 양념 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-chicken-potato-stew-ingredient-checklist':{title:'간단한 닭볶음탕 끓이는 방법',steps:['닭볶음탕용 생닭은 포장 안내에 따라 준비하고, 감자와 양파는 먹기 좋게 썹니다.','냄비에 닭·감자·양파와 물을 넣고 고추장·진간장을 조금씩 풀어 끓입니다.','닭과 감자가 충분히 익으면 대파를 더하고, 마지막에 국물 간을 확인하세요.','생닭의 보관·가열과 양념 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-tteokbokki-ingredient-checklist':{title:'간단한 떡볶이 만드는 방법',steps:['밀떡과 모둠어묵은 포장 상태를 확인하고, 양파와 대파는 먹기 좋게 썹니다.','냄비에 물과 국물육수 다시팩을 넣고, 고추장은 조금씩 풀어 양념 국물을 만듭니다.','국물이 끓으면 밀떡과 어묵을 넣고 바닥에 눌지 않게 저어가며 익힙니다.','떡·어묵의 가열과 양념·육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-zucchini-pancake-ingredient-checklist':{title:'간단한 애호박전 만드는 방법',steps:['애호박은 비슷한 두께로 썰고, 달걀과 부침가루는 포장 상태를 확인합니다.','애호박에 부침가루를 얇게 묻히고 달걀물을 입힙니다.','예열한 팬에 식용유를 두른 뒤 두 면을 노릇하게 익혀 주세요.','달걀 보관과 부침가루 사용 방법은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-camping-corn-cheese-ingredient-checklist':{title:'간단한 버터콘치즈 만드는 방법',steps:['스위트콘은 물기를 빼고, 양파와 선택 재료는 잘게 썹니다.','예열한 팬에 무염버터를 녹이고 양파와 스위트콘을 먼저 익힙니다.','불을 낮춘 뒤 슬라이스 체다치즈를 올려 녹이고, 바닥이 눋지 않게 살펴보세요.','옥수수·치즈의 보관·가열과 버터 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-soy-butter-potato-grill':{title:'간단한 간장버터감자구이 만드는 방법',steps:['감자는 깨끗이 씻어 비슷한 크기로 자르고 물기를 닦습니다.','예열한 팬에 기름을 조금 두르고 감자와 양파를 먼저 노릇하게 익힙니다.','감자가 익으면 무염 버터와 진간장을 조금씩 더해 뒤섞고 대파를 마무리에 올립니다.','감자의 익힘 정도와 버터·간장 사용량은 먹는 인원과 팬 크기에 맞춰 조절하세요.']},
 'autumn-20260920-shrimp-jeon':{title:'간단한 새우전 만드는 방법',steps:['칵테일새우는 포장 안내에 따라 해동·준비하고 물기를 닦습니다.','새우에 부침가루를 얇게 묻힌 뒤 달걀물을 입혀 주세요.','예열한 팬에 식용유를 소량 두르고 앞뒤를 노릇하게, 중심까지 충분히 익힙니다.','새우의 해동·가열과 달걀 보관은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-mushroom-cheese-grill':{title:'간단한 버섯치즈구이 만드는 방법',steps:['새송이버섯은 비슷한 두께로 썰고 양파와 파프리카를 준비합니다.','예열한 팬에 무염 버터를 조금 녹여 버섯을 먼저 굽습니다.','버섯이 노릇해지면 채소를 더하고 불을 낮춘 뒤 체다 슬라이스 치즈를 올려 녹입니다.','버섯의 상태와 치즈의 보관·가열은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-tofu-soy-grill':{title:'간단한 두부간장구이 만드는 방법',steps:['촌두부는 포장 안내를 확인한 뒤 꺼내 겉물기를 닦고 도톰하게 자릅니다.','예열한 팬에 기름을 소량 두르고 두부의 앞뒤를 먼저 단단하게 굽습니다.','노릇해진 뒤 진간장과 다진마늘을 조금씩 더하고, 대파는 마지막에 올립니다.','두부의 보관·가열과 양념 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-kimchi-fishcake-stirfry':{title:'간단한 김치어묵볶음 만드는 방법',steps:['포기김치는 먹기 좋게 자르고 모둠 어묵은 포장 안내에 따라 준비합니다.','예열한 팬에 양파와 김치를 먼저 볶아 수분을 날려 주세요.','어묵을 더해 충분히 데운 뒤 진간장은 맛을 보며 소량씩 넣고 대파로 마무리합니다.','김치·어묵의 보관과 가열은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-jeyuk-bokkeum-ingredient-checklist':{title:'간단한 제육볶음 만드는 방법',steps:['고추장 제육볶음과 제육용 돼지고기는 포장 안내에 따라 준비하고, 양파와 대파는 먹기 좋게 썹니다.','예열한 팬에 양파를 먼저 볶은 뒤 돼지고기를 넣어 중심까지 충분히 익혀 주세요.','볶음소스는 일부부터 넣어 수분과 간을 보며 볶고, 대파는 마지막에 더합니다.','고기의 보관·가열과 소스 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-sundae-bokkeum-ingredient-checklist':{title:'간단한 순대볶음 만드는 방법',steps:['찰순대와 순대볶음 구성은 포장 안내에 따라 준비하고 양파와 대파는 먹기 좋게 썹니다.','팬에 양파를 먼저 볶아 수분을 줄이고 만능양념장은 조금씩 넣어 맛을 맞춥니다.','채소와 양념이 어우러진 뒤 순대를 넣어 충분히 데우고 대파로 마무리합니다.','순대의 보관·가열과 양념 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-dakgalbi-ingredient-checklist':{title:'간단한 춘천 닭갈비 만드는 방법',steps:['양념 닭갈비는 포장 안내에 따라 준비하고 새송이버섯·파프리카·대파는 먹기 좋게 썹니다.','예열한 그리들에 양념 닭갈비를 먼저 올려 뒤집어 가며 중심까지 충분히 익힙니다.','버섯과 양파를 더해 익힌 뒤 파프리카와 대파를 마지막에 넣어 짧게 볶아 주세요.','닭의 보관·가열은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-chicken-kimchi-fried-rice-ingredient-checklist':{title:'간단한 닭가슴살 김치볶음밥 만드는 방법',steps:['배추김치와 대파는 잘게 썰고 닭가슴살 김치볶음밥과 즉석밥은 포장 안내에 따라 준비합니다.','예열한 팬에 김치와 대파를 먼저 볶아 수분을 정리한 뒤 밥을 넣어 고루 풀어가며 볶습니다.','달걀은 따로 익혀 곁들이거나 팬 가장자리에서 함께 익혀 마무리합니다.','볶음밥·즉석밥의 가열과 달걀 보관은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
 'autumn-20260920-mussel-seaweed-soup-ingredient-checklist':{title:'간단한 홍합미역국 끓이는 방법',steps:['마른 미역은 물에 불린 뒤 헹구고 손질 홍합살은 포장 안내에 따라 준비합니다.','냄비에 물과 국물육수 다시팩을 넣어 국물 바탕을 낸 뒤 양파와 미역을 넣어 끓입니다.','국물이 끓으면 홍합살을 넣어 충분히 데우고 대파를 마지막에 더하세요.','홍합살의 해동·가열과 육수 사용량은 구매한 제품의 포장 안내를 우선으로 확인하세요.']},
};

function CookingGuide({article}:{article:Article}){
 const guide=cookingGuides[article.slug];
 if(!guide)return <section className="prep-cooking-intro" aria-label="간단한 요리 방법"><h2>간단한 {dishName(article.title)} 만드는 방법</h2><p>{quickCookingGuide(dishName(article.title))}</p></section>;
 return <section className="prep-cooking-intro" aria-label={guide.title}><h2>{guide.title}</h2><ol className="prep-cooking-steps">{guide.steps.map((step,index)=><li key={index}>{step}</li>)}</ol><p className="prep-cooking-note">해동·손질·가열과 양념 사용량은 식재료의 실제 포장 안내를 우선으로 확인하세요.</p></section>;
}

export default function PrepArticle({article:a,preview=false,relatedArticles=[]}:{article:Article;preview?:boolean;relatedArticles?:{slug:string;title:string}[]}){
 const checklist=!!a.checklist?.length;
 const adEligible=!preview&&a.sections.map(section=>section.text).join('').length>=350;
 const usedPhotos=new Set([a.cover.url]);
 const neutralPhotos=a.sections.flatMap(section=>section.image?[section.image]:[]).filter(photo=>!photo.url.includes('-support.webp')&&!photo.url.includes('-cover-unified-v2.webp')).filter(photo=>{if(usedPhotos.has(photo.url))return false;usedPhotos.add(photo.url);return true;});
 const completedUrl=completedFoodPhotos[a.slug]?'/prep-images/'+completedFoodPhotos[a.slug]+'.webp':'';
 const completedPhoto=completedUrl&&!usedPhotos.has(completedUrl)?{...a.cover,url:completedUrl,alt:'완성된 '+dishName(a.title)+' 요리 장면'}:undefined;
 return <article className="prep-article">
  <nav aria-label="현재 위치"><Link href="/">홈</Link> / <Link href="/weekend-prep">준비 가이드</Link> / {prepCategoryLabel(a.category,a)}</nav>
  {preview&&<p className="prep-notice">검토용 초안 · 아직 공개되지 않은 글입니다.</p>}
  <p className="prep-eyebrow">{prepCategoryLabel(a.category,a)}</p><h1>{a.title}</h1><p className="prep-lead">{a.description}</p>
  {adEligible&&<AdSlot label="본문 상단 광고"/>}
  <PrepImage photo={a.cover} priority />
  {checklist&&<CookingGuide article={a}/>}
  {checklist&&a.checklist&&<PrepChecklist slug={a.slug} items={a.checklist} dishName={dishName(a.title)}/>}
  {adEligible&&<AdSlot label="본문 중간 광고"/>}
  {checklist&&<FoodChecklistDetails slug={a.slug} articles={relatedArticles} preparationImage={neutralPhotos[0]?<PrepImage photo={neutralPhotos[0]}/>:null} tipImage={neutralPhotos[1]?<PrepImage photo={neutralPhotos[1]}/>:null} images={<div className="prep-food-images">{neutralPhotos.slice(2).map(photo=><PrepImage key={photo.url} photo={photo}/>)}{completedPhoto&&<PrepImage photo={completedPhoto}/>}<p className="prep-ai-note">{a.imageConnectionNote || '이 글의 이미지는 AI를 활용해 제작했습니다.'}</p></div>}/>}
  {!checklist&&a.sections.map((section,index)=><section key={index}><h2>{section.heading}</h2>{section.text.split('\n').filter(Boolean).map((raw,j)=>{const point=raw.startsWith('• ');return <p className={point?'prep-point':undefined} key={j}>{point?raw.slice(2):raw}</p>;})}{section.image&&<PrepImage photo={section.image}/>}</section>)}
  {!checklist&&!!a.internalLinks.length&&<nav aria-label="함께 읽기"><h2>함께 보면 좋은 곳</h2>{a.internalLinks.map(link=><p key={link.href}><Link href={link.href}>{link.label} →</Link></p>)}</nav>}
  {!checklist&&<p className="prep-ai-note">{a.imageConnectionNote || '이 글의 이미지는 AI를 활용해 제작했습니다.'}</p>}
  {adEligible&&<AdSlot label="본문 하단 광고"/>}
 </article>;
}
