import fs from 'node:fs/promises';
const seeds=['겨울 캠핑요리','캠핑 국물요리','밀푀유나베','만두전골','닭한마리','순두부찌개','고추장찌개','소고기뭇국','떡만둣국','김치우동','수육','굴국','동태탕','감바스','우삼겹숙주볶음','계란찜','고구마치즈구이'];
const results=[];
for(const seed of seeds){
 const u=new URL('https://ac.search.naver.com/nx/ac');
 for(const [k,v] of Object.entries({q:seed,con:'0',frm:'nv',ans:'2',r_format:'json',r_enc:'UTF-8',r_unicode:'0',t_koreng:'1',run:'2',rev:'4',q_enc:'UTF-8',st:'100'}))u.searchParams.set(k,v);
 const response=await fetch(u,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Autocomplete HTTP '+response.status);
 const body=await response.json(),suggestions=[...new Set((body.items||[]).flatMap(group=>group.map(item=>item[0])))];
 results.push({seed,url:u.href,checkedAt:new Date().toISOString(),suggestions});
 console.log(JSON.stringify({seed,suggestions}));
 await new Promise(resolve=>setTimeout(resolve,300));
}
await fs.mkdir('output/winter-camping-15-20261115',{recursive:true});
await fs.writeFile('data/winter-camping-keyword-research-20261115.json',JSON.stringify({checkedAt:new Date().toISOString(),method:'Public Naver autocomplete wording; not monthly search volume or rankings',results},null,2)+'\n');
