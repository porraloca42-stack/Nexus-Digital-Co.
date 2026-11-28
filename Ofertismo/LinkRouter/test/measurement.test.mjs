import {test} from 'node:test';
import assert from 'node:assert/strict';
import {issueTicket,verifyTicket,dispatchMeasurement,observeMeasurement} from '../src/measurement.mjs';
const env={META_CAPI_ENABLED:'true',META_CAPI_TOKEN:'fake',META_MEASUREMENT_SIGNING_KEY:'mock-signing-key-for-unit-tests-only'};

test('fb.2 é preservado no payload e na telemetria sem alterar o ID de deduplicação',async()=>{
 const t=await issueTicket('/',env),page=await verifyTicket(t,env);
 const fbp='fb.2.1795620000000.726999265572739778',fbc='fb.2.1795620000000.REAL_COOKIE';
 const e={...env,ROUTER_STATE:{idFromName:s=>s,get:()=>({fetch:async()=>new Response('{}')})}};
 for(const name of ['PageView','Lead']){
  let event;
  const request=new Request('https://ofertismo.com.br/entrar/meta',{method:'POST',headers:{origin:'https://ofertismo.com.br',referer:'https://ofertismo.com.br/',cookie:`oft_measure=yes; _fbp=${fbp}; _fbc=${fbc}`,'user-agent':'Mozilla/5.0'}});
  const result=await dispatchMeasurement(request,e,t,name,async(_,init)=>{event=JSON.parse(init.body).data[0];return new Response('{"events_received":1}')});
  assert.equal(result.sent,true);assert.equal(result.match_fbp,true);assert.equal(result.match_fbc,true);
  assert.equal(event.user_data.fbp,fbp);assert.equal(event.user_data.fbc,fbc);
  assert.equal(event.event_id,page.id+'_'+name);
 }
});
test('ticket assinado, validade, origem e proteção contra alteração',async()=>{
 const t=await issueTicket('/',env,1795620000);
 const p=await verifyTicket(t,env,1795620000);
 assert.ok(p.id);assert.equal(p.sourceUrl,'https://ofertismo.com.br/');
 assert.equal(await verifyTicket(t.replace('.home.','.inicio.'),env,1795620000),null);
 assert.equal(await verifyTicket(t,env,1795623601),null);
 assert.equal(await verifyTicket(t,{...env,META_MEASUREMENT_SIGNING_KEY:'different-signing-key-for-unit-tests'},1795620000),null);
 assert.equal(await issueTicket('/admin',env),'');
});
test('sem consentimento, domínio incorreto e Lead sem referer não consultam storage',async()=>{
 const t=await issueTicket('/',env);
 const noStorage={...env,ROUTER_STATE:{get(){throw Error('must not reach storage')}}};
 for(const [url,headers,name] of [
 ['https://ofertismo.com.br/api/measurement/pageview',{origin:'https://ofertismo.com.br'},'PageView'],
 ['https://preview.example/api/measurement/pageview',{cookie:'oft_measure=yes'},'PageView'],
 ['https://ofertismo.com.br/entrar/meta',{cookie:'oft_measure=yes'},'Lead'],
 ['https://ofertismo.com.br/api/measurement/pageview',{cookie:'oft_measure=yes',origin:'https://other.example'},'PageView']]){
  const r=await dispatchMeasurement(new Request(url,{headers}),noStorage,t,name);assert.equal(r.sent,false);
 }
});
test('ticket inválido ou evento repetido não chama Meta',async()=>{
 const t=await issueTicket('/',env);
 const r=new Request('https://ofertismo.com.br/api/measurement/pageview',{headers:{origin:'https://ofertismo.com.br',cookie:'oft_measure=yes','user-agent':'Mozilla/5.0'}});
 const e={...env,ROUTER_STATE:{idFromName:s=>s,get:()=>({fetch:async()=>new Response(null,{status:409})})}};
 assert.equal((await dispatchMeasurement(r,e,t,'PageView')).reason,'duplicate_or_unavailable');
 assert.equal((await dispatchMeasurement(r,e,t+'x','PageView')).reason,'ticket');
});

test('fluxo integrado: IDs pareados, consentimento, claim separado e dados reais do request',async()=>{
 const t=await issueTicket('/',env);
 const page=await verifyTicket(t,env);
 const claims=new Set(),calls=[];
 const e={...env,META_CAPI_TEST_EVENT_CODE:'TEST123',ROUTER_STATE:{
  idFromName:s=>s,get:key=>({fetch:async(url,init)=>{
   assert.equal(key,'measurement:'+page.id);
   const k=key+':'+JSON.parse(init.body).name;
   if(claims.has(k))return new Response(null,{status:409});
   claims.add(k);return new Response('{}',{status:200});
  }})
 }};
 const fake=async(url,init)=>{
  assert.equal(url,'https://graph.facebook.com/v25.0/29104010142601422/events');
  calls.push(JSON.parse(init.body));return new Response('{"events_received":1}',{status:200});
 };
 const headers={origin:'https://ofertismo.com.br',referer:'https://ofertismo.com.br/?fbclid=TEST_CLICK_VALUE&utm_content=video_01',cookie:'oft_measure=yes; _fbp=fb.1.1795620000000.123456','user-agent':'Mozilla/5.0','cf-connecting-ip':'192.0.2.1'};
 const pv=new Request('https://ofertismo.com.br/api/measurement/pageview',{method:'POST',headers});
 const lead=new Request('https://ofertismo.com.br/entrar/meta',{headers});
 assert.equal((await dispatchMeasurement(pv,e,t,'PageView',fake)).sent,true);
 assert.equal((await dispatchMeasurement(lead,e,t,'Lead',fake)).sent,true);
 assert.equal((await dispatchMeasurement(lead,e,t,'Lead',fake)).reason,'duplicate_or_unavailable');
 const revoked=new Request(lead.url,{headers:{...headers,cookie:'oft_measure=no'}});
 assert.equal((await dispatchMeasurement(revoked,e,t,'Lead',fake)).reason,'no_consent_or_origin');
 assert.equal(calls.length,2);
 for(const [i,name] of ['PageView','Lead'].entries()){
  const payload=calls[i],event=payload.data[0];
  assert.equal(payload.test_event_code,'TEST123');
  assert.equal(event.event_id,page.id+'_'+name);
  assert.equal(event.event_name,name);
  assert.equal(event.event_source_url,'https://ofertismo.com.br/');
  assert.equal(event.user_data.fbp,'fb.1.1795620000000.123456');
  assert.equal(event.user_data.fbc,'fb.1.'+(page.issuedAt*1000)+'.TEST_CLICK_VALUE');
  assert.equal(event.user_data.client_ip_address,'192.0.2.1');
 }
});
test('falha no transporte permite uma tentativa curta e bloqueia novo claim',async()=>{
 const t=await issueTicket('/',env);let count=0,claimed=false;
 const e={...env,ROUTER_STATE:{idFromName:s=>s,get:()=>({fetch:async()=>{if(claimed)return new Response(null,{status:409});claimed=true;return new Response('{}',{status:200})}})}};
 const pv=new Request('https://ofertismo.com.br/api/measurement/pageview',{method:'POST',headers:{origin:'https://ofertismo.com.br',cookie:'oft_measure=yes','user-agent':'Mozilla/5.0'}});
 const fake=async()=>{count++;throw Error('simulated network failure')};
 assert.equal((await dispatchMeasurement(pv,e,t,'PageView',fake)).reason,'transport_error');
 assert.equal((await dispatchMeasurement(pv,e,t,'PageView',fake)).reason,'duplicate_or_unavailable');
 assert.equal(count,2);
});

test('observability is redacted and omits unconsented requests',async()=>{
 const logs=[],logger={info:s=>logs.push(JSON.parse(s)),warn:s=>logs.push(JSON.parse(s))};
 await observeMeasurement(async()=>({sent:false,reason:'no_consent_or_origin',private:'do not log'}),'Lead',logger);
 assert.equal(logs.length,0);
 await observeMeasurement(async()=>({sent:false,status:400,reason:'graph_rejected',graph_error_code:100,private:'do not log'}),'Lead',logger);
 await observeMeasurement(async()=>({sent:true,status:200,ip:'do not log'}),'PageView',logger);
 await observeMeasurement(async()=>{throw Error('private exception')},'Lead',logger);
 assert.deepEqual(logs,[{component:'oft_capi',event:'Lead',outcome:'not_sent',reason:'graph_rejected',http_status:400,graph_error_code:100},{component:'oft_capi',event:'PageView',outcome:'accepted',http_status:200},{component:'oft_capi',event:'Lead',outcome:'not_sent',reason:'internal_error'}]);
});

test('production requires independent signing key; no fallback to admin token',async()=>{
 assert.equal(await issueTicket('/',{...env,META_MEASUREMENT_SIGNING_KEY:undefined,ADMIN_TOKEN:'mock-admin-key-long-enough-for-testing'}),'');
 assert.equal(await issueTicket('/',{...env,ADMIN_TOKEN:env.META_MEASUREMENT_SIGNING_KEY}),'');
 assert.equal(await issueTicket('/',{...env,META_CAPI_ENABLED:'false'}),'');
});

test('consented PageView recovers real click from header even without referer',async()=>{
 const t=await issueTicket('/',env);const page=await verifyTicket(t,env);let payload;
 const e={...env,ROUTER_STATE:{idFromName:s=>s,get:()=>({fetch:async()=>new Response('{}')})}};
 const headers={origin:'https://ofertismo.com.br',cookie:'oft_measure=yes','user-agent':'Mozilla/5.0','x-oft-fbclid':'REAL_CLICK_FIXTURE'};
 const req=new Request('https://ofertismo.com.br/api/measurement/pageview',{method:'POST',headers});
 const fake=async(_,init)=>{payload=JSON.parse(init.body);return new Response('{"events_received":1}')};
 assert.equal((await dispatchMeasurement(req,e,t,'PageView',fake)).sent,true);assert.equal(payload.data[0].user_data.fbc,'fb.1.'+(page.issuedAt*1000)+'.REAL_CLICK_FIXTURE');
});

test('Lead without Referer accepts only verified same-origin document navigation and signed ticket',async()=>{
 const t=await issueTicket('/',env);let calls=0;
 const e={...env,ROUTER_STATE:{idFromName:s=>s,get:()=>({fetch:async()=>new Response('{}')})}};
 const headers={'sec-fetch-site':'same-origin','sec-fetch-mode':'navigate','sec-fetch-dest':'document',cookie:'oft_measure=yes','user-agent':'Mozilla/5.0'};
 const fake=async()=>{calls++;return new Response('{"events_received":1}')};
 for(const h of [{...headers,'sec-fetch-site':'cross-site'},{...headers,referer:'https://evil.example/'},{...headers,'sec-fetch-mode':'cors'}])assert.equal((await dispatchMeasurement(new Request('https://ofertismo.com.br/entrar/meta',{headers:h}),e,t,'Lead',fake)).sent,false);
 assert.equal((await dispatchMeasurement(new Request('https://ofertismo.com.br/entrar/meta',{headers}),e,t,'Lead',fake)).sent,true);assert.equal(calls,1);
});
