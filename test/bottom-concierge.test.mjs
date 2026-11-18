import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSlashCommand,
  filterSlashCommands,
  searchCombinedCatalog,
  createInitialGreetingMessage,
  isSafeLinkTarget,
} from '../lib/concierge-session.ts';

test('parseSlashCommand resolves all built-in commands and flags unknown commands cleanly', () => {
  assert.deepEqual(parseSlashCommand('/help'), { type: 'help' });
  assert.deepEqual(parseSlashCommand('  /SEARCH  FIDO2 Passkey '), { type: 'search', query: 'FIDO2 Passkey' });
  assert.deepEqual(parseSlashCommand('/search'), { type: 'search', query: '' });
  assert.deepEqual(parseSlashCommand('/rss'), { type: 'rss' });
  assert.deepEqual(parseSlashCommand('/contact'), { type: 'contact' });
  assert.deepEqual(parseSlashCommand('/form'), { type: 'form' });
  assert.deepEqual(parseSlashCommand('/commitments'), {
    type: 'route',
    categoryId: 'commitments',
    path: '/commitments',
  });
  assert.deepEqual(parseSlashCommand('/executive'), {
    type: 'route',
    categoryId: 'executive',
    path: '/executive',
  });
  assert.deepEqual(parseSlashCommand('/flagships'), {
    type: 'route',
    categoryId: 'flagships',
    path: '/flagships',
  });
  assert.deepEqual(parseSlashCommand('/clear'), { type: 'clear' });
  assert.deepEqual(parseSlashCommand('/foo bar'), { type: 'unknown', command: '/foo' });
  assert.equal(parseSlashCommand('請問 David 最近在做什麼 AI 系統？'), null);
});

test('filterSlashCommands filters autocomplete list cleanly before arguments begin', () => {
  const allCmds = filterSlashCommands('/');
  assert.ok(allCmds.length >= 9);

  const coCmds = filterSlashCommands('/co');
  assert.deepEqual(
    coCmds.map((c) => c.command),
    ['/contact', '/commitments'],
  );

  // Stop showing autocomplete dropdown once visitor starts typing arguments
  assert.deepEqual(filterSlashCommands('/search AI'), []);
  assert.deepEqual(filterSlashCommands('hello'), []);
});

test('searchCombinedCatalog deduplicates normalized URLs, ranks matches, and blocks unsafe URLs', () => {
  const catalog = [
    {
      id: 'cat-1',
      title: 'FIDO2 Passkey 實作作品 (Featured)',
      summary: 'Cloudflare Workers WebAuthn verification suite',
      url: 'https://blog.david888.com/fido2-workers/',
      source: 'products',
      featured: true,
      tags: ['fido2', 'passkey', 'security'],
    },
    {
      id: 'cat-unsafe',
      title: 'Unsafe FIDO2 Item',
      summary: 'Should never pass validation',
      url: 'javascript:alert(1)',
      source: 'products',
      tags: ['fido2'],
    },
  ];

  const feed = [
    {
      id: 'feed-dup',
      title: 'FIDO2 Passkey Feed Entry',
      summary: 'Duplicate URL without trailing slash',
      url: 'https://blog.david888.com/fido2-workers',
      source: 'blog',
      publishedAt: '2026-11-18T00:00:00Z',
      tags: ['fido2'],
    },
    {
      id: 'feed-threads',
      title: 'Quad9 DNS 斷線防護 Threads 筆記',
      summary: '討論 FIDO2 與 DNS 多線備援策略',
      url: 'https://www.threads.com/@david888.chiang',
      source: 'threads',
      publishedAt: '2026-11-18T08:00:00Z',
      tags: ['threads', 'dns'],
    },
  ];

  assert.equal(isSafeLinkTarget('/executive'), true);
  assert.equal(isSafeLinkTarget('https://david888.com/rss.xml'), true);
  assert.equal(isSafeLinkTarget('javascript:alert(1)'), false);

  const results = searchCombinedCatalog('FIDO2', catalog, feed, 8);
  assert.equal(results.length, 2);
  // Deduplicated: catalog entry wins over duplicate feed URL without trailing slash
  assert.equal(results[0].id, 'cat-1');
  assert.equal(results[1].id, 'feed-threads');
  assert.ok(!results.some((r) => r.url.includes('javascript:')));
});

test('createInitialGreetingMessage generates distinct greetings for qa vs contact mode', () => {
  const qaZh = createInitialGreetingMessage('zh', 'qa');
  const contactZh = createInitialGreetingMessage('zh', 'contact');
  assert.equal(qaZh.mode, 'qa');
  assert.equal(contactZh.mode, 'contact');
  assert.ok(qaZh.content.includes('/search'));
  assert.ok(contactZh.content.includes('小秘書'));
});
