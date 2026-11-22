import test from 'node:test';
import assert from 'node:assert/strict';
import { nextClick, validateConfig, cleanSource, dateInSaoPaulo } from '../src/rotation.mjs';
const config = validateConfig({limit:1000,groups:[{id:'grupo-01',url:'https://chat.whatsapp.com/AAAAAAAA'},{id:'grupo-02',url:'https://chat.whatsapp.com/BBBBBBBB'}]});
test('exatamente mil acessos vão ao primeiro grupo; o próximo vai ao segundo',()=>{
  let state={};for(let i=0;i<1000;i++){const v=nextClick(config,state,'team','2026-11-22');assert.equal(v.target.id,'grupo-01');state=v.metrics}
  const next=nextClick(config,state,'team','2026-11-22');assert.equal(next.target.id,'grupo-02');assert.equal(next.metrics.byGroup['grupo-01'],1000);assert.equal(next.metrics.byGroup['grupo-02'],1);
});
test('para de encaminhar depois que todos os grupos atingem o limite',()=>{
 const c={limit:2,groups:config.groups};let state={};for(let i=0;i<4;i++){const x=nextClick(c,state,'meta','2026-11-22');assert.ok(x.target);state=x.metrics}const exhausted=nextClick(c,state,'meta','2026-11-22');assert.equal(exhausted.target,null);assert.equal(exhausted.reason,'limit_reached');assert.equal(state.total,4);
});
test('não registra cliques sem grupo configurado',()=>{const value=nextClick({limit:1000,groups:[]},{},'telegram','2026-11-22');assert.equal(value.target,null)});
test('só aceita convites de grupos em hosts permitidos',()=>{assert.throws(()=>validateConfig({limit:1000,groups:[{id:'a',url:'https://example.com/phishing'}]}));assert.throws(()=>validateConfig({limit:1000,groups:[{id:'a',url:'http://chat.whatsapp.com/test'}]}))});
test('origens são normalizadas e data é do Brasil',()=>{assert.equal(cleanSource('TEAM'),'team');assert.equal(cleanSource('../../x'),'direto');assert.equal(dateInSaoPaulo(new Date('2026-11-23T01:00:00Z')),'2026-11-22')});