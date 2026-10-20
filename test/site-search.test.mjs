import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const links = JSON.parse(fs.readFileSync(new URL('../data/bento-links.json', import.meta.url), 'utf8'));
const catalogSource = fs.readFileSync(new URL('../lib/siteCatalog.ts', import.meta.url), 'utf8');

test('searchSiteItems is exported and uses cached searchText index', () => {
  assert.match(catalogSource, /export function searchSiteItems/);
  assert.match(catalogSource, /itemSearchTextCache/);
  assert.match(catalogSource, /WeakMap/);
});

test('bento-links contains Store Pulse flagship with correct metadata', () => {
  const storePulse = links.find((item) => item.url === 'https://storepulse.david888.com/');
  assert.ok(storePulse, 'Store Pulse item exists');
  assert.equal(storePulse.tag, 'products');
  assert.equal(storePulse.flagship, true);
  assert.equal(storePulse.icon, 'store');
  assert.equal(storePulse.docLabel, 'llms.txt 規範');
  assert.equal(storePulse.docUrl, 'https://storepulse.david888.com/llms.txt');
  assert.match(storePulse.title, /Store Pulse/);
  assert.match(storePulse.description, /Cloudflare Workers/);
});
