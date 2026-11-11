import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const storeFile='data/weekend-prep.json',logFile='data/prep-copy-edits-20261111.json';
export function polishGuideCopy(store){
 const edits=[];
 const change=(article,path,value)=>{let target=article;const parts=path.split('.');for(const part of parts.slice(0,-1))target=target[part];const key=parts.at(-1),before=target[key];if(before===value)return;edits.push({slug:article.slug,path,before,after:value});target[key]=value;};
 const dish=title=>title.split(/[|｜]/)[0].replace(/^(가을 대표 요리|가을 캠핑|캠핑)\s*/,'').replace(/\s*재료 체크리스트.*$/,'').trim();
 for(const article of store.articles){
  if(article.checklist?.length){
   const name=dish(article.title);
   if(/재료 체크리스트\s+완성 요리 장면/.test(article.cover.alt))change(article,'cover.alt',`완성된 ${name}`);
   const description=article.description.replace(/와 양념·공통 준비물을/g,' 등의 식재료와 양념, 조리도구를').replace('그리들 도구','그리들과 조리도구').replace('공통 조리도구','조리도구').replace('함께 챙기는','함께 준비하는');
   change(article,'description',description);
   article.sections.forEach((section,index)=>{
    if(section.image){const alt=section.image.alt.replace('공통 준비물인 조리 도구 점검 장면','조리에 필요한 도구').replace('공통 준비물인','조리에 필요한').replace('공통 준비물','조리에 필요한');change(article,`sections.${index}.image.alt`,alt);}
   });
  }
  // Correct concrete awkward wording without changing amounts, instructions, URLs or product names.
  const replacements=[['캠핑 팬에서도 실패하기 쉬운 순서만 골라 정리했습니다.','캠핑용 팬으로 구울 때 주의할 점과 조리 순서를 정리했습니다.'],['들깨와 깻잎을 넣는 순간까지','들깨와 깻잎을 넣는 순서까지'],['밥알을 먼저 풀고 김치 수분을 날린 뒤 눌려 볶는 순서','밥알을 먼저 풀고 김치 수분을 날린 뒤 얇게 눌러 볶는 순서']];
  let description=article.description;for(const [before,after] of replacements)description=description.replace(before,after);change(article,'description',description);
  article.sections.forEach((section,index)=>{const text=section.text.replace('사진처럼 접시에 담되 식기는 사진의 + 링크에서만 확인할 수 있습니다.','필요한 식기는 사진 아래 준비물 버튼에서 확인할 수 있습니다.').replace('재료상','재료');change(article,`sections.${index}.text`,text);});
  const coverAlt=article.cover.alt.replace(/재료상$/,'재료');change(article,'cover.alt',coverAlt);
  const labels={'국물육수 다시팩':'육수용 다시팩','육수 다시팩':'육수용 다시팩','부대찌개 구성':'부대찌개 밀키트','소고기 샤브샤브 구성':'소고기 샤브샤브 밀키트','순대볶음 구성':'순대볶음 밀키트','모둠해물탕':'해물탕 밀키트','다진마늘':'다진 마늘','무염버터':'무염 버터','개인 식판':'식판','개인 접시':'접시'};
  (article.checklist||[]).forEach((item,index)=>{if(labels[item.label])change(article,`checklist.${index}.label`,labels[item.label]);});
  for(const item of article.shoppingItems||[])if(labels[item.label])item.label=labels[item.label];
 }
 return edits;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const store=JSON.parse(fs.readFileSync(storeFile,'utf8')),edits=polishGuideCopy(store);
 if(edits.length){const existing=fs.existsSync(logFile)?JSON.parse(fs.readFileSync(logFile,'utf8')):[];fs.writeFileSync(logFile,JSON.stringify([...existing,...edits],null,2)+'\n');}
 fs.writeFileSync(storeFile,JSON.stringify(store,null,2)+'\n');
 console.log(JSON.stringify({copyEdits:edits.length,urlsChanged:0,affiliateUrlsChanged:0}));
}
