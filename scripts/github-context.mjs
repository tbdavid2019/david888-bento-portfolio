import fs from 'fs/promises';
import path from 'path';

export const GITHUB_USERNAME = 'tbdavid2019';
export const GITHUB_REPOS_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=30`;

export function normalizeGithubRepos(rawRepos, featuredAllowlist = []) {
  const allowSet = new Set(
    (Array.isArray(featuredAllowlist) ? featuredAllowlist : []).map((name) =>
      String(name || '').trim().toLowerCase(),
    ),
  );
  const seen = new Set();

  return (Array.isArray(rawRepos) ? rawRepos : [])
    .filter((repo) => {
      if (!repo || !repo.name || !repo.html_url || repo.private) return false;
      const lower = String(repo.name).toLowerCase();
      if (seen.has(lower)) return false;
      const isAllowed = allowSet.has(lower);
      if (repo.fork && !isAllowed) return false;
      seen.add(lower);
      return true;
    })
    .map((repo) => ({
      id: `github-repo:${repo.name}`,
      name: String(repo.name),
      fullName: String(repo.full_name || `${GITHUB_USERNAME}/${repo.name}`),
      description: String(repo.description || '').trim(),
      url: String(repo.html_url),
      homepage: repo.homepage ? String(repo.homepage).trim() : '',
      language: repo.language ? String(repo.language) : '',
      topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 8) : [],
      stars: Number(repo.stargazers_count || 0),
      fork: Boolean(repo.fork),
      featured: allowSet.has(String(repo.name).toLowerCase()),
      pushedAt: repo.pushed_at || repo.updated_at || null,
    }))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return Date.parse(b.pushedAt || 0) - Date.parse(a.pushedAt || 0);
    })
    .slice(0, 40);
}

export async function syncGithubContext({
  fetchImpl = globalThis.fetch,
  dataDir = path.join(process.cwd(), 'data'),
  token = typeof process !== 'undefined' ? process.env?.GITHUB_TOKEN || '' : '',
  now = new Date().toISOString(),
  timeoutMs = 10_000,
} = {}) {
  const cachePath = path.join(dataDir, 'github-context-cache.json');
  const featuredPath = path.join(dataDir, 'github-featured.json');

  let existing = { username: GITHUB_USERNAME, syncStatus: 'stale', lastSyncedAt: null, repos: [] };
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.repos)) {
      existing = parsed;
    }
  } catch {
    // No prior cache
  }

  let featuredAllowlist = [];
  try {
    const rawFeatured = await fs.readFile(featuredPath, 'utf8');
    const parsedFeatured = JSON.parse(rawFeatured);
    if (Array.isArray(parsedFeatured?.featuredRepos)) {
      featuredAllowlist = parsedFeatured.featuredRepos;
    }
  } catch {
    // Allowlist optional
  }

  const allRawRepos = [];
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'david888-bento-portfolio-sync',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    for (let page = 1; page <= 2; page++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(`${GITHUB_REPOS_API_URL}&page=${page}`, {
          headers,
          signal: controller.signal,
        });
        if (!res || !res.ok) {
          throw new Error(`GitHub API HTTP ${res?.status || 'unknown'}`);
        }
        const pageRepos = await res.json();
        if (!Array.isArray(pageRepos)) {
          throw new Error('GitHub API returned non-array payload');
        }
        allRawRepos.push(...pageRepos);
        if (pageRepos.length < 30) break;
      } finally {
        clearTimeout(timer);
      }
    }

    const normalized = normalizeGithubRepos(allRawRepos, featuredAllowlist);
    const nextPayload = {
      username: GITHUB_USERNAME,
      syncStatus: 'ok',
      lastSyncedAt: now,
      repos: normalized,
    };
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(cachePath, `${JSON.stringify(nextPayload, null, 2)}\n`, 'utf8');
    return nextPayload;
  } catch (err) {
    console.warn('Unable to sync GitHub repositories context:', err?.message || err);
    const stalePayload = {
      ...existing,
      username: GITHUB_USERNAME,
      syncStatus: 'stale',
      lastSyncedAt: existing.lastSyncedAt || null,
    };
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(cachePath, `${JSON.stringify(stalePayload, null, 2)}\n`, 'utf8');
    return stalePayload;
  }
}
