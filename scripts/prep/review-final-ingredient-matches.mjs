import fs from 'node:fs';
import {collectIngredients} from './complete-ingredient-links.mjs';
import {ingredientQueries} from './ingredient-completion-plan.mjs';
const overrides={
 mushrooms:{keywords:['생 모둠버섯 세트','모듬버섯 3종','전골 모둠버섯'],include:['버섯','모둠|모듬|혼합|3종|4종|세트'],exclude:'동고|건조|말린|절편|선물|키우기|종균|가루'},
 'perilla-leaf':{keywords:['생 깻잎 30장','쌈채소 깻잎','유기농 깻잎'],include:['깻잎'],exclude:'깻순|깨순|깻잎순|나물|양념|장아찌|절임|김치|씨앗|모종'},
 'chicken-friedrice':{keywords:['허닭 닭가슴살 김치곤약볶음밥','한끼통살 닭가슴살 김치볶음밥','닭가슴살 김치 볶음밥 단일'],include:['닭가슴살','김치','볶음밥'],exclude:'혼합|3종|소불고기|차돌|참치|볶음밥소스'},
 'chili-powder':{keywords:['국내산 고춧가루 김치용 500g','국산 고춧가루 중간맛','고춧가루 보통맛'],include:['고춧가루|고추가루'],exclude:'베트남|볶음|고추씨|페페론치노|고추장|청양'},
};
const queries=Object.entries(overrides).map(([key,value])=>({...ingredientQueries.find(q=>q.key===key),...value}));
try{await collectIngredients({enabled:process.env.PREP_INGREDIENT_COMPLETION==='1',queries,save:result=>fs.writeFileSync('data/prep-ingredient-final-20261111.json',JSON.stringify(result,null,2)+'\n'),progress:value=>console.log(JSON.stringify(value))});}
catch{console.error('Final ingredient review stopped. Shared gate and no-retry rules retained.');process.exitCode=1;}
