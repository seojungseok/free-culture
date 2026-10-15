export const homeFilters=[['all','전체'],['weekend','이번 주말 행사'],['kids','아이와'],['free','무료 행사']];
export function homeCandidates(items,filter,day,weekend){
 return items.filter(item=>(!item.end||item.end>=day)&&(
  filter==='kids'?item.kids===true:
  filter==='free'?item.free===true:
  filter==='weekend'?Boolean(item.start&&item.end&&item.start<=weekend.end&&item.end>=weekend.start):true
 )).slice(0,8);
}
