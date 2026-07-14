export const GITHUB_ATOM_FEED_URL = 'https://github.com/tbdavid2019.atom';
export const EXCLUDED_REPOSITORIES = ['david888-bento-portfolio'];

function decodeHtmlEntities(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTags(value) {
  return decodeHtmlEntities(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTagValue(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? stripTags(match[1]) : '';
}

function extractAlternateLink(source) {
  const match = source.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  return match ? decodeHtmlEntities(match[1]) : '';
}

export function isExcludedGithubActivity(entry) {
  const searchable = [entry.title, entry.url, entry.summary].filter(Boolean).join(' ').toLowerCase();
  return EXCLUDED_REPOSITORIES.some((repository) => searchable.includes(repository.toLowerCase()));
}

export function parseGithubAtomFeed(xml, { limit = 5 } = {}) {
  return Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g))
    .map((match) => {
      const entry = match[1];
      return {
        title: extractTagValue(entry, 'title'),
        url: extractAlternateLink(entry),
        updated: extractTagValue(entry, 'updated'),
        summary: extractTagValue(entry, 'content') || extractTagValue(entry, 'summary'),
      };
    })
    .filter((entry) => entry.title && entry.url)
    .filter((entry) => !isExcludedGithubActivity(entry))
    .slice(0, limit);
}

export function createGithubActivityPayload(entries, lastSyncedAt, syncStatus = 'ok') {
  return {
    entries,
    lastSyncedAt,
    syncStatus,
    excludedRepositories: EXCLUDED_REPOSITORIES,
  };
}

export function createStaleGithubActivityPayload(existingPayload, fallbackSyncedAt = null) {
  return {
    ...createGithubActivityPayload(
      Array.isArray(existingPayload?.entries) ? existingPayload.entries : [],
      existingPayload?.lastSyncedAt || fallbackSyncedAt,
      'stale',
    ),
  };
}
