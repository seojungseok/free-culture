import {getAllPlaces} from './tour';
import type {CityArticle} from './cityTours';
import type {CourseStop} from './courses';
import {galleryForStops,placePhotoName,photoArea,type GalleryPhoto} from './photoGallery';
/** Only original route stops; existing related IDs act as evidence, not fuzzy suggestions. */
export function cityTourStops(article:CityArticle):CourseStop[]{
 const route=article.raw['시티투어코스정보'] || '';
 const tokens=route.split(/[+→>\n_\-&,/＆·]/).flatMap(s=>[s,...(s.match(/\(([^)]+)\)/g)||[]).map(x=>x.slice(1,-1))]).map(s=>placePhotoName(s.replace(/^.*?:\s*/,''))).filter(n=>n.length>=3);
 const places=getAllPlaces().filter(p=>p.area===article.area&&photoArea(p.addr)===article.area);
 const stops:CourseStop[]=[],seen=new Set<string>();
 for(const token of tokens){const matches=places.filter(p=>placePhotoName(p.title)===token);if(matches.length!==1)continue;const p=matches[0];if(seen.has(p.id))continue;seen.add(p.id);stops.push({num:stops.length+1,name:p.title,addr:p.addr,mapx:p.mapx,mapy:p.mapy,placeId:p.id,image:p.image,overview:''});}
 for(const link of article.related){const name=placePhotoName(link.title);const namedActivity=route.split(/[+→>\n_\-&,/＆·]/).some(segment=>segment.trim().startsWith(link.title+' '));if(!tokens.includes(name)&&!namedActivity)continue;const p=places.find(p=>p.id===link.id);if(!p||seen.has(p.id)||p.addr!==link.address)continue;seen.add(p.id);stops.push({num:stops.length+1,name:p.title,addr:p.addr,mapx:p.mapx,mapy:p.mapy,placeId:p.id,image:p.image,overview:''});}
 return stops;
}
export function cityTourPhotos(article:CityArticle):GalleryPhoto[]{
 const stops=cityTourStops(article),photos=galleryForStops(stops,5,article.area);
 if(article.heroPhoto?.status==='matched'){const h=article.heroPhoto;const i=photos.findIndex(p=>p.image===h.image);if(i>=0)photos.splice(i,1);photos.unshift({id:'hero-'+article.id,image:h.image,title:h.title,location:h.location,month:'',keywords:h.title,photographer:h.credit});}
 const seen=new Set(photos.map(p=>p.image.replace(/^http:/,'https:')));
 for(const stop of stops){const image=stop.image.replace(/^http:/,'https:');if(photos.length>=5)break;if(!image||seen.has(image))continue;seen.add(image);photos.push({id:'place-'+stop.placeId,title:stop.name,image,location:stop.addr || '',month:'',keywords:stop.name,photographer:''});}
 return photos;
}
