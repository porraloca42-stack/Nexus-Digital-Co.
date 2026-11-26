import {test} from 'node:test';
import assert from 'node:assert/strict';
import {traffic,trafficFromUrl,countStage,consentState,eligibleRequest,readSmallJson,recordStage} from '../src/operational.mjs';
test('only known dimensions are persisted, query data not copied',()=>{
 assert.deepEqual(trafficFromUrl('https://ofertismo.com.br/?origem=meta&utm_campaign=oft_t03&utm_content=imagem_01&fbclid=private'),{source:'meta',campaign:'oft_t03',creative:'imagem_01'});
 assert.deepEqual(traffic('private@example.com','anything','personal'),{source:'outro',campaign:'',creative:''});
 assert.deepEqual(traffic('meta','__proto__','x'),{source:'meta',campaign:'',creative:''});
});
test('bounded daily aggregate and rollover; no visitor ID',()=>{
 const d=new Date('2026-11-26T15:00:00Z');
 const a=countStage({'2026-01-01':{old:3}},'landing_request',{source:'meta',campaign:'oft_t03',creative:'imagem_01',ip:'private'},d);
 const b=countStage(a,'landing_request',{source:'meta',campaign:'oft_t03',creative:'imagem_01'},d);
 assert.deepEqual(b,{'2026-11-26':{'meta|oft_t03|imagem_01|landing_request':2}});
 assert.equal(countStage(b,'arbitrary',{},d),b);
});
test('consent categories and known automated traffic',()=>{
 const r=(cookie='',extra={})=>new Request('https://ofertismo.com.br/',{headers:{'user-agent':'Mozilla/5.0',cookie,...extra}});
 assert.equal(consentState(r('oft_measure=yes')),'yes');
 assert.equal(consentState(r('oft_measure=no')),'no');
 assert.equal(consentState(r()),'unset');
 assert.equal(eligibleRequest(r('',{'sec-purpose':'prefetch'})),false);
 assert.equal(eligibleRequest(r('',{'user-agent':'facebookexternalhit'})),false);
 assert.equal(eligibleRequest(r()),true);
});
test('bounded JSON; preview cannot write to production stats',async()=>{
 assert.equal(await readSmallJson(new Request('https://ofertismo.com.br/',{method:'POST',body:'x'.repeat(3000)})),null);
 assert.deepEqual(await readSmallJson(new Request('https://ofertismo.com.br/',{method:'POST',body:'{"choice":"yes"}'})),{choice:'yes'});
 const env={ROUTER_STATE:{get(){throw Error('must not write')}}};
 await recordStage(env,new Request('https://preview.example/',{headers:{'user-agent':'Mozilla/5.0'}}),'landing_request',{source:'meta'});
});
