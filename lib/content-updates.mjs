// Rechecking the same facts is not a content modification. Never substitute
// dataset generatedAt, checkedAt or the current date for a page's lastmod.
export function latestContentDate(...values){
 const now=Date.now();
 const times=values.filter(v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)).map(v=>Date.parse(v)).filter(t=>Number.isFinite(t)&&t<=now);
 return times.length?new Date(Math.max(...times)):undefined;
}
export function currentSearchRecord(record,day){return !/^\d{8}$/.test(record.endDate||'')||record.endDate>=day;}
