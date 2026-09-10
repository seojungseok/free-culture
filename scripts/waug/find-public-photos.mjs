import fs from 'node:fs';
import {decodeHtml} from './parse.mjs';
const terms=['에버랜드','남이섬','한국민속촌','아쿠아플라넷','허브아일랜드','서해랑','임진각 평화곤돌라','강화 루지','루덴시아','안성팜랜드','쁘띠프랑스','베고니아','주렁주렁','아쿠아필드','가나아트파크','네이처스케이프','몬스터리움','뽀로로테마파크','서울대공원','양평 양떼목장','울산 양떼목장','쥬쥬랜드','원더파크','원더빌리지','아르티스'];
const out=[];
await Promise.all(Array.from({length:3},async()=>{while(terms.length){const term=terms.shift();try{const url=`https://www.kogl.or.kr/search/search.do?query=${encodeURIComponent(term)}`;const html=await(await fetch(url,{signal:AbortSignal.timeout(20000)})).text();fs.writeFileSync(`.cache/waug/kogl-search-${term}.html`,html);const candidates=[...html.matchAll(/<a\b[^>]*href="([^"]*recommendDivView[^" ]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>({url:new URL(decodeHtml(m[1]),'https://www.kogl.or.kr').href,title:decodeHtml(m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()),license:m[2].match(/(?:제)?([1-4])유형/)?.[1]||null}));out.push({term,url,candidates,checkedAt:new Date().toISOString()});console.log(term,JSON.stringify(candidates));}catch(e){out.push({term,error:e.message});}}}));
fs.writeFileSync('data/waug/public-photo-candidates.json',JSON.stringify(out,null,2)+'\n');
