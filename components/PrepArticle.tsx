import Link from 'next/link';
import Image from 'next/image';
import PrepImage from './PrepImage';
import PrepChecklist from './PrepChecklist';
import {FoodChecklistDetails} from './FoodChecklistDetails';
import type {PrepArticle as Article, PrepChecklistItem} from '@/lib/weekend-prep/types';
import {prepCategoryLabel} from '@/lib/weekend-prep/categoryLabel';
import {reviewedPrepAffiliate, prepDishName} from '@/lib/prep-affiliate';
import TossTopDeals from './TossTopDeals';

function dishName(title:string){
 return prepDishName(title);
}

function bodyText(text:string){
 return text.replace('필요한 식기는 사진 아래 준비물 버튼에서 확인할 수 있습니다.','필요한 식기는 재료 목록에서 확인할 수 있습니다.').replace('사진의 작은 소스 그릇은 설명 없이 + 링크로만 연결했습니다.','').replace('사진 아래 상품 버튼을 누르면','아래 상품 목록에서 버튼을 누르면');
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
 'autumn-flower-crab-soup-ingredient-checklist':{title:'간단한 꽃게탕 끓이는 방법',steps:["2인분 예시로 냉동 꽃게 약 300~400g, 물 700mL, 애호박 1/3개, 대파 1/2대, 미나리 약 30g, 국물육수 다시팩 1개와 시판 매운탕 양념을 준비합니다. 다시팩과 양념은 제품별 사용량이 다르므로 포장 안내를 함께 확인하세요.","꽃게는 밀폐 용기에 담아 냉장 해동하고 차갑게 보관합니다. 손질되지 않은 꽃게라면 배딱지와 아가미를 제거하고 흐르는 물에 씻어 먹기 좋게 자릅니다. 손질 제품은 포장 안내를 따르고, 생꽃게를 다룬 손과 도구는 바로 씻습니다.","애호박은 반달 모양, 대파는 어슷하게 썹니다. 미나리는 깨끗이 씻어 먹기 좋게 자르고 마지막에 넣을 수 있도록 따로 둡니다.","냄비에 물 700mL와 다시팩을 넣고 포장 안내에 따라 육수를 낸 뒤 다시팩을 건집니다. 국물이 끓으면 시판 매운탕 양념을 1큰술 정도부터 풀어 주세요. 제품 권장량이 더 적으면 그 양을 우선합니다.","꽃게와 애호박을 넣고 끓입니다. 식품용 온도계를 껍데기에 닿지 않게 가장 두꺼운 꽃게 살에 꽂아 중심온도가 85℃ 이상에서 1분 이상 유지되는지 확인합니다. 냉동 제품의 가열 안내도 함께 따릅니다.","대파를 넣어 한소끔 끓이고 미나리를 넣습니다. 깨끗한 국자에 국물을 덜어 맛본 뒤 싱거우면 양념을 조금씩 더하고, 짜면 물을 조금 보충해 다시 끓여 마무리합니다."]},
 'camping-fishcake-soup-ingredient-checklist':{title:'간단한 어묵탕 끓이는 방법',steps:["2인분 예시로 모둠 어묵 약 250g, 물 약 600mL와 대파 1/2대를 준비합니다. 어묵의 냉장·냉동 표시를 확인하고 포장 안내에 맞게 준비합니다.","큰 어묵은 먹기 좋게 자르고 대파는 어슷하게 썹니다. 냄비에 물과 육수 다시팩을 넣어 제품에 적힌 방법대로 끓인 뒤 다시팩을 건져 냅니다.","국물이 끓으면 어묵을 넣고 제품의 가열 안내에 따라 속까지 충분히 데웁니다. 꼬치를 사용한다면 냄비 가장자리 밖으로 쓰러지지 않게 놓으세요.","국물을 한 숟갈 덜어 맛보고 간이 부족할 때만 잔치국수 분말을 조금씩 더합니다. 대파를 넣어 한소끔 끓인 뒤 그릇에 나눕니다."]},
 'camping-budae-jjigae-ingredient-checklist':{title:'간단한 부대찌개 끓이는 방법',steps:["부대찌개 구성품과 햄의 포장을 살펴 양념이 포함됐는지 확인합니다. 애호박과 대파를 먹기 좋은 크기로 썹니다.","냄비에 물과 다시팩을 넣고 안내에 따라 육수를 낸 뒤 다시팩을 건집니다.","햄과 애호박을 넣고 끓이면서 구성품에 든 양념은 일부부터 넣습니다. 제품별 가열 안내에 따라 재료를 충분히 데웁니다.","국물의 간을 확인하고 대파와 체다치즈를 올립니다. 치즈가 녹으면 불을 끄고 나눠 담습니다."]},
 'camping-beef-mushroom-hotpot-ingredient-checklist':{title:'간단한 소고기 버섯전골 끓이는 방법',steps:["소고기는 조리 직전까지 차갑게 두고, 버섯 밑동과 애호박·대파를 손질합니다. 생고기와 채소는 도구를 구분해 준비하세요.","물과 다시팩으로 포장 안내에 따라 육수를 내고 다시팩을 건진 다음 버섯과 애호박을 넣어 끓입니다.","채소가 익으면 고기를 조금씩 펼쳐 넣고 속까지 충분히 익힙니다. 생고기를 만진 집게는 씻거나 새 집게로 바꿉니다.","대파를 넣어 한소끔 끓이고 국물 맛을 확인한 뒤 그릇에 덜어 먹습니다."]},
 'camping-seafood-hotpot-ingredient-checklist':{title:'간단한 해물탕 끓이는 방법',steps:["모둠해물과 오만둥이는 포장 안내에 맞춰 냉장 해동하고 다른 재료와 분리합니다. 애호박과 미나리는 씻어 자릅니다.","물과 다시팩으로 육수를 낸 뒤 다시팩을 건지고 매운탕 양념은 일부부터 풀어 끓입니다.","해물과 오만둥이를 넣고 끓이며 식품용 온도계로 가장 두꺼운 부분의 중심온도가 85℃ 이상에서 1분 이상 유지되는지 확인합니다. 애호박도 넣어 익히고 포장에 별도 가열 안내가 있으면 함께 따릅니다.","국물 간을 보고 필요하면 양념을 더합니다. 씻어 둔 미나리는 불을 끄기 직전에 넣습니다."]},
 'camping-seafood-ramen-ingredients':{title:'간단한 해물라면 끓이는 방법',steps:["해물은 포장 안내에 따라 냉장 해동해 차갑게 보관하고, 대파를 송송 썹니다. 해물과 채소는 분리해 손질하세요.","라면 봉지에 적힌 물을 냄비에 붓고 끓입니다. 해물을 넣고 식품용 온도계로 가장 두꺼운 부분의 중심온도가 85℃ 이상에서 1분 이상 유지되도록 먼저 익힙니다.","면과 스프를 넣고 면을 풀어 가며 끓입니다. 해물이 충분히 익었는지 확인하고 대파를 넣습니다.","김치는 따로 담아 곁들이고, 해물에 닿은 조리도구는 씻어 정리합니다."]},
 'camping-mussel-soup-ingredients':{title:'간단한 홍합탕 끓이는 방법',steps:["손질 홍합살의 해동·보관 표시를 확인하고 양파는 얇게, 대파는 어슷하게 썹니다. 홍합을 다룬 손과 도구를 씻습니다.","물과 다시팩으로 제품 안내에 맞게 육수를 낸 다음 다시팩을 건져 냅니다.","양파를 먼저 익힌 뒤 홍합살을 넣습니다. 식품용 온도계로 가장 두꺼운 홍합살의 중심온도가 85℃ 이상에서 1분 이상 유지되는지 확인합니다.","대파를 넣어 한소끔 끓이고 국물 맛을 확인해 나눠 담습니다."]},
 'camping-kimchi-fried-rice-ingredients':{title:'간단한 김치볶음밥 만드는 방법',steps:["김치와 대파를 잘게 썰고 즉석밥은 포장 안내에 맞게 준비합니다. 달걀을 담을 그릇과 팬도 준비합니다.","팬에 식용유를 조금 두르고 대파와 김치를 넣어 중불에서 저으며 볶습니다. 김치 국물이 많으면 조금 졸여 주세요.","밥을 넣고 주걱으로 덩어리를 풀며 김치가 고르게 섞이도록 충분히 볶습니다.","달걀은 별도 팬이나 빈 공간에서 흰자와 노른자가 단단해질 때까지 익혀 올립니다. 불을 끄고 김가루를 뿌립니다."]},
 'camping-squid-stir-fry-ingredients':{title:'간단한 오징어볶음 만드는 방법',steps:["손질 오징어는 포장 안내에 맞게 냉장 해동하고 물기를 닦습니다. 양파와 대파는 먹기 좋은 크기로 따로 썹니다.","팬에 기름을 조금 두르고 양파를 볶다가 오징어를 넣습니다. 생오징어에 닿은 도구는 익힌 음식과 구분하세요.","오징어볶음 소스를 일부부터 넣어 섞으며 볶습니다. 식품용 온도계로 가장 두꺼운 오징어의 중심온도가 85℃ 이상에서 1분 이상 유지되는지 확인합니다.","양파가 익으면 대파를 넣고 한 번 더 섞은 뒤 불을 끄고 덜어 냅니다."]},
 'camping-chicken-skewer-ingredients':{title:'간단한 닭꼬치구이 만드는 방법',steps:["꼬치의 포장 안내를 확인하고 조리 직전까지 차갑게 보관합니다. 버섯·파프리카·양파는 생닭과 닿지 않게 따로 썹니다.","소스는 생고기에 닿기 전 깨끗한 그릇에 먹을 만큼 덜어 둡니다. 생꼬치용 집게와 익힌 음식용 집게를 구분하세요.","그리들에 꼬치를 올려 자주 뒤집어 굽습니다. 식품용 온도계로 가장 두꺼운 닭고기 중심이 식품안전나라의 권고에 따라 75℃에 도달한 뒤 1분 이상 유지되는지 확인합니다.","채소는 별도로 익히고 깨끗하게 덜어 둔 소스를 익힌 꼬치에 발라 마저 굽습니다."]},
 'camping-kimchi-pancake-ingredients':{title:'간단한 김치전 만드는 방법',steps:["김치와 대파를 잘게 썰고 부침가루는 포장 안내의 물 비율에 맞춰 섞습니다. 김치 국물을 넣는다면 그만큼 물을 줄이세요.","반죽에 김치와 대파를 섞고, 팬에 기름을 얇게 두른 뒤 중불로 데웁니다.","반죽을 너무 두껍지 않게 펼칩니다. 가장자리가 익고 바닥이 붙지 않으면 뒤집어 반대쪽도 익힙니다.","가운데까지 밀가루 반죽이 남지 않게 익힌 후 먹기 좋게 잘라 덜어 냅니다."]},
 'camping-pork-belly-bbq-ingredients':{title:'간단한 삼겹살 바비큐 굽는 방법',steps:["삼겹살은 조리 직전까지 차갑게 보관하고 버섯·파프리카·양파는 고기와 분리해 썹니다. 생고기용과 익힌 음식용 집게를 따로 준비합니다.","그리들을 중불로 데우고 삼겹살을 겹치지 않게 올려 양면을 익힙니다. 기름이 많이 고이면 화상을 주의하며 불을 줄여 정리하세요.","식품용 온도계로 두꺼운 부위의 중심이 식품안전나라의 권고에 따라 75℃에 도달한 뒤 1분 이상 유지되도록 가열합니다.","생고기에 닿지 않은 집게로 익은 고기를 덜고, 채소와 김치는 따로 올려 충분히 익혀 곁들입니다."]},
 'camping-tofu-kimchi-ingredients':{title:'간단한 두부김치 만드는 방법',steps:["두부의 포장을 확인해 물기를 빼고 먹기 좋게 자릅니다. 김치·양파·대파는 따로 썰어 둡니다.","팬에 기름을 조금 두르고 양파와 김치를 넣어 중불에서 저으며 볶습니다. 대파를 넣고 함께 익힙니다.","두부는 제품의 가열 안내에 따라 끓는 물에 데우거나 물기를 닦아 팬에서 앞뒤를 굽습니다.","그릇에 따뜻한 두부를 담고 볶은 김치를 곁들입니다."]},
 'autumn-camping-pork-kimchi-stew-ingredient-checklist':{title:'간단한 돼지고기 김치찌개 끓이는 방법',steps:["돼지고기는 차갑게 보관하고 김치·양파·대파·두부는 먹기 좋게 썹니다. 생고기를 만진 손과 도마는 채소를 다루기 전에 씻습니다.","냄비에 돼지고기와 김치를 넣어 볶다가 물을 붓고 다시팩과 양파, 다진마늘을 넣어 끓입니다.","다시팩은 안내된 시간이 되면 건지고, 고기 중심이 식품안전나라의 권고에 따라 75℃에 도달한 뒤 1분 이상 유지되도록 충분히 익힙니다.","두부와 대파를 넣어 데우고 국물 간을 확인한 뒤 나눠 담습니다."]},
 'autumn-camping-doenjang-stew-ingredient-checklist':{title:'간단한 된장찌개 끓이는 방법',steps:["애호박은 반달 모양으로, 양파와 버섯은 먹기 좋게 썰고 두부는 한입 크기로 자릅니다.","물과 다시팩으로 육수를 낸 뒤 다시팩을 건지고 된장을 조금씩 풀어 끓입니다.","양파·버섯·애호박과 다진마늘을 넣어 채소가 부드러워질 때까지 끓입니다.","두부를 넣어 충분히 데운 뒤 국물 맛을 보고, 싱거우면 된장을 조금 더 풀어 마무리합니다."]},
 'autumn-camping-perilla-mushroom-soup-ingredient-checklist':{title:'간단한 들깨버섯탕 끓이는 방법',steps:["버섯 밑동을 정리하고 애호박·양파·두부를 먹기 좋게 자릅니다. 들깨가루는 사용할 때까지 밀봉합니다.","물과 다시팩으로 육수를 낸 뒤 다시팩을 건지고 양파·애호박·버섯과 다진마늘을 넣어 익힙니다.","작은 그릇에 들깨가루와 국물을 조금 섞어 풀고 냄비에 넣어 저어 줍니다.","두부를 넣어 충분히 데우고 농도가 너무 진하면 물을 조금 보충합니다."]},
 'autumn-camping-potato-sujebi-ingredient-checklist':{title:'간단한 감자수제비 끓이는 방법',steps:["감자·애호박·양파를 얇게 썰고 대파를 어슷하게 썹니다. 생수제비는 포장의 보관·가열 안내를 확인합니다.","물과 다시팩으로 육수를 낸 뒤 다시팩을 건지고 감자와 양파를 먼저 넣어 끓입니다.","감자가 젓가락으로 들어갈 만큼 익어 가면 수제비를 한 장씩 떼어 넣어 서로 붙지 않게 젓습니다.","애호박과 다진마늘을 더하고 수제비를 포장 안내대로 충분히 익힌 뒤 대파를 넣습니다."]},
 'autumn-camping-shrimp-butter-grill-ingredient-checklist':{title:'간단한 새우버터구이 만드는 방법',steps:["생새우살은 포장 안내에 따라 냉장 해동하고 물기를 닦습니다. 양파·버섯과 선택한 파프리카는 새우와 분리해 손질합니다.","팬에 기름을 조금 두르고 양파와 버섯을 먼저 익힙니다. 파프리카를 쓰면 함께 넣습니다.","새우를 넣어 뒤집어 가며 익힙니다. 식품용 온도계를 두꺼운 새우살의 옆면으로 넣어 중심온도가 85℃ 이상에서 1분 이상 유지되는지 확인합니다. 생새우에 닿은 집게는 씻어 주세요.","불을 줄이고 버터와 다진마늘을 조금 더해 타지 않게 섞은 뒤 덜어 냅니다."]},
 'autumn-camping-mackerel-potato-braise-ingredient-checklist':{title:'간단한 고등어감자조림 만드는 방법',steps:["고등어는 포장 안내에 따라 냉장 해동하고 감자·양파·대파를 썹니다. 생선과 채소의 도마와 집게는 구분합니다.","냄비에 감자와 양파를 깔고 물을 자작하게 붓습니다. 간장·고추장·다진마늘은 조금씩 풀어 끓입니다.","감자가 익어 가면 고등어를 올리고 국물을 끼얹어 가며 끓입니다. 식품용 온도계로 생선의 가장 두꺼운 부분 중심온도가 85℃ 이상에서 1분 이상 유지되는지 확인합니다.","감자가 부드럽게 익고 생선이 충분히 익으면 대파를 넣습니다. 국물이 너무 졸면 물을 조금 보충하세요."]},
 'autumn-camping-chicken-potato-stew-ingredient-checklist':{title:'간단한 닭볶음탕 끓이는 방법',steps:["생닭은 씻지 말고 포장 상태로 차갑게 보관합니다. 감자·양파·대파를 생닭과 분리해 썰고 닭을 만진 손과 도구는 씻습니다.","냄비에 닭과 물을 넣고 고추장·간장·다진마늘을 조금씩 풀어 끓입니다. 감자와 양파를 더합니다.","바닥이 눋지 않게 가끔 저으며 끓입니다. 식품용 온도계로 뼈를 피한 가장 두꺼운 닭고기 중심이 식품안전나라의 권고에 따라 75℃에 도달한 뒤 1분 이상 유지되는지 확인합니다.","감자까지 부드럽게 익으면 대파를 넣고, 간이 부족할 때만 양념을 조금 보충합니다."]},
 'autumn-camping-tteokbokki-ingredient-checklist':{title:'간단한 떡볶이 만드는 방법',steps:["떡과 어묵은 포장 안내에 맞게 준비하고 양파와 대파를 썹니다. 떡이 서로 붙어 있으면 하나씩 떼어 둡니다.","물과 다시팩으로 육수를 내어 다시팩을 건진 뒤 고추장과 간장을 조금씩 풀어 끓입니다.","떡과 양파를 넣고 바닥에 달라붙지 않게 저어 가며 끓입니다.","떡이 익어 가면 어묵을 넣고 제품 안내에 따라 충분히 데웁니다. 대파를 더하고 국물 농도를 확인합니다."]},
 'autumn-camping-zucchini-pancake-ingredient-checklist':{title:'간단한 애호박전 만드는 방법',steps:["애호박을 비슷한 두께로 썰고 달걀을 그릇에 풀어 둡니다. 양파와 선택한 파프리카는 따로 손질합니다.","애호박에 부침가루를 얇게 묻힌 뒤 달걀물을 입힙니다.","팬에 기름을 조금 두르고 중불에서 애호박을 앞뒤로 익힙니다. 달걀물이 남지 않게 충분히 가열하세요.","양파와 파프리카도 취향에 맞게 익혀 곁들이고 간장은 따로 조금 덜어 냅니다."]},
 'autumn-camping-corn-cheese-ingredient-checklist':{title:'간단한 버터콘치즈 만드는 방법',steps:["옥수수 통조림은 물기를 빼고 양파를 잘게 썹니다. 선택한 파프리카와 햄은 포장 상태를 확인해 작게 자릅니다.","팬에 버터를 조금 녹여 양파와 선택한 채소를 볶고 옥수수를 넣습니다. 햄을 넣는다면 제품 가열 안내대로 충분히 익힙니다.","불을 낮추고 체다치즈를 나누어 올린 뒤 바닥이 타지 않게 살피며 녹입니다.","치즈가 녹으면 불을 끄고 덜어 냅니다. 남은 개봉 재료는 제품 보관 안내에 맞게 냉장합니다."]},
 'autumn-20260920-soy-butter-potato-grill':{title:'간단한 간장버터감자구이 만드는 방법',steps:["감자를 깨끗이 씻어 비슷한 크기로 작게 썰고 양파와 대파도 손질합니다.","팬에 기름과 감자를 넣고 중약불에서 뒤집어 가며 익힙니다. 바닥이 탈 것 같으면 불을 낮추고 뚜껑을 덮어 속까지 익힙니다.","젓가락이 감자 중심까지 부드럽게 들어가면 양파를 넣어 익힙니다.","불을 줄여 버터와 간장을 조금씩 넣고 고루 섞은 뒤 대파를 더합니다."]},
 'autumn-20260920-shrimp-jeon':{title:'간단한 새우전 만드는 방법',steps:["칵테일새우는 포장 안내에 맞게 냉장 해동하고 물기를 닦습니다. 달걀을 풀고 대파와 양파는 따로 잘게 썹니다.","새우에 부침가루를 얇게 묻히고 달걀물을 입힙니다. 채소를 더할 경우 달걀물에 섞습니다.","팬에 기름을 조금 두르고 중불에서 앞뒤를 익힙니다. 식품용 온도계를 두꺼운 새우살의 옆면으로 넣어 중심온도가 85℃ 이상에서 1분 이상 유지되는지 확인하고 달걀물도 남지 않게 익힙니다.","익힌 전은 깨끗한 집게로 덜고 생새우를 다룬 도구를 씻습니다."]},
 'autumn-20260920-mushroom-cheese-grill':{title:'간단한 버섯치즈구이 만드는 방법',steps:["새송이버섯을 비슷한 두께로 썰고 양파와 파프리카도 먹기 좋게 자릅니다. 치즈는 조리 직전까지 차갑게 보관합니다.","팬을 중불로 데워 버터를 조금 녹이고 버섯의 양면을 굽습니다.","양파와 파프리카를 넣어 익힌 뒤 불을 낮추고 치즈를 나누어 올립니다.","바닥이 타지 않게 살피며 치즈가 녹으면 불을 끄고 덜어 냅니다."]},
 'autumn-20260920-tofu-soy-grill':{title:'간단한 두부간장구이 만드는 방법',steps:["두부의 물기를 닦고 도톰하게 썹니다. 대파와 양파를 잘게 썰고 간장과 다진마늘을 준비합니다.","팬에 기름을 조금 두르고 중불에서 두부를 올려 바닥이 단단해질 때까지 굽습니다.","두부를 뒤집어 다른 면도 익히고 양파를 함께 볶습니다.","불을 낮춰 간장과 다진마늘을 조금씩 더하고 대파를 올려 마무리합니다."]},
 'autumn-20260920-kimchi-fishcake-stirfry':{title:'간단한 김치어묵볶음 만드는 방법',steps:["김치와 어묵을 먹기 좋게 자르고 양파와 대파를 썹니다. 어묵의 보관·가열 표시를 확인합니다.","팬에 기름을 조금 두르고 김치와 양파를 넣어 중불에서 볶습니다.","어묵을 넣어 제품 안내에 따라 충분히 데우며 섞습니다.","맛을 보고 필요할 때만 간장을 조금 더하고 대파를 넣어 마무리합니다."]},
 'autumn-20260920-jeyuk-bokkeum-ingredient-checklist':{title:'간단한 제육볶음 만드는 방법',steps:["양념된 제육볶음과 생돼지고기 중 사용할 제품을 고르고 포장 안내를 확인합니다. 추가 생고기를 쓴다면 소스 양과 충분한 가열 시간을 따로 확보합니다.","양파와 대파는 생고기와 분리해 썰고, 팬에 기름을 조금 두르고 양파를 볶습니다.","고기를 펼쳐 넣어 볶고 식품용 온도계로 중심이 식품안전나라의 권고에 따라 75℃에 도달한 뒤 1분 이상 유지되도록 가열합니다.","볶음소스는 제품에 이미 든 양념을 확인한 뒤 필요할 때만 더하고 대파를 넣습니다. 생고기용 집게는 씻어 정리합니다."]},
 'autumn-20260920-sundae-bokkeum-ingredient-checklist':{title:'간단한 순대볶음 만드는 방법',steps:["순대와 순대볶음 구성의 포장을 확인해 중복 재료와 가열 방법을 살핍니다. 양파와 대파는 먹기 좋게 썹니다.","팬에 기름을 조금 두르고 양파를 볶은 뒤 양념장을 일부부터 넣습니다.","순대를 넣고 포장 안내에 맞게 속까지 충분히 데우며 부서지지 않게 가볍게 섞습니다.","대파를 넣고 간을 확인한 뒤 불을 끄고 덜어 냅니다."]},
 'autumn-20260920-dakgalbi-ingredient-checklist':{title:'간단한 춘천 닭갈비 만드는 방법',steps:["양념 닭갈비는 조리 직전까지 차갑게 두고 버섯·양파·파프리카·대파는 닭과 분리해 썹니다.","그리들에 닭갈비를 펼쳐 놓고 뒤집어 가며 익힙니다. 생닭을 만진 집게와 익힌 음식용 집게를 구분합니다.","식품용 온도계로 가장 두꺼운 닭고기 중심이 식품안전나라의 권고에 따라 75℃에 도달한 뒤 1분 이상 유지되는지 확인합니다.","버섯과 양파를 익히고 파프리카·대파를 더해 볶은 뒤 깨끗한 집게로 덜어 냅니다."]},
 'autumn-20260920-chicken-kimchi-fried-rice-ingredient-checklist':{title:'간단한 닭가슴살 김치볶음밥 만드는 방법',steps:["닭가슴살 김치볶음밥의 구성과 가열 방법을 확인하고 필요할 때만 즉석밥을 추가합니다. 김치와 대파를 작게 썹니다.","팬에 기름을 조금 두르고 김치와 대파를 볶습니다.","볶음밥을 넣고 포장에 적힌 방법에 따라 속까지 충분히 가열합니다. 즉석밥을 추가하면 고루 풀어 함께 데웁니다.","달걀을 따로 익혀 곁들이며 흰자와 노른자가 단단해질 때까지 가열합니다."]},
 'autumn-20260920-mussel-seaweed-soup-ingredient-checklist':{title:'간단한 홍합미역국 끓이는 방법',steps:["마른 미역을 물에 불려 헹구고 먹기 좋게 자릅니다. 손질 홍합살은 포장 안내에 맞게 냉장 해동하고 양파와 대파는 따로 썹니다.","물과 다시팩으로 육수를 낸 뒤 다시팩을 건집니다. 불린 미역과 양파를 넣어 끓입니다.","홍합살을 넣고 제품 안내에 따라 끓입니다. 식품용 온도계로 가장 두꺼운 홍합살의 중심온도가 85℃ 이상에서 1분 이상 유지되는지 확인합니다.","대파를 넣어 한소끔 끓인 뒤 그릇에 나눕니다."]},
};

const smallSeafoodSlugs=new Set(['camping-seafood-hotpot-ingredient-checklist','camping-seafood-ramen-ingredients','camping-mussel-soup-ingredients','camping-squid-stir-fry-ingredients','autumn-camping-shrimp-butter-grill-ingredient-checklist','autumn-20260920-shrimp-jeon','autumn-20260920-mussel-seaweed-soup-ingredient-checklist']);
function CookingGuide({article}:{article:Article}){
 const guide=cookingGuides[article.slug];
 if(!guide)return <section id="prep-cooking" className="prep-cooking-intro" aria-label="간단한 요리 방법"><h2>간단한 {dishName(article.title)} 만드는 방법</h2><p>{quickCookingGuide(dishName(article.title))}</p></section>;
 return <section id="prep-cooking" className="prep-cooking-intro" aria-label={guide.title}><h2>{guide.title}</h2><ol className="prep-cooking-steps">{guide.steps.map((step,index)=><li key={index}>{step}</li>)}</ol><p className="prep-cooking-note">해동과 조리 방법은 제품 포장을 확인하고, 식재료별 식품안전 기준에 맞게 충분히 익히세요.</p>{smallSeafoodSlugs.has(article.slug)&&<p className="prep-cooking-note">식약처는 어패류를 중심온도 85℃ 이상에서 1분 이상 익히도록 안내합니다. 작은 재료는 얇은 탐침의 식품용 온도계를 옆으로 넣어 중심을 확인하세요. 탐침을 넣을 수 없다면 이 기준에 도달했는지 확인하기 어렵고, 색만으로 안전을 판단할 수 없습니다.</p>}</section>;
}

export default function PrepArticle({article:a,preview=false,relatedArticles=[],shoppingItems=a.checklist||[]}:{article:Article;preview?:boolean;relatedArticles?:{slug:string;title:string}[];shoppingItems?:PrepChecklistItem[]}){
 const checklist=!!a.checklist?.length;
 const imageKind: 'cooking'|'supplies' = a.category==='캠핑용품'||a.category==='야외 놀이'?'supplies':'cooking';
 const hasAffiliate=shoppingItems.some(reviewedPrepAffiliate);
 const usedPhotos=new Set([a.cover.url]);
 const neutralPhotos=a.sections.flatMap(section=>section.image?[section.image]:[]).filter(photo=>!photo.url.includes('-support.webp')&&!photo.url.includes('-cover-unified-v2.webp')).filter(photo=>{if(usedPhotos.has(photo.url))return false;usedPhotos.add(photo.url);return true;});
 const completedUrl=completedFoodPhotos[a.slug]?'/prep-images/'+completedFoodPhotos[a.slug]+'.webp':'';
 const completedPhoto=completedUrl&&!usedPhotos.has(completedUrl)?{...a.cover,url:completedUrl,alt:'완성된 '+dishName(a.title)+' 요리 장면'}:undefined;
 return <article className="prep-article">
  <nav aria-label="현재 위치"><Link href="/">홈</Link> / <Link href="/weekend-prep">준비 가이드</Link> / {prepCategoryLabel(a.category,a)}</nav>
  {preview&&<p className="prep-notice">검토용 초안 · 아직 공개되지 않은 글입니다.</p>}
  <p className="prep-eyebrow">{prepCategoryLabel(a.category,a)}</p><h1>{a.title}</h1><p className="prep-lead">{a.description}</p>
  {hasAffiliate&&<p className="prep-affiliate-disclosure">이 글에는 쿠팡 제휴 링크가 포함되어 있습니다. 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.</p>}
  {!!shoppingItems.length&&<nav className="prep-guide-actions" aria-label="준비 가이드 바로가기"><a href="#prep-checklist">{imageKind==='cooking'?'재료 목록 보기 ↓':'상품 목록 보기 ↓'}</a><a href="#prep-cooking">{imageKind==='cooking'?'조리 순서 보기 ↓':'선택 요령 보기 ↓'}</a></nav>}
  <PrepImage photo={a.cover} priority/>
  {!!shoppingItems.length&&<PrepChecklist kind={imageKind} slug={a.slug} items={shoppingItems} dishName={dishName(a.title)}/>}
  {checklist&&<CookingGuide article={a}/>}
  {!preview&&<TossTopDeals contained />}
  {checklist&&<FoodChecklistDetails slug={a.slug} articles={relatedArticles} preparationImage={neutralPhotos[0]?<PrepImage photo={neutralPhotos[0]}/>:null} tipImage={neutralPhotos[1]?<PrepImage photo={neutralPhotos[1]}/>:null} images={<div className="prep-food-images">{neutralPhotos.slice(2).map(photo=><PrepImage key={photo.url} photo={photo}/>)}{completedPhoto&&<PrepImage photo={completedPhoto}/>}<p className="prep-ai-note">이 글의 이미지는 AI 연출입니다.</p></div>}/>}
  {!checklist&&a.sections.map((section,index)=><section key={index} id={index===0&&shoppingItems.length?'prep-cooking':undefined}><h2>{section.heading}</h2>{bodyText(section.text).split('\n').filter(Boolean).map((raw,j)=>{const point=raw.startsWith('• ');return <p className={point?'prep-point':undefined} key={j}>{point?raw.slice(2):raw}</p>;})}{section.image&&<PrepImage photo={section.image}/>}</section>)}
  {!checklist&&!!a.internalLinks.length&&<nav aria-label="함께 읽기"><h2>함께 보면 좋은 곳</h2>{a.internalLinks.map(link=><p key={link.href}><Link href={link.href}>{link.label} →</Link></p>)}</nav>}
  {!checklist&&<p className="prep-ai-note">이 글의 이미지는 AI 연출입니다.</p>}
 </article>;
}
