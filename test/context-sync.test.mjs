import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  parseThreadsMarkdown,
  mergeThreadsArchive,
  syncThreadsArchive,
} from '../scripts/threads-context.mjs';
import {
  normalizeGithubRepos,
  syncGithubContext,
} from '../scripts/github-context.mjs';
import {
  buildSiteContext,
  buildRssXml,
  enforceContextByteBudget,
  SITE_CONTEXT_MAX_BYTES,
} from '../scripts/build-site-context.mjs';

const THREADS_FIXTURE = `
[david888.chiang](https://www.threads.com/@david888.chiang)
[2h](https://www.threads.com/@david888.chiang/post/Df3I3jtk_GG)
[![Image 3: oneday0013's profile picture](https://example.com/a.jpg)](https://www.threads.com/@oneday0013)
[oneday0013](https://www.threads.com/@oneday0013)
[21h](https://www.threads.com/@oneday0013/post/Df1IW21jdG6)
[軟體業職稱的族譜 Ian Miell 把 104 個軟體職稱畫成一棵樹](https://www.threads.com/@oneday0013/post/Df1IW21jdG6)

[david888.chiang](https://www.threads.com/@david888.chiang)
[OpenAI](https://www.threads.com/search?q=OpenAI)
[22h](https://www.threads.com/@david888.chiang/post/Df1D8C2E7V7)
~/.codex 禁用否定對照與免責句型，避免輸出「不是 A，而是 B」。

[david888.chiang](https://www.threads.com/@david888.chiang)
[1d](https://www.threads.com/@david888.chiang/post/Df0QuotePost1)
這篇架構分析非常值得讀，尤其是邊界隔離的實踐。
[someone](https://www.threads.com/@someone)
[2d](https://www.threads.com/@someone/post/QuoteTarget99)
Original thread content from someone else.

Log in to see more from david888.chiang.
`;

test('parseThreadsMarkdown excludes pure reposts and preserves original and quote commentary', () => {
  const parsed = parseThreadsMarkdown(THREADS_FIXTURE, { now: '2026-11-18T10:00:00.000Z' });
  assert.equal(parsed.counts.repost, 1);
  assert.equal(parsed.counts.original, 2);

  const repost = parsed.entries.find((e) => e.id === 'Df3I3jtk_GG');
  assert.equal(repost?.classification, 'repost');

  const original = parsed.entries.find((e) => e.id === 'Df1D8C2E7V7');
  assert.equal(original?.classification, 'original');
  assert.ok(original?.text.includes('~/.codex'));

  const quote = parsed.entries.find((e) => e.id === 'Df0QuotePost1');
  assert.equal(quote?.classification, 'original');
  assert.ok(quote?.text.includes('這篇架構分析非常值得讀'));
  assert.ok(!quote?.text.includes('Original thread content from someone else'));
});

test('syncThreadsArchive accumulates originals across runs and preserves stale archive on login wall', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'threads-sync-'));
  try {
    // Run 1: initial sync
    const res1 = await syncThreadsArchive({
      dataDir: tmpDir,
      now: '2026-11-18T10:00:00.000Z',
      fetchImpl: async () => ({ ok: true, status: 200, text: async () => THREADS_FIXTURE }),
    });
    assert.equal(res1.syncStatus, 'ok');
    assert.equal(res1.entries.length, 2);

    // Run 2: new original post arrives; earlier posts remain accumulated
    const newerMd = `
[david888.chiang](https://www.threads.com/@david888.chiang)
[1h](https://www.threads.com/@david888.chiang/post/DfNewPost999)
Cloudflare Workers STARTTLS port 587 實測穩定通過。
`;
    const res2 = await syncThreadsArchive({
      dataDir: tmpDir,
      now: '2026-11-19T10:00:00.000Z',
      fetchImpl: async () => ({ ok: true, status: 200, text: async () => newerMd }),
    });
    assert.equal(res2.syncStatus, 'ok');
    assert.equal(res2.entries.length, 3);
    assert.equal(res2.entries[0].id, 'DfNewPost999');

    // Run 3: upstream hits login wall -> stale fallback preserves all 3 archived posts
    const res3 = await syncThreadsArchive({
      dataDir: tmpDir,
      now: '2026-11-20T10:00:00.000Z',
      fetchImpl: async () => ({ ok: true, status: 200, text: async () => 'Log in to Threads' }),
    });
    assert.equal(res3.syncStatus, 'stale');
    assert.equal(res3.entries.length, 3);

    // Verify cap at 40 entries
    const many = Array.from({ length: 45 }, (_, idx) => ({
      id: `Post_${idx}`,
      url: `https://www.threads.com/@david888.chiang/post/Post_${idx}`,
      classification: 'original',
      text: `Original post ${idx}`,
      publishedAt: new Date(Date.parse('2026-11-01T00:00:00Z') + idx * 3600_000).toISOString(),
    }));
    const capped = mergeThreadsArchive({ entries: [] }, many, '2026-11-20T10:00:00.000Z');
    assert.equal(capped.entries.length, 40);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('normalizeGithubRepos filters pure forks unless in allowlist and syncGithubContext falls back safely', async () => {
  const normalized = normalizeGithubRepos(
    [
      { name: 'own-repo', html_url: 'https://github.com/tbdavid2019/own-repo', fork: false, stargazers_count: 10, pushed_at: '2026-11-18T00:00:00Z' },
      { name: 'random-fork', html_url: 'https://github.com/tbdavid2019/random-fork', fork: true, stargazers_count: 100, pushed_at: '2026-11-18T00:00:00Z' },
      { name: 'featured-fork', html_url: 'https://github.com/tbdavid2019/featured-fork', fork: true, stargazers_count: 1, pushed_at: '2026-11-10T00:00:00Z' },
    ],
    ['featured-fork'],
  );
  assert.equal(normalized.length, 2);
  assert.ok(normalized.some((r) => r.name === 'own-repo'));
  assert.ok(normalized.some((r) => r.name === 'featured-fork' && r.featured === true));
  assert.ok(!normalized.some((r) => r.name === 'random-fork'));

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gh-sync-'));
  try {
    const okRes = await syncGithubContext({
      dataDir: tmpDir,
      now: '2026-11-18T10:00:00Z',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => [
          { name: '888a2a', html_url: 'https://github.com/tbdavid2019/888a2a', fork: false, description: 'A2A hub', pushed_at: '2026-11-18T01:00:00Z' },
        ],
      }),
    });
    assert.equal(okRes.syncStatus, 'ok');
    assert.equal(okRes.repos.length, 1);

    const staleRes = await syncGithubContext({
      dataDir: tmpDir,
      now: '2026-11-19T10:00:00Z',
      fetchImpl: async () => ({ ok: false, status: 403 }),
    });
    assert.equal(staleRes.syncStatus, 'stale');
    assert.equal(staleRes.repos.length, 1);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('buildSiteContext enforces <= 40KB budget, deduplicates feeds, and builds valid RSS 2.0 XML offline', async () => {
  const tmpData = await fs.mkdtemp(path.join(os.tmpdir(), 'ctx-data-'));
  const tmpOut = await fs.mkdtemp(path.join(os.tmpdir(), 'ctx-out-'));

  try {
    // Seed large catalog fixture to exercise 40KB byte budget truncation
    const hugeLinks = Array.from({ length: 120 }, (_, i) => ({
      type: 'link',
      tag: 'products',
      flagship: i < 3,
      title: `專案項目 ${i}`,
      titleEn: `Project Item ${i}`,
      description: '這是一段非常詳細的系統架構描述，包含多代理協同與分散式快取策略說明。'.repeat(5),
      url: `https://david888.com/item-${i}`,
      techStack: ['TypeScript', 'Cloudflare', 'Workers', 'React', 'Tailwind'],
    }));
    await fs.writeFile(path.join(tmpData, 'bento-links.json'), JSON.stringify(hugeLinks));
    await fs.writeFile(path.join(tmpData, 'capabilities.json'), JSON.stringify([]));
    await fs.writeFile(path.join(tmpData, 'bento-profile.json'), JSON.stringify({ name: 'David Chiang', contactLine: 'Taipei' }));
    await fs.writeFile(path.join(tmpData, 'profile-content.json'), JSON.stringify({ zh: { headline: 'CTO & 技術顧問', subHeadline: '架構落地' } }));

    const result = await buildSiteContext({
      dataDir: tmpData,
      outputDir: tmpOut,
      siteOrigin: 'https://david888.com',
      now: '2026-11-18T10:00:00.000Z',
      fetchImpl: async (url) => {
        if (String(url).includes('ghost/api')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              posts: [
                {
                  title: '架構重構 & <XSS> 筆記',
                  url: 'https://blog.david888.com/refactor/',
                  excerpt: '<p>Clean architecture &amp; cost ROI</p>',
                  published_at: '2026-11-17T08:00:00Z',
                },
              ],
            }),
          };
        }
        if (String(url).includes('podcast.david888.com')) {
          return {
            ok: true,
            status: 200,
            text: async () => `<rss><channel><item><title>EP 10: AI &amp; CTO</title><link>https://podcast.david888.com/ep10</link><pubDate>Tue, 17 Nov 2026 02:00:00 GMT</pubDate><description><![CDATA[Podcast <b>episode</b>]]></description></item></channel></rss>`,
          };
        }
        if (String(url).includes('2md.aiurl.tw')) {
          return { ok: true, status: 200, text: async () => THREADS_FIXTURE };
        }
        if (String(url).includes('api.github.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => [
              { name: '888a2a', html_url: 'https://github.com/tbdavid2019/888a2a', fork: false, description: 'Multi-agent hub', pushed_at: '2026-11-18T01:00:00Z' },
            ],
          };
        }
        return { ok: false, status: 404 };
      },
    });

    const contextBytes = Buffer.byteLength(await fs.readFile(path.join(tmpOut, 'site-context.json'), 'utf8'), 'utf8');
    assert.ok(contextBytes <= SITE_CONTEXT_MAX_BYTES, `Expected <= ${SITE_CONTEXT_MAX_BYTES} bytes, got ${contextBytes}`);
    assert.equal(result.siteContext.syncStatus, 'ok');
    assert.ok(result.feedSummary.items.some((i) => i.source === 'blog'));
    assert.ok(result.feedSummary.items.some((i) => i.source === 'podcast'));
    assert.ok(result.feedSummary.items.some((i) => i.source === 'threads'));
    assert.ok(result.feedSummary.items.some((i) => i.source === 'github'));

    const rss = await fs.readFile(path.join(tmpOut, 'rss.xml'), 'utf8');
    assert.ok(rss.includes('<rss version="2.0"'));
    assert.ok(rss.includes('&lt;XSS&gt;'));
    assert.ok(!rss.includes('<b>episode</b>'));

    // Test enforceContextByteBudget directly with oversized items
    const truncated = enforceContextByteBudget({ items: hugeLinks.map((x, idx) => ({ id: `${idx}`, source: 'portfolio', featured: idx < 2, title: x.title, summary: x.description, url: x.url, tags: x.techStack })) }, 4096);
    assert.ok(Buffer.byteLength(JSON.stringify(truncated), 'utf8') <= 4096);

    const rssTest = buildRssXml({ items: result.feedSummary.items, siteOrigin: 'https://david888.com', nowIso: '2026-11-18T10:00:00.000Z' });
    assert.ok(rssTest.includes('<atom:link href="https://david888.com/rss.xml"'));
  } finally {
    await fs.rm(tmpData, { recursive: true, force: true });
    await fs.rm(tmpOut, { recursive: true, force: true });
  }
});
