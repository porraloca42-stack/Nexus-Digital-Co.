import {test} from 'node:test';
import assert from 'node:assert/strict';
import {issueTicket,verifyTicket,dispatchMeasurement} from '../src/measurement.mjs';
const env={META_CAPI_ENABLED:'true',META_CAPI_TOKEN:'fake',ADMIN_TOKEN:'mock-secret-for-unit-tests-only'};
test('ticket assinado, validade, origem e proteção contra alteração',async()=>{
 const t=await issueTicket('/',env,1795620000);
 const p=await verifyTicket(t,env,1795620000);
 assert.ok(p.id);assert.equal(p.sourceUrl,'https://ofertismo.com.br/');
 assert.equal(await verifyTicket(t.replace('.home.','.inicio.'),env,1795620000),null);
 assert.equal(await verifyTicket(t,env,1795623601),null);
 assert.equal(await verifyTicket(t,{...env,ADMIN_TOKEN:'different-secret-for-unit-tests'},1795620000),null);
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
