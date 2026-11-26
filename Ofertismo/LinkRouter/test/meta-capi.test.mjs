import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvent,sendCapi } from '../src/meta-capi.mjs';
const input={consent:true,name:'Lead',eventId:'test_event_1234567890',eventTime:1795620000,sourceUrl:'https://ofertismo.com.br/?email=example%40example.org',userAgent:'test-browser'};
test('não inventa evento ou envia sem consentimento',()=>{
 assert.equal(buildEvent({...input,consent:false}),null);
 assert.equal(buildEvent({...input,name:'Purchase'}),null);
 assert.equal(buildEvent({...input,sourceUrl:'https://outro.example/'}),null);
});
test('ID preservado e URL higienizada',()=>{
 const e=buildEvent(input);
 assert.equal(e.event_id,input.eventId);
 assert.equal(e.event_source_url,'https://ofertismo.com.br/');
 assert.deepEqual(e.user_data,{client_user_agent:'test-browser'});
});
test('desativada por padrão, sem acesso à rede',async()=>{
 const r=await sendCapi(input,{},()=>{throw Error('rede não deveria ser chamada')});
 assert.equal(r.reason,'disabled');
});
test('token no header, evento de teste e mesmo ID',async()=>{
 const r=await sendCapi(input,{META_CAPI_ENABLED:'true',META_CAPI_TOKEN:'fake-test-token',META_CAPI_TEST_EVENT_CODE:'TEST123'},async(url,req)=>{
  assert.ok(url.endsWith('/29104010142601422/events'));
  assert.equal(req.headers.authorization,'Bearer fake-test-token');
  const b=JSON.parse(req.body);
  assert.equal(b.test_event_code,'TEST123');
  assert.equal(b.data[0].event_id,input.eventId);
  return {ok:true,status:200,json:async()=>({events_received:1})};
 });
 assert.equal(r.sent,true);
});

test('Graph rejection returns only numeric diagnostics, not response message',async()=>{
 const r=await sendCapi(input,{META_CAPI_ENABLED:'true',META_CAPI_TOKEN:'fake'},async()=>new Response(JSON.stringify({error:{message:'private payload',code:100,error_subcode:2804005}}),{status:400}));
 assert.deepEqual(r,{sent:false,status:400,reason:'graph_rejected',graph_error_code:100,graph_error_subcode:2804005});
});
