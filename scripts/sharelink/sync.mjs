import fs from 'node:fs';
import path from 'node:path';
import {withClient} from './client.mjs';
import {isSharelinkMaintenance,maintenanceStart,maintenanceEnd} from './maintenance.mjs';
import {refreshProducts} from './refresh-products.mjs';
import {winterCampaignVersion} from './winter-editorial.mjs';
import {seasonalCampaignVersion} from './seasonal-editorial.mjs';
if(isSharelinkMaintenance()){
 console.log('SHARELINK_SYNC_SKIPPED scheduled maintenance');
 process.exit(0);
}
const output=process.env.TOSS_SHARELINK_PUBLIC_FILE||'data/sharelink-editorial.json';
let previous;try{previous=JSON.parse(fs.readFileSync(output,'utf8'));}catch{}
// A code deployment shortly after the hourly collector reuses its verified
// feed instead of spending another provider allowance on the same products.
const previousCheck=Date.parse(previous?.checkedAt),cacheAge=Date.now()-previousCheck;
if(previous?.version===1&&previous.winterCampaignVersion===winterCampaignVersion&&previous.seasonalCampaignVersion===seasonalCampaignVersion&&Array.isArray(previous.products)&&Number.isFinite(previousCheck)&&cacheAge>=0&&cacheAge<15*60000&&(Date.now()<maintenanceStart||previousCheck>=maintenanceEnd)){
 console.log(`SHARELINK_SYNC_CACHED products=${previous.products.length}`);
 process.exit(previous.partial?1:0);
}
try {
 await withClient(async({request})=>{
  const publisherId=process.env.TOSS_SHARELINK_PUBLISHER_ID;
  if(!publisherId)throw new Error('Missing private Sharelink publisher');
  function publish(snapshot){
   const feed={version:1,winterCampaignVersion,seasonalCampaignVersion,...snapshot};
   fs.mkdirSync(path.dirname(output),{recursive:true});
   fs.writeFileSync(output+'.tmp',JSON.stringify(feed,null,2),{mode:0o644});
   fs.renameSync(output+'.tmp',output);
  }
  const result=await refreshProducts({request,publisherId,previous,
   onVerified(snapshot){
    if(!Number.isFinite(previousCheck)||cacheAge>=6*3600000||!previous?.products?.length)publish({...snapshot,partial:true});
   },
   onIssue(stage,error){console.warn('SHARELINK_STAGE_FAILED',stage,error.message);}
  });
  publish(result);
  console.log('SHARELINK_SYNC_'+(result.partial?'PARTIAL':'OK')+' products='+result.products.length+' verifiedTimedDeals='+result.products.filter(p=>p.endAt).length);
  if(result.partial)process.exitCode=1;
 });
}catch(e){console.error(e instanceof Error?e.message:'Sharelink sync failed');process.exitCode=1;}
