import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const THREADS_PROFILE_URL = 'https://www.threads.com/@david888.chiang';
export const THREADS_2MD_URL = `https://2md.aiurl.tw/${THREADS_PROFILE_URL}`;
export const THREADS_ARCHIVE_LIMIT = 40;

const OWN_POST_LINK_RE = /\[([^\]]+)\]\((https:\/\/www\.threads\.com\/@david888\.chiang\/post\/([A-Za-z0-9_-]+))\)/g;
const PROFILE_AVATAR_LINK_RE = /\[!\[[^\]]*\]\([^)]*\)\]\(https:\/\/www\.threads\.com\/@david888\.chiang\)/g;
const OTHER_POST_LINK_RE = /\[([^\]]+)\]\(https:\/\/www\.threads\.com\/@(?!david888\.chiang\b)([A-Za-z0-9_.]+)\/post\/[A-Za-z0-9_-]+\)/i;
const LOGIN_FOOTER_RE = /Log in to see more from david888\.chiang/i;

function cleanMarkdownText(raw) {
  return String(raw || '')
    // Remove markdown image links [![...](...)](...) or ![...](...)
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // Unwrap regular markdown links [text](url) -> text (unless engagement/profile noise)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    // Remove bare counter lines (likes, replies, reposts)
    .replace(/^\s*\d+(?:\.\d+)?[KkMm]?\s*$/gm, ' ')
    // Strip markdown formatting symbols
    .replace(/[*_`>#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimatePublishedAt(timeLabel, nowIso) {
  const baseMs = Date.parse(nowIso) || Date.now();
  const label = String(timeLabel || '').trim();
  const relMatch = label.match(/^(\d+)\s*([smhdw])$/i);
  if (relMatch) {
    const qty = Number(relMatch[1]);
    const unit = relMatch[2].toLowerCase();
    const mult =
      unit === 's' ? 1000 :
      unit === 'm' ? 60_000 :
      unit === 'h' ? 3_600_000 :
      unit === 'd' ? 86_400_000 :
      7 * 86_400_000;
    return new Date(baseMs - qty * mult).toISOString();
  }
  const parsed = Date.parse(label);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date(baseMs).toISOString();
}

/**
 * Classifies and extracts @david888.chiang Threads blocks from 2md Markdown.
 * Strictly separates `original`, `repost`, and `unknown`.
 */
export function parseThreadsMarkdown(markdown, { now = new Date().toISOString() } = {}) {
  const source = String(markdown || '');
  const matches = Array.from(source.matchAll(OWN_POST_LINK_RE));
  if (matches.length === 0) {
    const avatarMatches = Array.from(source.matchAll(PROFILE_AVATAR_LINK_RE));
    if (avatarMatches.length === 0) {
      return {
        entries: [],
        counts: { original: 0, repost: 0, unknown: 0 },
        hasLoginWallOnly: /Log in/i.test(source),
      };
    }

    const results = [];
    const counts = { original: 0, repost: 0, unknown: 0 };
    for (let i = 0; i < avatarMatches.length; i++) {
      const startIdx = avatarMatches[i].index + avatarMatches[i][0].length;
      const nextIdx = i + 1 < avatarMatches.length ? avatarMatches[i + 1].index : source.length;
      let slice = source.slice(startIdx, nextIdx);
      const footerMatch = slice.match(LOGIN_FOOTER_RE);
      if (footerMatch && typeof footerMatch.index === 'number') {
        slice = slice.slice(0, footerMatch.index);
      }
      const cleanedText = cleanMarkdownText(slice);
      if (cleanedText.length < 15 || /^(Log in|Sign up|See more|https?:\/\/)/i.test(cleanedText)) {
        continue;
      }
      if (OTHER_POST_LINK_RE.test(slice)) {
        const otherMatch = slice.match(OTHER_POST_LINK_RE);
        const beforeOther = otherMatch && typeof otherMatch.index === 'number'
          ? cleanMarkdownText(slice.slice(0, otherMatch.index)).trim()
          : '';
        if (beforeOther.length < 10) {
          counts.repost++;
          continue;
        }
        const hash = crypto.createHash('sha256').update(beforeOther.slice(0, 100)).digest('hex').slice(0, 12);
        counts.original++;
        results.push({
          id: `md-${hash}`,
          url: THREADS_PROFILE_URL,
          classification: 'original',
          text: beforeOther.slice(0, 500),
          publishedAt: new Date(Date.parse(now) || Date.now()).toISOString(),
        });
        continue;
      }
      const hash = crypto.createHash('sha256').update(cleanedText.slice(0, 100)).digest('hex').slice(0, 12);
      counts.original++;
      results.push({
        id: `md-${hash}`,
        url: THREADS_PROFILE_URL,
        classification: 'original',
        text: cleanedText.slice(0, 500),
        publishedAt: new Date(Date.parse(now) || Date.now()).toISOString(),
      });
    }

    return {
      entries: results,
      counts,
      hasLoginWallOnly: results.length === 0 && /Log in/i.test(source),
    };
  }

  const results = [];
  const counts = { original: 0, repost: 0, unknown: 0 };

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const timeLabel = cur[1];
    const url = cur[2];
    const id = cur[3];

    const startIdx = cur.index + cur[0].length;
    const nextPostIdx = i + 1 < matches.length ? matches[i + 1].index : source.length;
    let slice = source.slice(startIdx, nextPostIdx);

    // Trim trailing login footer or next david888.chiang header
    const footerMatch = slice.match(LOGIN_FOOTER_RE);
    if (footerMatch && typeof footerMatch.index === 'number') {
      slice = slice.slice(0, footerMatch.index);
    }
    const nextOwnHeaderIdx = slice.lastIndexOf('[david888.chiang](https://www.threads.com/@david888.chiang)');
    if (nextOwnHeaderIdx !== -1) {
      slice = slice.slice(0, nextOwnHeaderIdx);
    }

    const otherMatch = slice.match(OTHER_POST_LINK_RE);
    if (otherMatch && typeof otherMatch.index === 'number') {
      const beforeOther = cleanMarkdownText(slice.slice(0, otherMatch.index))
        .replace(new RegExp(`^${otherMatch[2]}\\s*`, 'i'), '')
        .trim();

      // If no meaningful original commentary precedes the other author's post, it is a pure repost.
      if (beforeOther.length < 10) {
        counts.repost++;
        results.push({
          id,
          url,
          classification: 'repost',
          text: '',
          publishedAt: estimatePublishedAt(timeLabel, now),
        });
        continue;
      }

      // Quote post with David's original commentary before the quoted author
      counts.original++;
      results.push({
        id,
        url,
        classification: 'original',
        text: beforeOther.slice(0, 500),
        publishedAt: estimatePublishedAt(timeLabel, now),
      });
      continue;
    }

    const cleanedText = cleanMarkdownText(slice);
    if (cleanedText.length < 4 || /^(Log in|Sign up|See more)/i.test(cleanedText)) {
      counts.unknown++;
      results.push({
        id,
        url,
        classification: 'unknown',
        text: '',
        publishedAt: estimatePublishedAt(timeLabel, now),
      });
      continue;
    }

    counts.original++;
    results.push({
      id,
      url,
      classification: 'original',
      text: cleanedText.slice(0, 500),
      publishedAt: estimatePublishedAt(timeLabel, now),
    });
  }

  return {
    entries: results,
    counts,
    hasLoginWallOnly: false,
  };
}

export function mergeThreadsArchive(existingPayload, parsedEntries, nowIso) {
  const existingEntries = Array.isArray(existingPayload?.entries) ? existingPayload.entries : [];
  const originals = parsedEntries.filter((e) => e.classification === 'original' && e.id && e.text);
  const byId = new Map();

  for (const item of existingEntries) {
    if (item && item.id && item.text) {
      byId.set(item.id, item);
    }
  }

  for (const item of originals) {
    const prev = byId.get(item.id);
    byId.set(item.id, {
      id: item.id,
      url: item.url,
      text: item.text,
      publishedAt: prev?.publishedAt || item.publishedAt || nowIso,
      fetchedAt: prev?.fetchedAt || nowIso,
    });
  }

  const merged = Array.from(byId.values())
    .sort((a, b) => Date.parse(b.publishedAt || b.fetchedAt || 0) - Date.parse(a.publishedAt || a.fetchedAt || 0))
    .slice(0, THREADS_ARCHIVE_LIMIT);

  return {
    sourceUrl: THREADS_PROFILE_URL,
    syncStatus: 'ok',
    lastSyncedAt: nowIso,
    entries: merged,
  };
}

export async function syncThreadsArchive({
  fetchImpl = globalThis.fetch,
  dataDir = path.join(process.cwd(), 'data'),
  now = new Date().toISOString(),
  timeoutMs = 10_000,
} = {}) {
  const archivePath = path.join(dataDir, 'threads-archive.json');
  let existing = { sourceUrl: THREADS_PROFILE_URL, syncStatus: 'stale', lastSyncedAt: null, entries: [] };

  try {
    const raw = await fs.readFile(archivePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.entries)) {
      existing = parsed;
    }
  } catch {
    // Missing or unreadable initial archive starts empty
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(THREADS_2MD_URL, {
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });
    if (!res || !res.ok) {
      throw new Error(`2md Threads fetch failed: HTTP ${res?.status || 'unknown'}`);
    }
    const markdown = await res.text();
    const parsed = parseThreadsMarkdown(markdown, { now });

    // If zero posts could be parsed at all (login wall / layout change), keep stale archive
    if (parsed.entries.length === 0) {
      const stalePayload = {
        ...existing,
        sourceUrl: THREADS_PROFILE_URL,
        syncStatus: 'stale',
        lastSyncedAt: existing.lastSyncedAt || null,
      };
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(archivePath, `${JSON.stringify(stalePayload, null, 2)}\n`, 'utf8');
      return stalePayload;
    }

    const updated = mergeThreadsArchive(existing, parsed.entries, now);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(archivePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    return updated;
  } catch (err) {
    console.warn('Unable to sync Threads context via 2md.aiurl.tw:', err?.message || err);
    const stalePayload = {
      ...existing,
      sourceUrl: THREADS_PROFILE_URL,
      syncStatus: 'stale',
      lastSyncedAt: existing.lastSyncedAt || null,
    };
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(archivePath, `${JSON.stringify(stalePayload, null, 2)}\n`, 'utf8');
    return stalePayload;
  } finally {
    clearTimeout(timer);
  }
}
