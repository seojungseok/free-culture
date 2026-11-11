import fs from 'node:fs';
const file='data/weekend-prep.json',store=JSON.parse(fs.readFileSync(file,'utf8'));
const registry=JSON.parse(fs.readFileSync('data/prep-registered-products-20261111.json','utf8'));
let restored=0;
for(const row of registry){
 if(!row.slug)continue;
 if(!row.reviewed||!row.reviewNote||!row.localImage||!row.reviewedAt)throw Error('Registered product needs photo and option review');
 const article=store.articles.find(a=>a.slug===row.slug);if(!article)throw Error('Existing guide required');
 const age=row.key==='ring-toss';
 const item={id:row.key,label:row.label,role:age?'판매처에 최소 연령 14세로 표시된 고리던지기 세트입니다. 14세 이상 자녀와 보호자가 함께 사용하는 경우에 확인하세요.':row.specification,group:'main',affiliate:{url:row.url,productName:row.productName,checkedAt:row.checkedAt,source:'registered-product',sourceUrl:row.sourceUrl,reviewed:true,reviewedAt:row.reviewedAt,image:row.localImage,optionNote:(age?'최소 연령 14세 · ':'')+row.options+' · 현재 구성과 판매 조건은 판매처에서 확인하세요.'}};
 article.shoppingItems=(article.shoppingItems||[]).filter(i=>i.id!==item.id);article.shoppingItems.push(item);article.updatedAt=row.reviewedAt;
 restored++;
}
fs.writeFileSync(file,JSON.stringify(store,null,2)+'\n');console.log(JSON.stringify({registeredProductsRestored:restored}));
