import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextClick } from '../src/rotation.mjs';
const config = {limit: 1, groups: [{id:'g1',url:'https://chat.whatsapp.com/example1'},{id:'g2',url:'https://chat.whatsapp.com/example2'}]};
const day = '2026-11-25';
test('T03 preserva origem, total e limite; identifica imagem e vídeo', () => {
  const a = nextClick(config, {}, 'meta', day, 'oft_t03', 'imagem_01');
  const b = nextClick(config, a.metrics, 'meta', day, 'oft_t03', 'video_01');
  assert.equal(a.target.id,'g1');
  assert.equal(b.target.id,'g2');
  assert.equal(b.metrics.total,2);
  assert.equal(b.metrics.bySource.meta,2);
  assert.deepEqual(b.metrics.byCampaignCreative,{'oft_t03|imagem_01':1,'oft_t03|video_01':1});
  assert.equal(b.metrics.byDayCampaignCreative[day+'|oft_t03|video_01'],1);
  assert.equal(nextClick(config,b.metrics,'meta',day,'oft_t03','video_01').target,null);
});
test('não registra UTMs arbitrárias nem altera outros canais', () => {
  for (const [source,campaign,creative] of [['meta','other','video_01'],['meta','oft_t03','unknown'],['telegram','oft_t03','video_01'],['meta',undefined,undefined]]) {
    const r=nextClick(config,{},source,day,campaign,creative);
    assert.equal(r.metrics.total,1);
    assert.equal(r.metrics.bySource[source],1);
    assert.equal(r.metrics.byCampaignCreative,undefined);
  }
});
