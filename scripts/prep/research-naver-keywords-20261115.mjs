import fs from 'node:fs/promises';

// Read public autocomplete only. This is evidence of suggested wording, not search volume.
const seeds = ['캠핑 요리','캠핑 음식','꽃게탕','어묵탕','부대찌개','소고기 버섯전골','해물탕','햄치즈 샌드위치','잔치국수','야채꼬치','캠핑 준비물','고리던지기','제육볶음','순대볶음','닭갈비','오징어볶음','김치볶음밥','해물라면','홍합탕','닭꼬치','김치전','캠핑 삼겹살','두부김치','돼지고기 김치찌개','된장찌개','들깨버섯탕','감자수제비','새우버터구이','고등어감자조림','닭볶음탕','떡볶이','애호박전','콘치즈','감자버터구이','새우전','버섯치즈구이','두부간장구이','김치어묵볶음','닭가슴살 김치볶음밥','홍합미역국','두부구이'];
const results = [];
for (const seed of seeds) {
  const url = new URL('https://ac.search.naver.com/nx/ac');
  for (const [key,value] of Object.entries({q:seed,con:'0',frm:'nv',ans:'2',r_format:'json',r_enc:'UTF-8',r_unicode:'0',t_koreng:'1',run:'2',rev:'4',q_enc:'UTF-8',st:'100'})) url.searchParams.set(key,value);
  try {
    const response = await fetch(url, {signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const suggestions = [...new Set((data.items || []).flatMap(group => group.map(item => item[0])).filter(value => typeof value === 'string'))];
    results.push({seed,url:url.href,checkedAt:new Date().toISOString(),suggestions});
    console.log(JSON.stringify({seed,suggestions}));
  } catch (error) {
    results.push({seed,checkedAt:new Date().toISOString(),error:error.message,suggestions:[]});
    console.log(JSON.stringify({seed,error:error.message}));
  }
  await new Promise(resolve=>setTimeout(resolve,250));
}
await fs.mkdir('output/camping-naver-20261115',{recursive:true});
await fs.writeFile('output/camping-naver-20261115/naver-autocomplete.json',JSON.stringify({checkedAt:new Date().toISOString(),method:'Public Naver autocomplete suggestions; no search volume or ranking data',results},null,2)+'\n');
