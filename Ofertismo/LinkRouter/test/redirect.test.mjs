import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reserveRedirect,validOperation,RECEIPT_TTL,RECEIPT_LIMIT} from '../src/redirect.mjs';
const config={limit:1,groups:[{id:'g1',url:'https://chat.whatsapp.com/fixture1'},{id:'g2',url:'https://chat.whatsapp.com/fixture2'}]};
const op='12345678-1234-4abc-8abc-123456789abc',op2='12345678-1234-4abc-8abc-123456789abd',now=Date.parse('2026-11-26T16:00:00Z');
const input={source:'meta',campaign:'oft_t03',creative:'imagem_01',operation:op};
test('same operation returns same group without another reservation, including after rollover',()=>{
 const first=reserveRedirect(config,{}, {},input,now);
 const repeat=reserveRedirect(config,first.metrics,first.receipts,input,now+1);
 assert.equal(first.target.id,'g1');assert.equal(first.metrics.total,1);
 assert.equal(repeat.repeated,true);assert.equal(repeat.target.id,'g1');assert.equal(repeat.metrics.total,1);
 const fresh=reserveRedirect(config,repeat.metrics,repeat.receipts,{...input,operation:op2},now+2);
 assert.equal(fresh.target.id,'g2');assert.equal(fresh.metrics.total,2);
 assert.deepEqual(Object.keys(first.receipts[op]).sort(),['at','group']);
});
test('expiry and missing group do not reuse stale reservation',()=>{
 const first=reserveRedirect(config,{}, {},input,now);
 const expired=reserveRedirect(config,first.metrics,first.receipts,input,now+RECEIPT_TTL);
 assert.equal(expired.target.id,'g2');assert.equal(expired.repeated,false);
 const removed=reserveRedirect({...config,groups:[config.groups[1]]},first.metrics,first.receipts,input,now+1);
 assert.equal(removed.target,null);assert.equal(removed.repeated,true);
});
test('invalid operation is not persisted and no-group outcome is not a receipt',()=>{
 assert.equal(validOperation('__proto__'),false);
 const r=reserveRedirect(config,{}, {},{...input,operation:'private@example.com'},now);
 assert.deepEqual(r.receipts,{});
 const fail=reserveRedirect({...config,groups:[]},{}, {},input,now);
 assert.equal(fail.target,null);assert.deepEqual(fail.receipts,{});
});
test('receipt retention is bounded',()=>{
 let receipts={};for(let i=0;i<RECEIPT_LIMIT;i++)receipts['12345678-1234-4abc-8abc-'+i.toString(16).padStart(12,'0')]={at:now-1,group:'g1'};
 const r=reserveRedirect(config,{},receipts,input,now);
 assert.equal(Object.keys(r.receipts).length,RECEIPT_LIMIT);
});
