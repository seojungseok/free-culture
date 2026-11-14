import {SITE} from '@/lib/site';
export default function PublicDiscoverySchema({title,path,items}:{title:string;path:string;items:{name:string;url:string}[]}){
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'CollectionPage','@id':SITE.url+path,name:title,url:SITE.url+path,inLanguage:'ko-KR',mainEntity:{'@type':'ItemList',numberOfItems:items.length,itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,url:new URL(item.url,SITE.url).href}))}},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:SITE.url},{'@type':'ListItem',position:2,name:title,item:SITE.url+path}]},
 ]};
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>;
}
