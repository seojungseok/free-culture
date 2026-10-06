import fs from 'node:fs';
import {withClient} from './client.mjs';
const flatten=(nodes,parent=[])=>nodes.flatMap(n=>[{id:n.categoryId,name:[...parent,n.displayName].join(' > ')},...flatten(n.children||[],[...parent,n.displayName])]);
try{await withClient(async({request})=>{
 const categories=await request('/categories');
 const deals=await request('/products/today-deals?size=30');
 fs.mkdirSync('.cache/sharelink',{recursive:true});
 fs.writeFileSync('.cache/sharelink/research.json',JSON.stringify({checkedAt:new Date().toISOString(),categories:flatten(categories.categories||[]),deals:deals.items||[]},null,2));
 console.log(JSON.stringify({dealCount:deals.items?.length||0,categories:flatten(categories.categories||[]).filter(c=>/캠핑|피크닉|조리|식품|레저|수납|유아|반려/.test(c.name)).slice(0,70),deals:(deals.items||[]).map(p=>({id:p.tacaItemId,name:p.displayName,price:p.displayPrice,endAt:p.endAt,soldOut:p.isSoldOut}))},null,2));
});}catch(e){console.error(e.message);process.exitCode=1;}
