// Production reference-image adapter. Never substitutes text-only generation
// when the article requires actual product reference photos.
export function referenceImageUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname==='ads-partners.coupang.com'||u.hostname.endsWith('.coupangcdn.com'));}catch{return false;}}
export function sceneReferences(article,products){
 if(article.contentStyle!=='shoppable-scene-v2')return [];
 if(article.productIds.length<3||article.productIds.length>4||new Set(article.productIds).size!==article.productIds.length)throw Error('장면용 검증 상품 3~4개 필요');
 return article.productIds.map(id=>{const p=products.find(x=>x.id===id);if(!p?.verified||!p.specification||!p.options||!p.source||!p.evidence||!referenceImageUrl(p.image))throw Error('상품 사진·옵션 검토를 먼저 완료하세요');return {productId:id,imageUrl:p.image,name:p.name,options:p.options};});
}
export async function imageRequest({model,prompt,references},fetcher=fetch){
 const params={model,prompt,size:'1536x1024',quality:'medium',n:1,output_format:'webp'};
 if(!references.length)return {endpoint:'generations',headers:{'Content-Type':'application/json'},body:JSON.stringify(params)};
 if(references.length<3||references.length>4)throw Error('참고 사진 3~4개 필요');
 const form=new FormData();for(const [key,value] of Object.entries(params))form.set(key,String(value));
 for(const ref of references){
  if(!referenceImageUrl(ref.imageUrl))throw Error('승인되지 않은 상품 이미지 주소');
  const r=await fetcher(ref.imageUrl,{redirect:'error',signal:AbortSignal.timeout(20000)});
  const type=r.headers.get('content-type')?.split(';')[0];
  if(!r.ok||!['image/jpeg','image/png','image/webp'].includes(type)||Number(r.headers.get('content-length'))>10000000)throw Error('상품 원본 사진 다운로드 실패');
  const chunks=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>10000000)throw Error('상품 원본 사진 크기 초과');chunks.push(chunk);}
  if(!size)throw Error('빈 상품 사진');
  form.append('image[]',new Blob(chunks,{type}),`${ref.productId}.${type==='image/jpeg'?'jpg':type.split('/')[1]}`);
 }
 return {endpoint:'edits',headers:{},body:form};
}
