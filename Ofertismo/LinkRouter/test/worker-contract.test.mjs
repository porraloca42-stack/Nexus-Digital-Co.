import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {issueTicket} from '../src/measurement.mjs';
// Run actual Worker and Durable Object source with a transactional in-memory storage.
// No Cloudflare bindings, no live Meta or WhatsApp requests.
const entry=new URL('../src/index.js',import.meta.url);
const code=(await readFile(entry,'utf8')).replace("import { DurableObject } from 'cloudflare:workers';","class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env}}").replace(/from '(\.\/[^']+)'/g,(_,path)=>"from '"+new URL(path,entry).href+"'");
const {default:worker,LinkRouterState}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function storage(){
 const rows=new Map();let tail=Promise.resolve();
 const tx={async get(k){return structuredClone(rows.get(k))},async put(k,v){rows.set(k,structuredClone(v))},async delete(k){for(const key of Array.isArray(k)?k:[k])rows.delete(key)},async list({prefix='',end,limit=Infinity}={}){return new Map([...rows.entries()].filter(([k])=>k.startsWith(prefix)&&(!end||k<end)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)]))},async setAlarm(){}};
 return {...tx,transaction(fn){const r=tail.then(()=>fn(tx));tail=r.catch(()=>{});return r}};
}
const origin='https://ofertismo.com.br',op='12345678-1234-4abc-8abc-123456789abc',ua='Mozilla/5.0';
function setup(){
 const objects=new Map(),waits=[];
 const env={ADMIN_TOKEN:'fixture-admin-token-not-real-123456',META_CAPI_ENABLED:'false',ROUTER_STATE:{idFromName:s=>s,get(id){if(!objects.has(id))objects.set(id,new LinkRouterState({storage:storage()},{}));return {fetch:(url,init)=>objects.get(id).fetch(new Request(url,init))}}}};
 const ctx={waitUntil(p){waits.push(p)}};
 async function call(path,init={}){const result=await worker.fetch(new Request(origin+path,{...init,headers:{'user-agent':ua,...init.headers}}),env,ctx);return result}
 async function flush(){await Promise.all(waits.splice(0))}
 async function configure(groups){return call('/api/admin/config',{method:'POST',headers:{authorization:'Bearer '+env.ADMIN_TOKEN,'content-type':'application/json'},body:JSON.stringify({limit:1,groups})})}
 async function stats(){await flush();return (await call('/api/admin/config',{headers:{authorization:'Bearer '+env.ADMIN_TOKEN}})).json()}
 return {env,ctx,call,flush,configure,stats,objects};
}
const groups=[{id:'g1',url:'https://chat.whatsapp.com/fixture1'},{id:'g2',url:'https://chat.whatsapp.com/fixture2'}];
test('worker reserves once under concurrent POST and GET fallback, counts consent categories separately',async()=>{
 const s=setup();assert.equal((await s.configure(groups)).status,200);
 const path='/entrar/meta?utm_campaign=oft_t03&utm_content=imagem_01';
 const init={method:'POST',headers:{origin,'content-type':'application/json',cookie:'oft_measure=no'},body:JSON.stringify({operation:op})};
 const [a,b]=await Promise.all([s.call(path,init),s.call(path+'&operation='+op,{headers:{cookie:'oft_measure=no'}})]);
 assert.equal(a.status,200);assert.equal((await a.json()).leadEventID,null);assert.equal(b.status,302);assert.equal(b.headers.get('location'),groups[0].url);
 const d=await s.stats();assert.equal(d.metrics.total,1);
 const row=Object.values(d.funnel)[0];assert.equal(row['meta|oft_t03|imagem_01|redirect_ok'],1);assert.equal(row['meta|oft_t03|imagem_01|redirect_no'],1);
});
test('landing and choice aggregate without marketing, strict POST origin, unavailable invite no Lead',async()=>{
 const s=setup();const landing=await s.call('/?origem=meta&utm_campaign=oft_t03&utm_content=imagem_01');
 assert.equal(landing.status,200);assert.match(await landing.text(),/href="\/entrar\/meta\?utm_campaign=oft_t03&amp;utm_content=imagem_01"/);
 const choice=await s.call('/api/operational/choice',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({choice:'no',source:'meta',campaign:'oft_t03',creative:'imagem_01'})});assert.equal(choice.status,204);
 const bad=await s.call('/entrar/meta',{method:'POST',headers:{origin:'https://else.example'},body:JSON.stringify({operation:op})});assert.equal(bad.status,403);
 const no=await s.call('/entrar/meta',{method:'POST',headers:{origin},body:JSON.stringify({operation:op})});assert.equal(no.status,503);
 const d=await s.stats();assert.equal(d.metrics.total,0);const row=Object.values(d.funnel)[0];assert.equal(row['meta|oft_t03|imagem_01|landing_request'],1);assert.equal(row['meta|oft_t03|imagem_01|consent_decline'],1);assert.equal(row['meta|-|-|redirect_unavailable'],1);
});
test('preview POST is isolated, never queries storage or sends to Meta',async()=>{
 const host='https://ofertismo-measurement-v4-20261126-ofertismo-link-router.porraloca42.workers.dev';
 const env={ROUTER_STATE:{get(){throw Error('must not access storage')}}},ctx={waitUntil(){throw Error('must not schedule')}};const ticket=op+'.preview';
 const r=await worker.fetch(new Request(host+'/entrar/meta',{method:'POST',headers:{origin:host,cookie:'oft_measure=yes'},body:JSON.stringify({operation:op,ticket})}),env,ctx);
 const data=await r.json();assert.equal(data.tracking,false);assert.equal(data.groupCounters,false);assert.equal(data.leadEventID,op+'_Lead');assert.equal(data.url,'/preview-redirect-done');
});
test('signed consented Lead uses same event ID after POST, never on failed redirect',async()=>{
 const s=setup();Object.assign(s.env,{META_CAPI_ENABLED:'true',META_CAPI_TOKEN:'fixture-token',META_MEASUREMENT_SIGNING_KEY:'fixture-signing-key-for-unit-tests-only'});
 const ticket=await issueTicket('/',s.env);const original=globalThis.fetch,payloads=[];
 globalThis.fetch=async(url,init)=>{assert.match(String(url),/^https:\/\/graph\.facebook\.com\//);payloads.push(JSON.parse(init.body));return new Response('{"events_received":1}')};
 try{
  const init={method:'POST',headers:{origin,cookie:'oft_measure=yes','x-oft-fbclid':'CLICK_FIXTURE','content-type':'application/json'},body:JSON.stringify({operation:op,ticket})};
  assert.equal((await s.call('/entrar/meta',init)).status,503);await s.flush();assert.equal(payloads.length,0);
  await s.configure(groups);const a=await s.call('/entrar/meta',init);assert.equal(a.status,200);const d=await a.json();await s.flush();assert.equal(d.leadEventID,ticket.split('.')[0]+'_Lead');assert.equal(payloads.length,1);assert.equal(payloads[0].data[0].event_id,d.leadEventID);assert.match(payloads[0].data[0].user_data.fbc,/CLICK_FIXTURE$/);
  await s.call('/entrar/meta',init);await s.flush();assert.equal(payloads.length,1);
 }finally{globalThis.fetch=original}
});
