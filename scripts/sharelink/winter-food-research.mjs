import fs from 'node:fs';
import path from 'node:path';
import {withClient} from './client.mjs';

const output=process.env.TOSS_WINTER_RESEARCH_DIR||'.cache/sharelink/winter-foods';
const categoryFile=path.join(output,'categories.json');
const flatten=(nodes,parent=[])=>nodes.flatMap(n=>[{id:n.categoryId,name:n.displayName,path:[...parent,n.displayName].join(' > ')},...flatten(n.children||[],[...parent,n.displayName])]);
const args=process.argv.slice(2);
const mode=args.shift()||'categories';
try{
 if(!['categories','products'].includes(mode))throw new Error('Use categories or products followed by up to six category IDs');
 fs.mkdirSync(output,{recursive:true});
 await withClient(async({request})=>{
  if(mode==='categories'){
   const response=await request('/categories');
   const categories=flatten(response.categories||[]).filter(c=>c.path.startsWith('식품'));
   fs.writeFileSync(categoryFile,JSON.stringify({checkedAt:new Date().toISOString(),categories},null,2));
   console.log(JSON.stringify({mode,count:categories.length,categories:categories.filter(c=>/빵|만두|떡볶|고구마|간식|냉동/.test(c.path))}));
   return;
  }
  const ids=[...new Set(args.map(Number))];
  const known=JSON.parse(fs.readFileSync(categoryFile,'utf8')).categories;
  if(!ids.length||ids.length>6||ids.some(id=>!Number.isSafeInteger(id)||!known.some(c=>c.id===id)))throw new Error('Use one to six IDs from the saved food category catalogue');
  const results=[];
  for(const id of ids){
   const response=await request('/products/best-categories/'+id+'?size=10');
   const products=(response.items||[]).map(p=>({id:p.tacaItemId,name:p.displayName,images:p.mainImageUrls,price:p.displayPrice,discountRate:p.discountRate,isSoldOut:p.isSoldOut,productUrl:p.productUrl,categoryIds:p.categoryIds}));
   results.push({category:known.find(c=>c.id===id),checkedAt:new Date().toISOString(),products});
   fs.writeFileSync(path.join(output,'candidates.json'),JSON.stringify({results},null,2));
   console.log(JSON.stringify(results.at(-1)));
  }
 });
}catch(error){console.error(error.message);process.exitCode=1;}

