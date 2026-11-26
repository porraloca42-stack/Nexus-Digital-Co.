import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {landingHtml} from '../src/landing-v3.mjs';
import {issueTicket,dispatchMeasurement} from '../src/measurement.mjs';
const env={META_CAPI_ENABLED:'true',META_CAPI_TOKEN:'mock-token',META_MEASUREMENT_SIGNING_KEY:'mock-independent-signing-key-for-testing'};
function browser(ticket,initialCookie=''){
 let cookie=initialCookie,requests=[],scripts=[];
 function element(){return {hidden:false,href:'',style:{},attrs:{},listeners:{},classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},addEventListener(k,f){(this.listeners[k]??=[]).push(f)},querySelectorAll(){return []},getBoundingClientRect(){return {bottom:50}},before(){},appendChild(){},scrollIntoView(){}}}
 const buttons=[element(),element()];buttons[0].attrs['data-choice']='yes';buttons[1].attrs['data-choice']='no';
 const ctas=Array.from({length:4},element),elements=new Map(),footer=element();
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},querySelectorAll(s){return s==='.join-cta'?ctas:[]},querySelector(){return footer},createElement(tag){const e=element();if(tag==='section')e.querySelectorAll=()=>buttons;if(tag==='script')scripts.push(e);return e},getElementsByTagName(){return [{parentNode:{insertBefore(){}}}]},addEventListener(){},get cookie(){return cookie},set cookie(v){cookie=v.split(';')[0]}};
 const context={document,location:new URL('https://ofertismo.com.br/?origem=meta&utm_campaign=oft_t03&utm_content=video_01'),URL,URLSearchParams,Array,fetch:(path,init)=>{requests.push({path,init});return Promise.resolve({})},matchMedia:()=>({matches:false}),addEventListener(){}};
 context.window=context;vm.createContext(context);
 const script=landingHtml.slice(landingHtml.lastIndexOf('<script>')+8,landingHtml.lastIndexOf('</script>')).replace('__OFT_MEASUREMENT_TICKET__',JSON.stringify(ticket));
 vm.runInContext(script,context);
 return {context,buttons,ctas,requests,scripts,click(i=0){for(const f of ctas[i].listeners.click??[])f()}};
}
test('real landing script and server payload share PageView/Lead IDs without external requests',async()=>{
 const ticket=await issueTicket('/',env),b=browser(ticket);
 assert.equal(b.context.fbq,undefined);assert.equal(b.requests.length,0);
 b.buttons[0].onclick();
 const queue=()=>JSON.parse(JSON.stringify(b.context.fbq.queue));
 assert.equal(b.scripts.length,1);
 assert.equal(queue().filter(x=>x[0]==='init')[0][1],'29104010142601422');
 b.click();b.click(1);
 const tracked=queue().filter(x=>x[0]==='track');
 assert.deepEqual(tracked.map(x=>x[1]),['PageView','Lead']);
 assert.equal(b.requests.length,1);assert.equal(b.requests[0].init.body,ticket);
 const target=new URL(b.ctas[0].href,'https://ofertismo.com.br');
 assert.equal(target.searchParams.get('utm_content'),'video_01');
 assert.equal(target.searchParams.get('measurement_ticket'),ticket);
 const claims=new Set(),payloads=[];
 const e={...env,ROUTER_STATE:{idFromName:k=>k,get:()=>({fetch:async(_,init)=>{const n=JSON.parse(init.body).name;if(claims.has(n))return new Response(null,{status:409});claims.add(n);return new Response('{}')}})}};
 const headers={origin:'https://ofertismo.com.br',referer:b.context.location.href,cookie:'oft_measure=yes; _fbp=fb.1.1795620000000.123456','user-agent':'Mozilla/5.0','cf-connecting-ip':'192.0.2.1'};
 const fake=async(_,init)=>{payloads.push(JSON.parse(init.body).data[0]);return new Response('{"events_received":1}')};
 assert.equal((await dispatchMeasurement(new Request('https://ofertismo.com.br/api/measurement/pageview',{method:'POST',headers}),e,ticket,'PageView',fake)).sent,true);
 assert.equal((await dispatchMeasurement(new Request(target,{headers}),e,ticket,'Lead',fake)).sent,true);
 assert.deepEqual(payloads.map(x=>[x.event_name,x.event_id]),tracked.map(x=>[x[1],x[3].eventID]));
 b.buttons[1].onclick();assert.ok(b.ctas.every(x=>!x.href.includes('measurement_ticket')));
});
test('disabled or refused measurement leaves group CTA available without loading any pixel',()=>{
 const disabled=browser('');assert.equal(disabled.context.fbq,undefined);assert.equal(disabled.requests.length,0);assert.equal(disabled.scripts.length,0);assert.match(disabled.ctas[0].href,/entrar\/meta/);
 const refused=browser('test-ticket','oft_measure=no');refused.click();assert.equal(refused.context.fbq,undefined);assert.equal(refused.requests.length,0);assert.ok(!refused.ctas[0].href.includes('measurement_ticket'));
});
