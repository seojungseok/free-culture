export const playgroundTopics={all:'전체',indoor:'실내 놀이터',free:'무료 놀이터',outdoor:'공원·야외 놀이터'};
export function playgroundBrowseHref(area='',type='all',q=''){
 const params=new URLSearchParams();
 if(area)params.set('area',area);
 if(type!=='all')params.set('type',type);
 if(q)params.set('q',q);
 return '/playgrounds'+(params.size?'?'+params.toString():'')+'#finder';
}
export function filterPlaygroundGuides(guides,{area='',type='all',q=''}={}){
 const search=q.replace(/\s/g,'').toLocaleLowerCase('ko-KR');
 return guides.filter(g=>(!area||g.area===area)&&(type!=='indoor'||g.indoor)&&(type!=='outdoor'||!g.indoor)&&(type!=='free'||g.visit?.feeKind==='free')&&(!search||[g.name,g.title,g.area,g.district,g.intro,...(g.visit?.highlights||[])].join(' ').replace(/\s/g,'').toLocaleLowerCase('ko-KR').includes(search)));
}
