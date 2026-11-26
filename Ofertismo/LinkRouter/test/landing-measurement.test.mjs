import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {landingHtml} from '../src/landing-v3.mjs';
import {issueTicket,dispatchMeasurement} from '../src/measurement.mjs';
const env={META_CAPI_ENABLED:'true',META_CAPI_TOKEN:'mock-token',META_MEASUREMENT_SIGNING_KEY:'mock-independent-signing-key-for-testing'};
function browser(ticket,initialCookie='',mobile=false){
 let cookie=initialCookie,requests=[],choices=[],joins=[],navigations=[],scripts=[],timers=new Map(),timerId=0,events={},notice,joinResponse;
 function element(){return {hidden:false,href:'',style:{},attrs:{},listeners:{},classList:{active:false,toggle(k,v){this[k]=v}},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},addEventListener(k,f){(this.listeners[k]??=[]).push(f)},querySelectorAll(){return []},getBoundingClientRect(){return this.rect||{bottom:50,height:0}},before(){},appendChild(){},scrollIntoView(){}}}
 const buttons=[element(),element()];buttons[0].attrs['data-choice']='yes';buttons[1].attrs['data-choice']='no';
 const ctas=Array.from({length:4},element),elements=new Map(),footer=element();
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},querySelectorAll(s){return s==='.join-cta'?ctas:[]},querySelector(){return footer},createElement(tag){const e=element();if(tag==='section'){notice=e;e.rect={height:120,bottom:600};e.querySelectorAll=()=>buttons;}if(tag==='script')scripts.push(e);return e},getElementsByTagName(){return [{parentNode:{insertBefore(){}}}]},addEventListener(){},get cookie(){return cookie},set cookie(v){const pair=v.split(';')[0],key=pair.split('=')[0];cookie=cookie.split(';').map(s=>s.trim()).filter(s=>s&&!s.startsWith(key+'=')).concat(pair).join('; ')}};
 const location=new URL('https://ofertismo.com.br/?origem=meta&utm_campaign=oft_t03&utm_content=video_01');location.assign=x=>navigations.push(x);
 const context={document,location,crypto:{randomUUID:()=> '12345678-1234-4abc-8abc-123456789abc'},URL,URLSearchParams,Array,fetch:(path,init)=>{if(path.startsWith('/entrar/')){joins.push({path,init});if(joinResponse)return joinResponse();const data=JSON.parse(init.body);return Promise.resolve({status:200,json:async()=>({ok:true,url:'https://chat.whatsapp.com/fixture',leadEventID:data.ticket?data.ticket.split('.')[0]+'_Lead':null})});}(path==='/api/operational/choice'?choices:requests).push({path,init});return Promise.resolve({})},innerHeight:600,matchMedia:()=>({matches:mobile}),addEventListener(k,f){(events[k]??=[]).push(f)},setTimeout(f){timers.set(++timerId,f);return timerId},clearTimeout(id){timers.delete(id)}};
 context.window=context;vm.createContext(context);
 const script=landingHtml.slice(landingHtml.lastIndexOf('<script>')+8,landingHtml.lastIndexOf('</script>')).replace('__OFT_MEASUREMENT_TICKET__',JSON.stringify(ticket));
 vm.runInContext(script,context);
 return {context,buttons,ctas,requests,choices,joins,navigations,setJoinResponse(fn){joinResponse=fn},scripts,timers,notice,footer,elements,runTimer(){const e=timers.entries().next();if(!e.done){timers.delete(e.value[0]);e.value[1]()}},fire(k){for(const f of events[k]??[])f()},async click(i=0){for(const f of ctas[i].listeners.click??[])await f({button:0,preventDefault(){}})}};
}
test('real landing script and server payload share PageView/Lead IDs without external requests',async()=>{
 const ticket=await issueTicket('/',env),b=browser(ticket);
 assert.equal(b.context.fbq,undefined);assert.equal(b.requests.length,0);
 b.buttons[0].onclick();
 assert.equal(b.requests.length,0);
 const queue=()=>JSON.parse(JSON.stringify(b.context.fbq.queue));
 assert.equal(b.scripts.length,1);
 assert.equal(queue().filter(x=>x[0]==='init')[0][1],'29104010142601422');
 const pending=b.click();const duplicate=b.click(1);await Promise.all([pending,duplicate]);assert.equal(b.joins.length,1);assert.equal(b.navigations[0],'https://chat.whatsapp.com/fixture');
 const tracked=queue().filter(x=>x[0]==='track');
 assert.deepEqual(tracked.map(x=>x[1]),['PageView','Lead']);
 assert.equal(b.requests.length,1);assert.equal(b.requests[0].init.body,ticket);
 const target=new URL(b.joins[0].path,'https://ofertismo.com.br');
 assert.equal(target.searchParams.get('utm_content'),'video_01');
 assert.equal(JSON.parse(b.joins[0].init.body).ticket,ticket);
 const claims=new Set(),payloads=[];
 const e={...env,ROUTER_STATE:{idFromName:k=>k,get:()=>({fetch:async(_,init)=>{const n=JSON.parse(init.body).name;if(claims.has(n))return new Response(null,{status:409});claims.add(n);return new Response('{}')}})}};
 const headers={origin:'https://ofertismo.com.br',referer:b.context.location.href,cookie:'oft_measure=yes; _fbp=fb.1.1795620000000.123456','user-agent':'Mozilla/5.0','cf-connecting-ip':'192.0.2.1'};
 const fake=async(_,init)=>{payloads.push(JSON.parse(init.body).data[0]);return new Response('{"events_received":1}')};
 assert.equal((await dispatchMeasurement(new Request('https://ofertismo.com.br/api/measurement/pageview',{method:'POST',headers}),e,ticket,'PageView',fake)).sent,true);
 assert.equal((await dispatchMeasurement(new Request(target,{method:'POST',headers}),e,ticket,'Lead',fake)).sent,true);
 assert.deepEqual(payloads.map(x=>[x.event_name,x.event_id]),tracked.map(x=>[x[1],x[3].eventID]));
 b.buttons[1].onclick();assert.ok(b.ctas.every(x=>!x.href.includes('measurement_ticket')));
});
test('disabled or refused measurement leaves group CTA available without loading any pixel',async()=>{
 const disabled=browser('');assert.equal(disabled.context.fbq,undefined);assert.equal(disabled.requests.length,0);assert.equal(disabled.scripts.length,0);assert.match(disabled.ctas[0].href,/entrar\/meta/);
 const refused=browser('test-ticket','oft_measure=no');await refused.click();assert.equal(refused.joins.length,1);assert.equal(JSON.parse(refused.joins[0].init.body).ticket,undefined);assert.equal(refused.context.fbq,undefined);assert.equal(refused.requests.length,0);assert.ok(!refused.ctas[0].href.includes('measurement_ticket'));
});

test('PageView waits for real browser cookie, flushes once and preserves consent',async()=>{
 const b=browser('test-ticket','oft_measure=yes');
 assert.equal(b.requests.length,0);assert.equal(b.timers.size,1);
 b.context.document.cookie='_fbp=fb.1.1795620000000.123456';
 b.runTimer();assert.equal(b.requests.length,1);assert.equal(b.timers.size,0);
 await b.click();b.fire('pagehide');assert.equal(b.requests.length,1);
});
test('existing valid FBP sends immediately; absent or malformed cookie uses bounded fallback',()=>{
 const ready=browser('test-ticket','oft_measure=yes; _fbp=fb.1.1795620000000.123456');
 assert.equal(ready.requests.length,1);assert.equal(ready.timers.size,0);
 const missing=browser('test-ticket','oft_measure=yes; _fbp=invalid');
 for(let i=0;i<11;i++)missing.runTimer();
 assert.equal(missing.requests.length,0);missing.runTimer();
 assert.equal(missing.requests.length,1);assert.equal(missing.timers.size,0);
});
test('revocation cancels pending measurement; regrant resumes without duplicate browser event',async()=>{
 const b=browser('test-ticket','oft_measure=yes');
 b.buttons[1].onclick();b.runTimer();b.fire('pagehide');await b.click();
 assert.equal(b.requests.length,0);assert.equal(b.timers.size,0);
 b.buttons[0].onclick();b.context.document.cookie='_fbp=fb.1.1795620000000.123456';b.runTimer();
 assert.equal(b.requests.length,1);
 assert.equal(b.context.fbq.queue.filter(x=>x[0]==='track'&&x[1]==='PageView').length,1);
});
test('immediate exit flushes one pending PageView without waiting for FBP',()=>{
 const b=browser('test-ticket','oft_measure=yes');
 b.fire('pagehide');b.fire('pagehide');b.runTimer();
 assert.equal(b.requests.length,1);assert.equal(b.timers.size,0);
});

test('fixed cookie notice reserves room, keeps group CTA usable and restores sticky position after choice',async()=>{
 const b=browser('test-ticket','',true);
 const sticky=b.elements.get('sticky'),hero=b.elements.get('v3-art-cta');
 assert.equal(b.notice.hidden,false);
 assert.match(b.notice.style.cssText,/position:fixed;bottom:0/);
 assert.equal(sticky.style.bottom,'120px');assert.equal(b.footer.style.marginBottom,'120px');
 hero.rect={bottom:590};b.fire('scroll');assert.equal(sticky.classList.active,true);
 await b.click();assert.equal(b.context.fbq,undefined);assert.equal(b.requests.length,0);
 assert.match(b.ctas[0].href,/entrar\/meta/);
 b.buttons[1].onclick();assert.equal(b.notice.hidden,true);
 assert.equal(sticky.style.bottom,'0px');assert.equal(b.footer.style.marginBottom,'0px');
 assert.equal(sticky.classList.active,false);
 const returned=browser('test-ticket','oft_measure=no',true);
 assert.equal(returned.notice.hidden,true);
 assert.equal(returned.elements.get('sticky').style.bottom,'0px');
});

test('explicit choices are counted separately with no cookies or identifiers, even when ticket is absent',()=>{
 const b=browser('');b.buttons[1].onclick();assert.equal(b.requests.length,0);assert.equal(b.choices.length,1);assert.equal(b.choices[0].init.credentials,'omit');assert.deepEqual(JSON.parse(b.choices[0].init.body),{choice:'no',source:'meta',campaign:'oft_t03',creative:'video_01'});assert.equal(b.context.fbq,undefined);
});

test('browser Lead waits for invitation and skips on server refusal',async()=>{
 const b=browser('test-ticket','oft_measure=yes; _fbp=fb.1.1795620000000.123456');let resolve;
 b.setJoinResponse(()=>new Promise(r=>{resolve=r}));const pending=b.click();
 assert.equal(b.context.fbq.queue.filter(x=>x[0]==='track'&&x[1]==='Lead').length,0);
 resolve({status:503,json:async()=>({ok:false,error:'unavailable'})});await pending;
 assert.equal(b.navigations.length,0);assert.equal(b.context.fbq.queue.filter(x=>x[0]==='track'&&x[1]==='Lead').length,0);
});
test('network fallback carries same operation and never pre-emits browser Lead',async()=>{
 const b=browser('test-ticket','oft_measure=yes; _fbp=fb.1.1795620000000.123456');
 b.setJoinResponse(()=>Promise.reject(Error('network')));await b.click();
 const u=new URL(b.navigations[0],b.context.location.origin);
 assert.equal(u.searchParams.get('operation'),JSON.parse(b.joins[0].init.body).operation);
 assert.equal(u.searchParams.get('measurement_ticket'),'test-ticket');
 assert.equal(b.context.fbq.queue.filter(x=>x[0]==='track'&&x[1]==='Lead').length,0);
});
test('revocation during reservation suppresses browser Lead',async()=>{
 const b=browser('test-ticket','oft_measure=yes; _fbp=fb.1.1795620000000.123456');let resolve;
 b.setJoinResponse(()=>new Promise(r=>{resolve=r}));const pending=b.click();b.buttons[1].onclick();
 resolve({status:200,json:async()=>({ok:true,url:'https://chat.whatsapp.com/fixture',leadEventID:'test-ticket_Lead'})});await pending;
 assert.equal(b.navigations.length,1);assert.equal(b.context.fbq.queue.filter(x=>x[0]==='track'&&x[1]==='Lead').length,0);
});
