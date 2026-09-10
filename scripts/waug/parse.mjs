export const decodeHtml=s=>s.replace(/&nbsp;/g,' ').replace(/&middot;/g,'·').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export function validity(text){
  const clause=decodeHtml(text).match(/유효기간\s*[:：]?([^가]*?)(?:까지|사용 가능|기간 내|주소|$)/)?.[1] || '';
  const dates=[...clause.matchAll(/(20\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})/g)].map(m=>`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`);
  // A range begins at the first date; the final date is the expiration date.
  return {validFrom:dates.length>1?dates[0]:null,validUntil:dates.at(-1)||null};
}
