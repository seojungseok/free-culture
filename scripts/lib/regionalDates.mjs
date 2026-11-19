// Korean local calendar dates from city festival providers.
function day(year, month, date){
 const ms=Date.UTC(year,month-1,date), d=new Date(ms);
 if(year<1900||year>2100||d.getUTCMonth()!==month-1||d.getUTCDate()!==date)return '';
 return d.toISOString().slice(0,10).replaceAll('-','');
}
export function regionalYmd(value){
 const s=String(value??'').trim();
 if(/^\d{13}$/.test(s))return new Date(Number(s)+9*3600000).toISOString().slice(0,10).replaceAll('-','');
 const m=s.match(/^(\d{4})(?:[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})\.?(?:\s.*)?|(\d{2})(\d{2}))$/);
 return m?day(+m[1],+(m[2]||m[4]),+(m[3]||m[5])):'';
}
export function regionalDateRange(value){
 const text=String(value??'');
 const m=/(\d{4})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]\s*(\d{1,2})(?!\d)/.exec(text);
 if(!m)return {start:'',end:''};
 const start=day(+m[1],+m[2],+m[3]);
 const tail=text.slice(m.index+m[0].length).replace(/^\s*\.?\s*(?:\([일월화수목금토]\))?\s*/,'');
 if(!/^[~～∼–-]/.test(tail))return {start,end:start};
 const next=tail.match(/^[~～∼–-]\s*(?:(\d{4})\s*[.\/-]\s*)?(\d{1,2})\s*[.\/-]\s*(\d{1,2})(?!\d)/);
 if(!next)return {start:'',end:''};
 const end=day(+(next[1]||m[1]),+next[2],+next[3]);
 return start&&end>=start?{start,end}:{start:'',end:''};
}
