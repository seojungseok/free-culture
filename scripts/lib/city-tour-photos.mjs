import fs from 'node:fs';
export const photoKey=url=>{try{const u=new URL(url);return u.hostname+u.pathname.replace(/_image\d.*(?=\.)/,'');}catch{return url||'';}};
const norm=s=>String(s||'').replace(/[\s()·,_\-]/g,'');
export function cityPhotoCandidates(article,places,gallery){
 const route=article.raw['시티투어코스정보']||'';
 const tokens=route.split(/[+→>\n_\-&,/＆·]/).flatMap(s=>[s,s.replace(/\([^)]*\)/g,''),...(s.match(/\(([^)]+)\)/g)||[]).map(x=>x.slice(1,-1))]).map(norm);
 const stops=places.filter(p=>p.area===article.area&&p.image&&tokens.some(t=>t===norm(p.title)||t===norm(p.title)+'경유'));
 for(const r of article.related||[]){const p=places.find(p=>p.id===r.id&&p.area===article.area&&p.addr===r.address);if(p&&route.includes(r.title)&&!stops.includes(p))stops.push(p);}
 const result=[];for(const p of stops){result.push({image:p.image.replace(/^http:/,'https:'),title:p.title,location:p.addr,placeId:p.id,credit:'한국관광공사',sourceUrl:'/places/spot/'+p.id});
 for(const g of gallery){if(norm(g.title)===norm(p.title)&&g.location?.startsWith(article.area))result.push({image:g.image.replace(/^http:/,'https:'),title:p.title,location:g.location,placeId:p.id,credit:'한국관광공사'+(g.photographer?' · '+g.photographer:''),sourceUrl:'/places/spot/'+p.id});}}
 const areaNames={경북:'경상북도',경남:'경상남도',경기:'경기도',전남:'전라남도',전북:'전북',충남:'충청남도',충북:'충청북도'};
 for(const g of gallery){if(tokens.includes(norm(g.title))&&(g.location?.startsWith(article.area)||g.location?.startsWith(areaNames[article.area]||article.area)))result.push({image:g.image.replace(/^http:/,'https:'),title:g.title,location:g.location,credit:'한국관광공사'+(g.photographer?' · '+g.photographer:''),sourceUrl:'https://korean.visitkorea.or.kr',galleryId:g.id});}
 return [...new Map(result.filter(p=>p.image).map(p=>[photoKey(p.image),p])).values()];
}
export function chooseCityPhoto(article,places,gallery,used){return cityPhotoCandidates(article,places,gallery).find(p=>!used.has(photoKey(p.image)))||null;}
export function updateCityPhotos(db,places,gallery){
 const used=new Set();const rows=db.articles.map(a=>({a,candidates:cityPhotoCandidates(a,places,gallery)})).sort((a,b)=>a.candidates.length-b.candidates.length||a.a.id.localeCompare(b.a.id));
 for(const {a,candidates}of rows){const selected=candidates.find(p=>p.image===a.heroPhoto?.image&&!used.has(photoKey(p.image)))||candidates.find(p=>!used.has(photoKey(p.image)));
 a.heroPhoto=selected?{...selected,status:'matched',checkedAt:new Date().toISOString()}:null;a.image=selected?.image||'';a.imageTitle=selected?.title||'';a.heroPhotoStatus=selected?'matched':'matching_photo_pending';if(selected)used.add(photoKey(selected.image));}
 return {total:rows.length,matched:used.size,pending:rows.filter(r=>!r.a.image).map(r=>r.a.id)};
}
