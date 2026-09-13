import {readStore,saveStore} from './store.mjs';
import {publicationErrors,checkLinks} from './content.mjs';
const store=readStore();let changed=false;
for(const a of store.articles){if(a.status!=='scheduled'||Date.parse(a.publishAt)>Date.now())continue;try{const errors=publicationErrors(a,store);if(errors.length)throw Error(errors.join(' / '));const bad=await checkLinks(a,store);if(bad.length)throw Error('제휴링크 확인 실패');a.status='published';a.updatedAt=new Date().toISOString();changed=true;console.log('발행 준비 완료:',a.slug);}catch(e){console.warn('이 글만 보류:',a.slug,e.message);}}
if(changed)saveStore(store,store.version);
