import {readCache,writeCache} from './lib/tourClient.mjs';
import {titleKey,validFact,sourceExcerpt} from './lib/cultureSource.mjs';
const store=readCache('event-source-details.json',{events:{}});
let removed=0,retained=0;
for(const record of Object.values(store.events)) {
  const d=record.sourceDetail;if(!d)continue;
  const key=titleKey(d.eventTitle);
  d.facts=d.facts.filter(f=>validFact(f.label,f.value));d.excerpt=sourceExcerpt(d.excerpt,d.title);
  if(key.length<2||!titleKey(d.title).includes(key)) {d.status='identity-unconfirmed';record.pageResult=d.status;removed++;}
  else if(!d.facts.length&&!d.excerpt){d.status='no-readable-detail';record.pageResult=d.status;removed++;}
  else retained++;
}
writeCache('event-source-details.json',store);console.log(JSON.stringify({retained,heldForReview:removed}));
