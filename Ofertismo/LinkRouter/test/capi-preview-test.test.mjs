import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCapiPreviewTest,CAPI_PREVIEW_PATH} from '../src/capi-preview-test.mjs';
const host='https://ofertismo-capi-foundation-20261125-ofertismo-link-router.porraloca42.workers.dev';
const id='a3abf021-9975-4f8a-8722-3f5c5949bd10';
const auth='a'.repeat(48),token='b'.repeat(48);
function setup(){
  const names=[],calls=[];
  const env={META_CAPI_PREVIEW_ENABLED:'true',META_CAPI_PREVIEW_AUTH:auth,META_CAPI_PREVIEW_TOKEN:token,META_CAPI_PREVIEW_TEST_EVENT_CODE:'TEST123',ADMIN_TOKEN:'c'.repeat(48),ROUTER_STATE:{idFromName(n){names.push(n);return n},get(){return {fetch:async()=>new Response('{}',{status:200})}}}};
  const fake=async(url,init)=>{calls.push({url,body:JSON.parse(init.body),auth:init.headers.authorization});return new Response(JSON.stringify({events_received:1,secret:'do-not-return'}),{status:200})};
  return {env,fake,names,calls};
}
function req({url=host+CAPI_PREVIEW_PATH,authorization='Bearer '+auth,method='POST',data={consent:true,event_name:'Lead',test_id:id}}={}){
 return new Request(url,{method,headers:{authorization,'content-type':'application/json','user-agent':'Ofertismo test runner'},...(method==='POST'?{body:JSON.stringify(data)}:{})});
}
test('preview harness fails closed on production, missing test code, and no auth',async()=>{
 const {env,fake,calls}=setup();
 assert.equal((await handleCapiPreviewTest(req({url:'https://ofertismo.com.br'+CAPI_PREVIEW_PATH}),env,fake)).status,404);
 assert.equal((await handleCapiPreviewTest(req(),{...env,META_CAPI_PREVIEW_TEST_EVENT_CODE:''},fake)).status,404);
 assert.equal((await handleCapiPreviewTest(req({authorization:'Bearer wrong'}),env,fake)).status,401);
 assert.equal((await handleCapiPreviewTest(req({method:'GET'}),env,fake)).status,405);
 assert.equal(calls.length,0);
});
test('refuses missing consent, nonallowed event, and duplicate',async()=>{
 const {env,fake,calls}=setup();
 assert.equal((await handleCapiPreviewTest(req({data:{consent:false,event_name:'Lead',test_id:id}}),env,fake)).status,400);
 assert.equal((await handleCapiPreviewTest(req({data:{consent:true,event_name:'Purchase',test_id:id}}),env,fake)).status,400);
 env.ROUTER_STATE.get=()=>({fetch:async()=>new Response('{}',{status:409})});
 assert.equal((await handleCapiPreviewTest(req(),env,fake)).status,409);
 assert.equal(calls.length,0);
});
test('only new dataset, explicit test code, matching ID, isolated claim, minimal data',async()=>{
 const {env,fake,calls,names}=setup();
 const response=await handleCapiPreviewTest(req(),env,fake);
 assert.equal(response.status,200);
 const result=await response.json();
 assert.deepEqual(result,{ok:true,test:true,dataset:'29104010142601422',event_id:id+'_Lead',events_received:1,graph_status:200});
 assert.deepEqual(names,['capi-preview:'+id]);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://graph.facebook.com/v25.0/29104010142601422/events');
 assert.equal(calls[0].body.test_event_code,'TEST123');
 assert.equal(calls[0].body.data[0].event_id,id+'_Lead');
 assert.deepEqual(calls[0].body.data[0].user_data,{client_user_agent:'Ofertismo test runner'});
 assert.equal(calls[0].body.data[0].event_source_url,host+CAPI_PREVIEW_PATH);
 assert.equal(calls[0].auth,'Bearer '+token);
});
test('transport errors redact Graph content',async()=>{
 const {env}=setup();
 const response=await handleCapiPreviewTest(req(),env,async()=>new Response(JSON.stringify({error:{message:'private detail',code:100,error_subcode:2804005}}),{status:400}));
 assert.equal(response.status,502);
 const result=await response.json();
 assert.equal(result.graph_status,400);
 assert.equal(result.graph_error_code,100);
 assert.equal(result.graph_error_subcode,2804005);
 assert.ok(!JSON.stringify(result).includes('private detail'));
});
