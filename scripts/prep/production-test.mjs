import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3258';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3258'],{env:{...process.env,WEEKEND_PREP_LOCAL_REVIEW:'1'},stdio:'ignore',windowsHide:true});
try{
 for(let i=0;i<40;i++){try{if((await fetch(base+'/weekend-prep')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
 const listing=await fetch(base+'/weekend-prep');assert.equal(listing.status,200);const html=await listing.text();assert(html.includes('noindex'));assert(!html.includes('light-picnic-packing'));
 const draft=await fetch(base+'/weekend-prep/light-picnic-packing');assert.equal(draft.status,404);
 const admin=await fetch(base+'/api/weekend-prep/admin');assert.equal(admin.status,403);
 const sitemap=await (await fetch(base+'/sitemap.xml')).text();assert(!sitemap.includes('/weekend-prep/light-picnic-packing'));
 console.log('production: empty list noindex, draft 404, manager API 403, no draft in sitemap; review flag ignored');
}finally{child.kill();}
