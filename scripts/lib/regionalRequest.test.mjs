import test from 'node:test';
import assert from 'node:assert/strict';
import { regionalRequest, regionalRefreshStatus } from './regionalRequest.mjs';
const ok={response:{header:{resultCode:'0000'},body:{items:{item:[]}}}};
const response=value=>({ok:true,text:async()=>typeof value==='string'?value:JSON.stringify(value)});
test('timeout and 503 retry within a three-request bound, then recover',async()=>{
 let calls=0;const delays=[];
 const result=await regionalRequest('https://fixture.invalid/?serviceKey=never-log', {pause:async ms=>delays.push(ms),fetchImpl:async()=>{
  calls++;if(calls===1)throw Object.assign(new Error('secret-url'),{name:'TimeoutError'});
  if(calls===2)return {ok:false,status:503};return response(ok);
 }});
 assert.deepEqual(result,ok);assert.equal(calls,3);assert.deepEqual(delays,[2000,4000]);
});
test('exhausted timeout is sanitized and classified for deferral',async()=>{
 let calls=0;await assert.rejects(regionalRequest('secret-url',{pause:async()=>{},fetchImpl:async()=>{calls++;throw Object.assign(new Error('secret-key'),{name:'TimeoutError'});}}),e=>e.transient&&!e.message.includes('secret'));
 assert.equal(calls,3);
});
test('authentication, schema and daily quota failures are never retried or hidden',async()=>{
 for(const value of [{response:{header:{resultCode:'30'}}},'<OpenAPI_ServiceResponse><cmmMsgHeader><returnReasonCode>22</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>','not-json',{}]){
  let calls=0;await assert.rejects(regionalRequest('fixture',{pause:async()=>{},fetchImpl:async()=>{calls++;return response(value);}}),e=>!e.transient);assert.equal(calls,1);
 }
});
test('XML gateway timeout retries, XML successful response is parsed',async()=>{
 let calls=0;const result=await regionalRequest('fixture',{pause:async()=>{},fetchImpl:async()=>response(++calls===1?'<OpenAPI_ServiceResponse><cmmMsgHeader><returnReasonCode>05</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>':'<response><header><resultCode>00</resultCode></header><body><items/></body></response>')});
 assert.equal(calls,2);assert.equal(result.response.header.resultCode,0);
});
test('only recent confirmed snapshots allow temporary deferral; recovery clears it',()=>{
 const now=Date.parse('2026-10-15T12:00:00Z'),failed=[{name:'경주',success:false,transient:true}];
 assert.equal(regionalRefreshStatus(failed,{'경주':{checkedAt:'2026-10-13T12:00:00Z'}},now),'deferred');
 for(const checkedAt of [undefined,'invalid','2026-10-12T12:00:00Z','2026-10-16T12:00:00Z']) assert.equal(regionalRefreshStatus(failed,{'경주':{checkedAt}},now),'failure');
 assert.equal(regionalRefreshStatus([{...failed[0],transient:false}],{'경주':{checkedAt:'2026-10-15T11:00:00Z'}},now),'failure');
 assert.equal(regionalRefreshStatus([{name:'경주',success:true}],{},now),'success');
});
test('Ulsan rfcOpenApi success envelope is accepted',async()=>{
 const result=await regionalRequest('fixture',{fetchImpl:async()=>response('<rfcOpenApi><header><resultCode>0</resultCode></header><body><totalCount>0</totalCount><data/></body></rfcOpenApi>')});
 assert.equal(result.rfcOpenApi.body.totalCount,0);
});
