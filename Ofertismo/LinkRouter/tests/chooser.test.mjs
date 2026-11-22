import test from 'node:test';
import assert from 'node:assert/strict';
import { renderChooserPage } from '../src/chooser.mjs';

const invite = 'https://chat.whatsapp.com/BJ5Evurxrzd1yX6ffUIQsz';

test('Android: permite escolha de pessoal e Business, com convite oficial de segurança', () => {
  const html = renderChooserPage(invite + '?s=cl&p=a', 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit');
  assert.match(html, /package=com\.whatsapp;/);
  assert.match(html, /package=com\.whatsapp\.w4b;/);
  assert.match(html, /Abrir convite oficial do WhatsApp/);
  assert.match(html, /S\.browser_fallback_url=https%3A%2F%2Fchat\.whatsapp\.com%2F/);
  assert.match(html, /\?s=cl&amp;p=a/);
});

test('iPhone e desktop: abre convite oficial e não oferece Android Intent incompatível', () => {
  const html = renderChooserPage(invite, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
  assert.match(html, /Abrir WhatsApp/);
  assert.doesNotMatch(html, /package=com\.whatsapp/);
  assert.match(html, /href="https:\/\/chat\.whatsapp\.com\//);
});

test('Bloqueia endereços falsos ou não oficiais', () => {
  for (const url of [
    'https://evil.test/convite',
    'https://chat.whatsapp.com.evil.test/test123456789',
    'javascript:alert(1)',
    'http://chat.whatsapp.com/BJ5Evurxrzd1yX6ffUIQsz'
  ]) {
    assert.throws(() => renderChooserPage(url, 'Android'));
  }
});
