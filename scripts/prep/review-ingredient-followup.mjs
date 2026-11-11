import fs from 'node:fs';
import {collectIngredients} from './complete-ingredient-links.mjs';
import {ingredientQueries} from './ingredient-completion-plan.mjs';
const keywords={
 'fishcake':['삼진어묵 모듬어묵','대림선 부산어묵 사각'],
 'mushrooms':['느타리 팽이 새송이 모듬버섯','생 버섯 모듬'],
 'egg':['무항생제 계란 10구','신선 생 계란'],
 'griddle':['캠핑 그리들 팬','코팅 그리들'],
 'plate':['캠핑 스텐 원형 접시','스테인리스 원형접시'],
 'butter':['프레지덩 무염버터','앵커 무염버터'],
 'chicken-stew':['하림 닭볶음탕용 생닭','토막 닭 냉장'],
 'chicken-friedrice':['닭가슴살 김치 볶음밥 냉동','허닭 김치볶음밥'],
 'mayonnaise':['오뚜기 골드 마요네즈','청정원 고소한 마요네즈'],
 'soup-soy':['샘표 맑은 국간장','청정원 국간장'],
 'skewer-stick':['대나무 산적 꼬지','요리 꼬치 막대'],
 'tomato':['완숙 토마토 국내산','빨간 토마토 1kg'],
 'perilla-leaf':['쌈 생깻잎','국내산 생 깻잎'],
 'mackerel':['순살 손질 고등어 냉동','손질 고등어 냉동'],
};
const queries=Object.entries(keywords).map(([key,keywords])=>{const q={...ingredientQueries.find(q=>q.key===key),keywords};if(key==='mushrooms')q.exclude+='|동고|절편|선물세트|말린';if(key==='perilla-leaf')q.exclude+='|양념';if(key==='tomato')q.exclude+='|스테비아|레몬향|방울';if(key==='skewer-stick')q.include=['꼬치|꼬지|꽂이'];if(key==='chicken-stew')q.include=['닭볶음탕|볶음탕용|토막'];return q;});
try{await collectIngredients({enabled:process.env.PREP_INGREDIENT_COMPLETION==='1',queries,save:result=>fs.writeFileSync('data/prep-ingredient-followup-20261111.json',JSON.stringify(result,null,2)+'\n'),progress:value=>console.log(JSON.stringify(value))});}
catch{console.error('Follow-up stopped. No automatic retry or shared lock reset.');process.exitCode=1;}
