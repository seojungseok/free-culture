import type {Experience} from './experienceData';
import {experienceHref,experienceTopics} from './experienceData';
import {SITE} from './site';
export function experienceStructuredData(item:Experience){
 const url=new URL(experienceHref(item),SITE.url).href,image=item.image?new URL(item.image.src,SITE.url).href:undefined;
 const description=[item.summary,...item.content,...item.activities].join(' ').slice(0,1500);
 const location={'@type':'Place',name:item.kind==='science'?item.institution:item.title,...(item.address?{address:{'@type':'PostalAddress',streetAddress:item.address,addressCountry:'KR'}}:{})};
 const mainEntity=item.kind==='rural'?{...location,'@type':'TouristAttraction','@id':url+'#place',description,url,image,telephone:item.phone||undefined,...(item.latitude>=33&&item.latitude<=39.5&&item.longitude>=124&&item.longitude<=132?{geo:{'@type':'GeoCoordinates',latitude:item.latitude,longitude:item.longitude}}:{})}:{'@type':item.kind==='science'?'EducationEvent':'Event','@id':url+'#event',name:item.title,description,url,image,startDate:item.start||undefined,endDate:item.end||undefined,location,organizer:{'@type':'Organization',name:item.institution},...(item.free?{isAccessibleForFree:true}:{}),audience:{'@type':'Audience',audienceType:item.audience}};
 return {'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':url,name:item.title,url,description,inLanguage:'ko-KR',mainEntity:{'@id':url+(item.kind==='rural'?'#place':'#event')},isPartOf:{'@type':'WebSite',name:SITE.name,url:SITE.url}},
  mainEntity,
  {'@type':'BreadcrumbList',itemListElement:[{name:'홈',item:SITE.url},{name:'체험·교육',item:new URL('/experiences',SITE.url).href},{name:experienceTopics[item.kind].short,item:new URL('/experiences/'+item.kind,SITE.url).href},{name:item.title,item:url}].map((entry,index)=>({'@type':'ListItem',position:index+1,...entry}))}
 ]};
}
