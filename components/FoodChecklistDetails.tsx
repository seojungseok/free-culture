import Link from 'next/link';
import type {ReactNode} from 'react';

type Details={preparation:string[];tips:string[];related:readonly string[]};

const all={
 crab:['autumn-flower-crab-soup-ingredient-checklist','camping-seafood-hotpot-ingredient-checklist','camping-mussel-soup-ingredients'],
 soup:['camping-fishcake-soup-ingredient-checklist','autumn-camping-doenjang-stew-ingredient-checklist','autumn-camping-perilla-mushroom-soup-ingredient-checklist'],
 grill:['camping-pork-belly-bbq-ingredients','autumn-camping-shrimp-butter-grill-ingredient-checklist','autumn-20260920-mushroom-cheese-grill'],
 pan:['camping-kimchi-pancake-ingredients','autumn-camping-zucchini-pancake-ingredient-checklist','autumn-20260920-shrimp-jeon'],
 kimchi:['camping-kimchi-fried-rice-ingredients','camping-tofu-kimchi-ingredients','autumn-camping-pork-kimchi-stew-ingredient-checklist'],
 quick:['autumn-20260920-soy-butter-potato-grill','autumn-20260920-tofu-soy-grill','autumn-20260920-kimchi-fishcake-stirfry']
} as const;

const details:Record<string,Details>={
 'autumn-flower-crab-soup-ingredient-checklist':{preparation:['꽃게와 해물은 냉장·냉동 상태를 확인해 따로 담아 오세요.','손질 꽃게를 쓰면 현장 준비 시간을 줄일 수 있습니다.','미나리는 마지막에 넣을 만큼만 따로 보관하세요.'],tips:['무는 먼저 익혀 국물 단맛을 냅니다.','미나리는 불을 끄기 직전에 넣어 향을 살립니다.','양념은 처음부터 많이 넣지 말고 국물 맛을 보며 더하세요.'],related:all.crab},
 'camping-fishcake-soup-ingredient-checklist':{preparation:['어묵의 냉장·냉동 보관 표시를 먼저 확인하세요.','국물 재료와 어묵은 따로 담으면 정리가 편합니다.','꼬치 어묵을 쓸 때는 냄비 크기와 꼬치 길이를 확인하세요.'],tips:['국물이 끓은 뒤 어묵을 넣어 퍼지는 것을 줄입니다.','대파는 마지막에 넣어 향을 남깁니다.','간은 어묵의 짠맛을 본 뒤 조절하세요.'],related:all.soup},
 'camping-budae-jjigae-ingredient-checklist':{preparation:['햄·소시지 구성은 포장 단위와 보관 상태를 확인하세요.','치즈는 녹이기 직전까지 차갑게 보관합니다.','국물 재료는 새지 않도록 분리해 담으세요.'],tips:['단단한 채소부터 넣어 익는 순서를 맞춥니다.','햄류의 짠맛을 본 뒤 양념을 더합니다.','치즈는 마지막에 올려 녹입니다.'],related:['autumn-camping-pork-kimchi-stew-ingredient-checklist','autumn-camping-doenjang-stew-ingredient-checklist','camping-fishcake-soup-ingredient-checklist']},
 'camping-beef-mushroom-hotpot-ingredient-checklist':{preparation:['고기는 조리 전까지 차갑게 보관하세요.','버섯은 물기를 털어 따로 담으면 국물이 맑습니다.','전골 냄비 크기에 맞춰 채소 양을 나눕니다.'],tips:['채소와 버섯을 먼저 익힌 뒤 고기를 넣습니다.','고기는 한 번에 많이 넣지 않아 국물 온도를 지킵니다.','대파는 마지막에 넣어 향을 냅니다.'],related:['autumn-camping-perilla-mushroom-soup-ingredient-checklist','camping-seafood-hotpot-ingredient-checklist','autumn-camping-doenjang-stew-ingredient-checklist']},
 'camping-seafood-hotpot-ingredient-checklist':{preparation:['해물은 해동 방법과 보관 표시를 확인하세요.','국물용 채소와 해물은 분리 포장하는 편이 좋습니다.','미나리는 씻은 뒤 물기를 빼 따로 담습니다.'],tips:['국물이 끓은 뒤 해물을 넣어 과하게 익는 것을 줄입니다.','양념은 일부부터 풀어 간을 맞춥니다.','미나리는 마지막에 넣어 향을 살립니다.'],related:all.crab},
 'camping-seafood-ramen-ingredients':{preparation:['해물은 라면과 분리해 차갑게 보관하세요.','면과 스프의 권장 물 양을 미리 확인합니다.','대파는 손질해 작은 용기에 담으면 편합니다.'],tips:['물이 끓은 뒤 면을 넣고 풀어 줍니다.','해물은 면이 풀린 뒤 넣어 익힘을 맞춥니다.','대파는 불을 끄기 직전에 더합니다.'],related:['camping-mussel-soup-ingredients','camping-seafood-hotpot-ingredient-checklist','camping-fishcake-soup-ingredient-checklist']},
 'camping-mussel-soup-ingredients':{preparation:['홍합살은 해동·보관 표시를 확인하세요.','양파와 대파는 미리 손질해 분리합니다.','국물 재료는 가루가 새지 않게 밀봉합니다.'],tips:['양파로 국물 단맛을 먼저 냅니다.','홍합살은 오래 끓이지 않고 충분히 데워 냅니다.','대파는 마지막에 넣어 향을 남깁니다.'],related:all.soup},
 'camping-kimchi-fried-rice-ingredients':{preparation:['김치는 국물을 조금 덜어 따로 담으면 볶기 편합니다.','즉석밥과 달걀은 포장 안내에 맞춰 준비하세요.','김가루는 눅눅해지지 않게 마지막에 챙깁니다.'],tips:['김치를 먼저 볶아 수분을 정리합니다.','밥은 뭉치지 않게 풀어가며 볶습니다.','김가루는 불을 끈 뒤 더합니다.'],related:all.kimchi},
 'camping-squid-stir-fry-ingredients':{preparation:['손질 오징어는 해동·보관 안내를 확인하세요.','양파와 대파는 오징어와 분리해 담습니다.','소스는 새지 않게 작은 용기에 보관합니다.'],tips:['양파를 먼저 볶아 단맛을 냅니다.','오징어는 센 불에 짧게 익혀 질겨지는 것을 줄입니다.','소스는 조금씩 넣어 농도를 맞춥니다.'],related:['autumn-20260920-kimchi-fishcake-stirfry','camping-chicken-skewer-ingredients','autumn-camping-shrimp-butter-grill-ingredient-checklist']},
 'camping-chicken-skewer-ingredients':{preparation:['꼬치는 조리 전까지 차갑게 보관하세요.','채소는 꼬치와 별도로 담아 눌리지 않게 합니다.','소스는 굽기 직전에 꺼내면 됩니다.'],tips:['꼬치는 뒤집어 가며 중심까지 익힙니다.','소스는 마지막에 발라 타지 않게 합니다.','채소는 고기보다 먼저 또는 따로 구우면 익힘을 맞추기 쉽습니다.'],related:all.grill},
 'camping-kimchi-pancake-ingredients':{preparation:['김치는 물기를 조절해 반죽과 따로 담으세요.','부침가루는 물 비율을 포장 표시로 확인합니다.','식용유는 새지 않게 밀봉합니다.'],tips:['반죽은 너무 두껍지 않게 펼칩니다.','중불에서 가장자리가 익을 때 뒤집습니다.','김치 국물이 많으면 반죽이 묽어질 수 있습니다.'],related:all.pan},
 'camping-pork-belly-bbq-ingredients':{preparation:['고기는 조리 전까지 냉장 상태를 유지하세요.','버섯과 파프리카는 물기를 닦아 준비합니다.','기름을 받을 용기와 집게를 따로 챙깁니다.'],tips:['그리들을 충분히 예열한 뒤 고기를 올립니다.','기름이 많으면 안전하게 정리하며 굽습니다.','김치는 고기 기름이 너무 많지 않을 때 곁들여 굽습니다.'],related:all.grill},
 'camping-tofu-kimchi-ingredients':{preparation:['두부는 깨지지 않게 수평으로 보관하세요.','김치와 채소는 미리 썰어 분리합니다.','두부의 가열 방법은 포장 표시를 확인합니다.'],tips:['김치는 양파와 먼저 볶아 수분을 정리합니다.','두부는 데우거나 구운 뒤 마지막에 담습니다.','김치의 간을 본 뒤 추가 양념을 결정합니다.'],related:all.kimchi},
 'autumn-camping-pork-kimchi-stew-ingredient-checklist':{preparation:['생고기는 다른 재료와 분리해 차갑게 보관하세요.','김치 국물은 양을 조절해 따로 담습니다.','두부는 마지막에 넣을 수 있게 따로 준비합니다.'],tips:['돼지고기와 김치를 먼저 볶아 향을 냅니다.','감자처럼 익는 데 시간이 필요한 재료를 먼저 넣습니다.','두부는 마지막에 넣어 모양을 지킵니다.'],related:all.kimchi},
 'autumn-camping-doenjang-stew-ingredient-checklist':{preparation:['된장과 육수 재료는 필요한 양만 소분하세요.','두부와 애호박은 눌리지 않게 따로 담습니다.','버섯은 물기를 털어 준비합니다.'],tips:['된장은 국물에 조금씩 풀어 뭉침을 줄입니다.','단단한 채소부터 넣어 익힙니다.','두부는 마지막에 넣어 부서짐을 줄입니다.'],related:all.soup},
 'autumn-camping-perilla-mushroom-soup-ingredient-checklist':{preparation:['들깨가루는 밀봉해 습기를 피합니다.','버섯과 두부는 따로 담아 눌림을 줄입니다.','국물 재료는 필요한 양만 준비하세요.'],tips:['버섯과 채소를 먼저 익힙니다.','들깨가루는 국물에 나누어 풀어 넣습니다.','두부는 마무리에 넣어 모양을 지킵니다.'],related:['camping-beef-mushroom-hotpot-ingredient-checklist','autumn-camping-doenjang-stew-ingredient-checklist','camping-mussel-soup-ingredients']},
 'autumn-camping-potato-sujebi-ingredient-checklist':{preparation:['감자와 채소는 비슷한 크기로 손질합니다.','수제비는 포장 상태와 보관 방법을 확인하세요.','육수 재료는 새지 않게 분리합니다.'],tips:['감자를 먼저 넣어 익힘 시간을 확보합니다.','수제비는 하나씩 넣어 서로 붙지 않게 합니다.','대파는 마지막에 넣어 향을 살립니다.'],related:['autumn-20260920-soy-butter-potato-grill','autumn-camping-doenjang-stew-ingredient-checklist','camping-fishcake-soup-ingredient-checklist']},
 'autumn-camping-shrimp-butter-grill-ingredient-checklist':{preparation:['새우는 해동·보관 표시를 확인하세요.','버터는 녹지 않게 차갑게 보관합니다.','마늘과 채소는 미리 손질해 따로 담습니다.'],tips:['새우 물기를 닦아 기름 튐을 줄입니다.','버터는 새우가 익은 뒤 넣어 타지 않게 합니다.','마늘은 오래 볶지 않아 쓴맛을 줄입니다.'],related:all.grill},
 'autumn-camping-mackerel-potato-braise-ingredient-checklist':{preparation:['손질 고등어는 해동·보관 표시를 확인하세요.','감자와 양파는 비슷한 크기로 자릅니다.','양념은 필요한 양만 소분해 가져갑니다.'],tips:['감자와 양파를 먼저 익혀 조림 시간을 맞춥니다.','고등어는 뒤집는 횟수를 줄여 살이 부서지지 않게 합니다.','국물이 너무 졸면 물을 조금씩 더합니다.'],related:['autumn-camping-potato-sujebi-ingredient-checklist','autumn-camping-chicken-potato-stew-ingredient-checklist','camping-seafood-hotpot-ingredient-checklist']},
 'autumn-camping-chicken-potato-stew-ingredient-checklist':{preparation:['생닭은 다른 식재료와 분리해 차갑게 보관하세요.','감자와 양파는 비슷한 크기로 손질합니다.','양념은 새지 않도록 밀봉합니다.'],tips:['닭과 감자는 충분히 익는지 확인합니다.','감자가 너무 부서지지 않게 저을 때 조심합니다.','대파는 마지막에 넣어 향을 더합니다.'],related:['autumn-camping-pork-kimchi-stew-ingredient-checklist','autumn-camping-mackerel-potato-braise-ingredient-checklist','autumn-camping-potato-sujebi-ingredient-checklist']},
 'autumn-camping-tteokbokki-ingredient-checklist':{preparation:['떡과 어묵의 냉장·냉동 보관 표시를 확인하세요.','양파와 대파는 미리 썰어 분리합니다.','양념 재료는 필요한 양만 소분합니다.'],tips:['양념 국물을 먼저 끓여 맛을 맞춥니다.','떡은 바닥에 붙지 않게 가끔 저어 줍니다.','대파는 마무리에 넣어 향을 더합니다.'],related:['camping-fishcake-soup-ingredient-checklist','autumn-20260920-kimchi-fishcake-stirfry','camping-kimchi-pancake-ingredients']},
 'autumn-camping-zucchini-pancake-ingredient-checklist':{preparation:['애호박은 단단하고 상처 없는 것을 고릅니다.','달걀은 깨지지 않게 별도로 담습니다.','부침가루와 기름은 새지 않게 밀봉하세요.'],tips:['애호박은 두께를 맞춰 썰면 익힘이 고릅니다.','가루는 얇게 묻혀 반죽이 두꺼워지지 않게 합니다.','중불에서 앞뒤를 천천히 익힙니다.'],related:all.pan},
 'autumn-camping-corn-cheese-ingredient-checklist':{preparation:['옥수수는 물기를 빼 사용할 양만 준비합니다.','치즈는 녹이기 전까지 차갑게 보관하세요.','양파는 잘게 썰어 별도로 담습니다.'],tips:['양파와 옥수수를 먼저 익혀 수분을 줄입니다.','치즈는 불을 낮춘 뒤 올립니다.','바닥이 눋지 않게 약불에서 살핍니다.'],related:['autumn-20260920-mushroom-cheese-grill','autumn-20260920-soy-butter-potato-grill','camping-pork-belly-bbq-ingredients']},
 'autumn-20260920-soy-butter-potato-grill':{preparation:['감자는 단단하고 상처 없는 것을 고릅니다.','버터는 조리 전까지 차갑게 보관하세요.','대파와 양파는 씻어 물기를 닦아 둡니다.'],tips:['감자는 비슷한 크기로 잘라 익힘을 맞춥니다.','버터와 간장은 감자가 익은 뒤 넣습니다.','대파는 마지막에 넣어 향을 살립니다.'],related:['autumn-camping-potato-sujebi-ingredient-checklist','autumn-camping-corn-cheese-ingredient-checklist','camping-pork-belly-bbq-ingredients']},
 'autumn-20260920-shrimp-jeon':{preparation:['새우는 해동·보관 표시를 먼저 확인하세요.','달걀은 깨지지 않게 별도로 담습니다.','부침가루는 물기와 닿지 않게 밀봉합니다.'],tips:['새우 물기를 닦아 반죽이 벗겨지는 것을 줄입니다.','한 번에 너무 많이 부치지 않습니다.','중심까지 충분히 익었는지 확인합니다.'],related:all.pan},
 'autumn-20260920-mushroom-cheese-grill':{preparation:['새송이버섯은 단단하고 물러지지 않은 것을 고릅니다.','치즈는 조리 직전까지 차갑게 보관합니다.','채소는 버섯과 따로 담아 눌리지 않게 합니다.'],tips:['버섯을 먼저 구워 수분을 날립니다.','치즈는 불을 낮춘 뒤 올립니다.','치즈가 녹으면 오래 가열하지 않습니다.'],related:['autumn-camping-corn-cheese-ingredient-checklist','camping-pork-belly-bbq-ingredients','autumn-camping-shrimp-butter-grill-ingredient-checklist']},
 'autumn-20260920-tofu-soy-grill':{preparation:['두부는 깨지지 않게 수평으로 보관합니다.','간장과 마늘은 필요한 양만 소분하세요.','대파는 씻어 물기를 닦아 둡니다.'],tips:['두부 물기를 먼저 닦아 기름 튐을 줄입니다.','표면이 단단해진 뒤 뒤집습니다.','간장 양념은 마지막에 조금씩 넣습니다.'],related:all.quick},
 'autumn-20260920-kimchi-fishcake-stirfry':{preparation:['김치와 어묵은 보관 방법을 각각 확인하세요.','김치 국물은 필요하면 따로 담습니다.','대파와 양파는 미리 손질해 분리합니다.'],tips:['김치를 먼저 볶아 수분을 정리합니다.','어묵은 마지막에 넣어 충분히 데웁니다.','간장은 맛을 본 뒤 소량만 더합니다.'],related:['camping-kimchi-fried-rice-ingredients','camping-fishcake-soup-ingredient-checklist','camping-tofu-kimchi-ingredients']},
 'autumn-20260920-jeyuk-bokkeum-ingredient-checklist':{preparation:['돼지고기는 다른 재료와 분리해 차갑게 보관하세요.','양파와 대파는 물기를 닦아 따로 담습니다.','소스는 필요한 양만 소분해 새지 않게 챙깁니다.'],tips:['양파를 먼저 볶아 단맛을 냅니다.','고기는 중심까지 충분히 익힙니다.','대파는 마지막에 넣어 향을 남깁니다.'],related:['camping-squid-stir-fry-ingredients','camping-pork-belly-bbq-ingredients','autumn-20260920-kimchi-fishcake-stirfry']},
 'autumn-20260920-sundae-bokkeum-ingredient-checklist':{preparation:['순대는 포장에 적힌 보관·가열 방법을 먼저 확인하세요.','채소와 순대는 따로 담아 눌림을 줄입니다.','양념은 필요한 양만 작은 용기에 소분합니다.'],tips:['채소를 먼저 볶아 수분을 정리합니다.','순대는 마지막에 넣어 오래 볶지 않습니다.','양념은 조금씩 더해 간을 맞춥니다.'],related:['autumn-20260920-kimchi-fishcake-stirfry','camping-kimchi-pancake-ingredients','camping-pork-belly-bbq-ingredients']},
 'autumn-20260920-dakgalbi-ingredient-checklist':{preparation:['양념 닭갈비는 조리 전까지 차갑게 보관하세요.','버섯과 채소는 물기를 닦아 따로 담습니다.','집게와 조리 장갑을 함께 챙깁니다.'],tips:['닭을 먼저 충분히 익힙니다.','버섯과 양파는 닭이 익는 동안 함께 넣습니다.','파프리카와 대파는 마지막에 넣습니다.'],related:['camping-chicken-skewer-ingredients','autumn-camping-chicken-potato-stew-ingredient-checklist','camping-pork-belly-bbq-ingredients']},
 'autumn-20260920-chicken-kimchi-fried-rice-ingredient-checklist':{preparation:['김치는 국물을 조금 덜어 따로 담으면 볶기 편합니다.','달걀은 깨지지 않게 별도로 보관하세요.','포장 볶음밥의 가열 안내를 먼저 확인합니다.'],tips:['김치를 먼저 볶아 수분을 정리합니다.','밥은 뭉치지 않게 풀어가며 볶습니다.','달걀은 마지막에 익혀 곁들입니다.'],related:['camping-kimchi-fried-rice-ingredients','autumn-20260920-kimchi-fishcake-stirfry','camping-tofu-kimchi-ingredients']},
 'autumn-20260920-mussel-seaweed-soup-ingredient-checklist':{preparation:['홍합살은 해동·보관 표시를 확인하세요.','미역은 필요한 양만 따로 담아 갑니다.','국물 재료는 새지 않게 밀봉합니다.'],tips:['미역은 충분히 불린 뒤 물기를 짭니다.','홍합살은 국물이 끓은 뒤 넣습니다.','대파는 마지막에 넣어 향을 남깁니다.'],related:['camping-mussel-soup-ingredients','camping-fishcake-soup-ingredient-checklist','autumn-camping-perilla-mushroom-soup-ingredient-checklist']},
};

export function FoodChecklistDetails({slug,articles,preparationImage,tipImage,images}:{slug:string;articles:{slug:string;title:string}[];preparationImage:ReactNode;tipImage:ReactNode;images:ReactNode}){
 const data=details[slug];
 if(!data)return null;
 const titleBySlug=new Map(articles.map(article=>[article.slug,article.title]));
 const related=data.related.filter(relatedSlug=>relatedSlug!==slug&&titleBySlug.has(relatedSlug)).slice(0,3);
 return <>
  <section><h2>재료 보관·준비</h2><ul>{data.preparation.map(item=><li key={item}>{item}</li>)}</ul>{preparationImage}</section>
  <section><h2>맛있게 만드는 팁</h2><ul>{data.tips.map(item=><li key={item}>{item}</li>)}</ul>{tipImage}</section>
  {images}
  <nav aria-label="함께 보면 좋은 요리"><h2>함께 보면 좋은 요리</h2>{related.map(relatedSlug=><p key={relatedSlug}><Link href={`/weekend-prep/${relatedSlug}`}>{titleBySlug.get(relatedSlug)} →</Link></p>)}</nav>
 </>;
}
