import {load} from 'cheerio';
import {createHash} from 'node:crypto';
import {dateOnly,safePublicUrl} from '../../lib/learning.mjs';
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const idFor=value=>createHash('sha256').update(value).digest('hex').slice(0,20);
export function scienceDates(value,defaultYear){
 let year=defaultYear;const result=[];
 for(const match of String(value).matchAll(/(?:(20\d{2})\s*[.년/]\s*)?(\d{1,2})\s*[.월/]\s*(\d{1,2})\s*[.일]?/g)){
  if(match[1])year=Number(match[1]);
  const date=dateOnly(`${year}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`);if(date)result.push(date);
 }
 return result;
}
export function parseCentralScience(html,{url,now=new Date().toISOString()}){
 const $=load(html),records=[];
 const table=$('table').filter((_,el)=>$(el).find('th').text().includes('교육대상')).first();
 if(!table.length)throw new Error('교육표 구조 변경');
 table.find('tbody tr').each((_,tr)=>{
  const cells=$(tr).children('td').map((_,td)=>clean($(td).text())).get();if(cells.length<7||!/교육중|교육예정/.test(cells[1])||/종사자|전문인력/.test(cells[3]))return;
  const year=Number(cells[2].match(/20\d{2}/)?.[0]||new Date(now).getUTCFullYear()),dates=scienceDates(cells[4],year);
  if(!dates.length)return;
  const officialUrl=safePublicUrl($(tr).find('a[href^="https://rsvn.science.go.kr/"]').last().attr('href'))||url;
  records.push({id:idFor(url+'|'+cells[0]),title:cells[2],institution:'국립중앙과학관',area:'대전',city:'유성구',audience:cells[3],period:cells[4],start:dates[0],end:dates.at(-1),registration:cells[5],registrationEnd:scienceDates(cells[5],year).at(-1)||'',method:'공식 교육예약에서 확인',price:'프로그램별 공식 안내 확인',sourceStatus:cells[1],officialUrl,source:url,checkedAt:now});
 });
 return records;
}
function tableGrid($,table){
 const rows=[];
 $(table).find('tbody tr').each((ri,tr)=>{rows[ri]||=[];let col=0;$(tr).children('td,th').each((_,cell)=>{while(rows[ri][col]!==undefined)col++;const value=clean($(cell).text()),rs=Number($(cell).attr('rowspan')||1),cs=Number($(cell).attr('colspan')||1);for(let r=ri;r<ri+rs;r++){rows[r]||=[];for(let c=col;c<col+cs;c++)rows[r][c]=value;}col+=cs;});});
 return rows;
}
export function parseIncheonScience(html,{url,now=new Date().toISOString()}){
 const $=load(html),body=clean($('body').text()),year=Number(body.match(/운영 기간\s*[:：]?\s*(20\d{2})/)?.[1]);
 if(!year)throw new Error('운영 연도 확인 실패');
 const records=[];
 const table=$('table').filter((_,el)=>$(el).find('th').text().includes('공작 활동')).first();
 if(!table.length)throw new Error('교육표 구조 변경');
 for(const cells of tableGrid($,table)){
  if(cells.length<8)continue;
  const dates=scienceDates(cells[0],year);if(!dates.length)continue;
  const title=cells[1]+' / '+cells[3].replace(/^[①-⑳]\s*/,''),registration=cells[7];
  records.push({id:idFor(url+'|'+title+'|'+cells[0]),title,institution:'인천학생과학관',area:'인천',city:'중구',audience:cells[5],period:cells[0]+' '+cells[4],start:dates[0],end:dates.at(-1),registration,registrationEnd:scienceDates(registration,year).at(-1)||'',method:'교육청 참여/신청 안내에서 확인',price:'공식 안내 확인',sourceStatus:'공식 일정 안내',officialUrl:url,source:url,checkedAt:now});
 }
 return records;
}
