export const venueName=value=>String(value||'').replace(/\([^)]*\)|\[[^\]]*\]|농촌체험휴양|어촌체험휴양|농촌체험|어촌체험|팜스테이|[\s·]/g,'');
const street=value=>String(value||'').replace(/\([^)]*\)/g,'').replace(/^\S+\s+/,'').replace(/\s+/g,'').trim();
function distance(a,b){
 const lon1=Number(a.longitude),lat1=Number(a.latitude),lon2=Number(b.mapx),lat2=Number(b.mapy);
 if(![lon1,lon2].every(x=>x>=124&&x<=132)||![lat1,lat2].every(y=>y>=33&&y<=39.5))return Infinity;
 const rad=Math.PI/180,dlat=(lat2-lat1)*rad,dlon=(lon2-lon1)*rad;
 return 6371*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dlon/2)**2));
}
export function matchExperienceVenue(record,candidates){
 const name=venueName(record.title);if(name.length<3)return undefined;
 const same=candidates.filter(venue=>venue.area===record.area&&venueName(venue.title)===name&&(distance(record,venue)<=1||street(record.address)&&street(record.address)===street(venue.addr)));
 return same.length===1?same[0]:undefined;
}
