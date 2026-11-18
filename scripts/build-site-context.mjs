import fs from 'fs/promises';
import path from 'path';
import { syncThreadsArchive } from './threads-context.mjs';
import { syncGithubContext } from './github-context.mjs';

export const BLOG_GHOST_API_URL =
  'https://admin.blog.david888.com/ghost/api/content/posts/?key=9f872fa2c1d0f2c4a54b921194&limit=10&fields=title,url,excerpt,published_at';
export const BLOG_FEED_HOME_URL = 'https://blog.david888.com/rss/';
export const PODCAST_RSS_URL = 'https://podcast.david888.com/rss.xml';
export const GITHUB_ATOM_URL = 'https://github.com/tbdavid2019.atom';
export const THREADS_PROFILE_URL = 'https://www.threads.com/@david888.chiang';
export const SITE_CONTEXT_MAX_BYTES = 40_960;

function stripHtmlAndWhitespace(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(value, maxLen) {
  const text = stripHtmlAndWhitespace(value);
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

function truncatePlainText(value, maxLen) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

export function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function toIsoDateOrFallback(raw, fallbackIso) {
  const ts = Date.parse(String(raw || ''));
  return Number.isFinite(ts) ? new Date(ts).toISOString() : fallbackIso;
}

export function parsePodcastRssXml(xml, nowIso) {
  const items = [];
  for (const match of String(xml || '').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const getTag = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? stripHtmlAndWhitespace(m[1]) : '';
    };
    const title = getTag('title');
    const url = getTag('link');
    const pubDate = getTag('pubDate');
    const description = getTag('description') || getTag('itunes:summary');
    if (!title || !url) continue;
    items.push({
      id: `podcast:${url}`,
      source: 'podcast',
      sourceFeedUrl: PODCAST_RSS_URL,
      title: truncateText(title, 140),
      summary: truncateText(description || title, 280),
      url,
      publishedAt: toIsoDateOrFallback(pubDate, nowIso),
      tags: ['podcast'],
    });
    if (items.length >= 10) break;
  }
  return items;
}

async function fetchJsonWithTimeout(fetchImpl, url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res || !res.ok) throw new Error(`HTTP ${res?.status || 'unknown'}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextWithTimeout(fetchImpl, url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res || !res.ok) throw new Error(`HTTP ${res?.status || 'unknown'}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export function buildRssXml({ items, siteOrigin, nowIso }) {
  const lastBuildDate = new Date(toIsoDateOrFallback(nowIso, new Date().toISOString())).toUTCString();
  const rssItems = (Array.isArray(items) ? items : []).slice(0, 25).map((item) => {
    const pubDate = new Date(toIsoDateOrFallback(item.publishedAt, nowIso)).toUTCString();
    const desc = truncateText(item.summary || item.title, 280);
    const guid = String(item.id || item.url);
    return [
      '    <item>',
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(item.url)}</link>`,
      `      <guid isPermaLink="false">${escapeXml(guid)}</guid>`,
      `      <pubDate>${pubDate}</pubDate>`,
      `      <category>${escapeXml(item.source || 'update')}</category>`,
      `      <description>${escapeXml(desc)}</description>`,
      '    </item>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>David Chiang (David888) — Portfolio, Engineering &amp; Insights</title>',
    `    <link>${escapeXml(siteOrigin)}/</link>`,
    `    <atom:link href="${escapeXml(siteOrigin)}/rss.xml" rel="self" type="application/rss+xml" />`,
    '    <description>Unified feed of David Chiang blog articles, podcast episodes, GitHub repositories, and original Threads notes.</description>',
    '    <language>zh-Hant</language>',
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    ...rssItems,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function enforceContextByteBudget(payload, maxBytes = SITE_CONTEXT_MAX_BYTES) {
  const serialize = (obj) => Buffer.byteLength(JSON.stringify(obj), 'utf8');
  const cloned = {
    ...payload,
    items: Array.isArray(payload.items) ? payload.items.map((item) => ({ ...item })) : [],
  };

  if (serialize(cloned) <= maxBytes) return cloned;

  // Step 1: Trim summaries to 100 chars
  cloned.items = cloned.items.map((item) => ({
    ...item,
    summary: truncateText(item.summary, 100),
    tags: Array.isArray(item.tags) ? item.tags.slice(0, 4) : [],
  }));
  if (serialize(cloned) <= maxBytes) return cloned;

  // Step 2: Prefer core portfolio/capabilities/flagships first, keep newest across all feed sources (blog, podcast, threads, github)
  const isCore = (item) =>
    item.source === 'portfolio' || item.source === 'capability' || Boolean(item.featured);
  const coreItems = cloned.items.filter(isCore);
  const feedItems = cloned.items
    .filter((item) => !isCore(item))
    .sort((a, b) => (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0));

  while (feedItems.length > 0 && serialize({ ...cloned, items: [...coreItems, ...feedItems] }) > maxBytes) {
    feedItems.pop();
  }
  cloned.items = [...coreItems, ...feedItems];

  // Step 3: If core catalog itself still exceeds budget, trim from tail of coreItems
  while (cloned.items.length > 0 && serialize(cloned) > maxBytes) {
    cloned.items.pop();
  }
  return cloned;
}

function deduplicateFeedItems(items) {
  const seenKeys = new Set();
  const deduped = [];
  for (const item of items) {
    if (!item || !item.url || !item.title) continue;
    const urlKey = String(item.url).replace(/\/+$/, '').toLowerCase();
    const idKey = String(item.id || '').toLowerCase();
    if (seenKeys.has(urlKey) || (idKey && seenKeys.has(idKey))) continue;
    seenKeys.add(urlKey);
    if (idKey) seenKeys.add(idKey);
    deduped.push(item);
  }
  return deduped;
}

export async function buildSiteContext({
  fetchImpl = globalThis.fetch,
  dataDir = path.join(process.cwd(), 'data'),
  outputDir = path.join(process.cwd(), 'public'),
  siteOrigin = 'https://david888.com',
  githubActivityEntries = [],
  now = new Date().toISOString(),
  timeoutMs = 10_000,
} = {}) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  // 1. Load static portfolio data
  const readJsonSafe = async (filePath, fallback) => {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch {
      return fallback;
    }
  };

  const links = await readJsonSafe(path.join(dataDir, 'bento-links.json'), []);
  const capabilities = await readJsonSafe(path.join(dataDir, 'capabilities.json'), []);
  const profileJson = await readJsonSafe(path.join(dataDir, 'bento-profile.json'), {});
  const profileContent = await readJsonSafe(path.join(dataDir, 'profile-content.json'), {});
  const feedCachePath = path.join(dataDir, 'feed-cache.json');
  const prevFeedCache = await readJsonSafe(feedCachePath, { syncStatus: 'stale', lastSyncedAt: null, blog: [], podcast: [] });

  // 2. Sync Blog & Podcast with per-source stale fallback
  let blogItems = Array.isArray(prevFeedCache.blog) ? prevFeedCache.blog : [];
  let podcastItems = Array.isArray(prevFeedCache.podcast) ? prevFeedCache.podcast : [];
  let feedSyncStatus = 'ok';

  try {
    const ghostPayload = await fetchJsonWithTimeout(fetchImpl, BLOG_GHOST_API_URL, timeoutMs);
    if (Array.isArray(ghostPayload?.posts)) {
      blogItems = ghostPayload.posts
        .filter((p) => p && p.title && p.url)
        .slice(0, 10)
        .map((p) => ({
          id: `blog:${p.url}`,
          source: 'blog',
          sourceFeedUrl: BLOG_FEED_HOME_URL,
          title: truncatePlainText(p.title, 140),
          summary: truncateText(p.excerpt || p.title, 280),
          url: String(p.url),
          publishedAt: toIsoDateOrFallback(p.published_at, now),
          tags: ['blog'],
        }));
    } else {
      feedSyncStatus = 'stale';
    }
  } catch (err) {
    feedSyncStatus = 'stale';
    console.warn('Unable to sync Blog feed:', err?.message || err);
  }

  try {
    const podcastXml = await fetchTextWithTimeout(fetchImpl, PODCAST_RSS_URL, timeoutMs);
    const parsedPodcast = parsePodcastRssXml(podcastXml, now);
    if (parsedPodcast.length > 0) {
      podcastItems = parsedPodcast;
    } else {
      feedSyncStatus = 'stale';
    }
  } catch (err) {
    feedSyncStatus = 'stale';
    console.warn('Unable to sync Podcast RSS:', err?.message || err);
  }

  const nextFeedCache = {
    syncStatus: feedSyncStatus,
    lastSyncedAt: feedSyncStatus === 'ok' ? now : (prevFeedCache.lastSyncedAt || null),
    blog: blogItems,
    podcast: podcastItems,
  };
  await fs.writeFile(feedCachePath, `${JSON.stringify(nextFeedCache, null, 2)}\n`, 'utf8');

  // 3. Sync Threads & GitHub
  const threadsArchive = await syncThreadsArchive({ fetchImpl, dataDir, now, timeoutMs });
  const githubContext = await syncGithubContext({ fetchImpl, dataDir, now, timeoutMs });

  const overallStale =
    feedSyncStatus === 'stale' ||
    threadsArchive.syncStatus === 'stale' ||
    githubContext.syncStatus === 'stale';
  const overallSyncStatus = overallStale ? 'stale' : 'ok';

  // 4. Build normalized catalog items
  const portfolioItems = (Array.isArray(links) ? links : [])
    .filter((item) => item && !item.hidden && (item.title || item.titleEn))
    .map((item, idx) => ({
      id: `portfolio:${idx}:${item.url || item.title}`,
      source: 'portfolio',
      featured: Boolean(item.flagship),
      title: truncateText(item.titleEn && item.title ? `${item.title} (${item.titleEn})` : (item.title || item.titleEn), 120),
      summary: truncateText(item.description || item.descriptionEn || '', 140),
      url: item.url || `${siteOrigin}/${item.tag || 'products'}`,
      tags: [item.tag, ...(Array.isArray(item.techStack) ? item.techStack.slice(0, 4) : [])].filter(Boolean),
    }));

  const capabilityItems = (Array.isArray(capabilities) ? capabilities : [])
    .filter((c) => c && c.id && c.title)
    .map((c) => ({
      id: `capability:${c.id}`,
      source: 'capability',
      featured: true,
      title: truncateText(`${c.title} (${c.titleEn || c.id})`, 120),
      summary: truncateText(c.description || c.descriptionEn || '', 140),
      url: `${siteOrigin}/executive`,
      tags: Array.isArray(c.keywords) ? c.keywords.slice(0, 5) : [],
    }));

  const threadsFeedItems = (Array.isArray(threadsArchive.entries) ? threadsArchive.entries : []).map((t) => ({
    id: `threads:${t.id}`,
    source: 'threads',
    sourceFeedUrl: THREADS_PROFILE_URL,
    title: truncateText(t.text, 100),
    summary: truncateText(t.text, 280),
    url: t.url,
    publishedAt: toIsoDateOrFallback(t.publishedAt || t.fetchedAt, now),
    tags: ['threads'],
  }));

  const githubRepoItems = (Array.isArray(githubContext.repos) ? githubContext.repos : []).map((r) => ({
    id: r.id,
    source: 'github',
    sourceFeedUrl: GITHUB_ATOM_URL,
    featured: Boolean(r.featured),
    title: truncateText(r.name, 100),
    summary: truncateText(
      [r.description, r.language ? `[${r.language}]` : '', r.stars > 0 ? `★${r.stars}` : ''].filter(Boolean).join(' '),
      140,
    ),
    url: r.url,
    publishedAt: r.pushedAt ? toIsoDateOrFallback(r.pushedAt, now) : undefined,
    tags: ['github', r.language, ...(Array.isArray(r.topics) ? r.topics.slice(0, 3) : [])].filter(Boolean),
  }));

  const githubActivityFeedItems = (Array.isArray(githubActivityEntries) ? githubActivityEntries : []).map((e) => ({
    id: `github-activity:${e.url}`,
    source: 'github',
    sourceFeedUrl: GITHUB_ATOM_URL,
    title: truncateText(e.title, 120),
    summary: truncateText(e.summary || e.title, 200),
    url: e.url,
    publishedAt: toIsoDateOrFallback(e.updated, now),
    tags: ['github', 'activity'],
  }));

  // 5. Feed summary + RSS (newest-first, deduplicated)
  const rawFeedPool = [...blogItems, ...podcastItems, ...threadsFeedItems, ...githubActivityFeedItems, ...githubRepoItems]
    .filter((item) => item.publishedAt)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  const dedupedFeed = deduplicateFeedItems(rawFeedPool);
  const feedSummaryPayload = {
    syncStatus: overallSyncStatus,
    lastSyncedAt: now,
    feedUrl: `${siteOrigin}/rss.xml`,
    items: dedupedFeed.slice(0, 20),
  };

  const rssXml = buildRssXml({
    items: dedupedFeed.slice(0, 25),
    siteOrigin,
    nowIso: now,
  });

  // 6. Site context (strictly <= 40 KB)
  const zhHeadline = profileContent?.zh?.headline || '';
  const zhSub = profileContent?.zh?.subHeadline || '';
  const rawContext = {
    syncStatus: overallSyncStatus,
    lastSyncedAt: now,
    profile: {
      name: profileJson?.name || 'David Chiang (David888)',
      headline: truncateText(`${zhHeadline} ${zhSub}`, 220),
      location: profileJson?.contactLine || '台北 / 高雄 可合作',
      siteOrigin,
    },
    items: [
      ...capabilityItems,
      ...portfolioItems,
      ...blogItems.map((i) => ({ ...i, summary: truncateText(i.summary, 140) })),
      ...podcastItems.map((i) => ({ ...i, summary: truncateText(i.summary, 140) })),
      ...threadsFeedItems.map((i) => ({ ...i, summary: truncateText(i.summary, 140) })),
      ...githubRepoItems,
    ],
  };

  const boundedContext = enforceContextByteBudget(rawContext, SITE_CONTEXT_MAX_BYTES);

  await fs.writeFile(
    path.join(outputDir, 'site-context.json'),
    `${JSON.stringify(boundedContext)}\n`,
    'utf8',
  );
  await fs.writeFile(
    path.join(outputDir, 'feed-summary.json'),
    `${JSON.stringify(feedSummaryPayload, null, 2)}\n`,
    'utf8',
  );
  await fs.writeFile(path.join(outputDir, 'rss.xml'), rssXml, 'utf8');

  return {
    siteContext: boundedContext,
    feedSummary: feedSummaryPayload,
    rssXml,
  };
}
