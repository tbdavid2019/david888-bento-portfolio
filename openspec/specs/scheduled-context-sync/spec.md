# scheduled-context-sync Specification

## Purpose

Periodically ingests public updates from GitHub, Threads (via `2md.aiurl.tw`), Blog, Podcast, and portfolio catalog sources during scheduled CI runs and build discovery generation into bounded static context, feed summaries, and unified RSS outputs backed by durable stale-safe snapshots.

## Requirements

### Requirement: Durable snapshot persistence across scheduled CI builds
The system SHALL persist rolling archives and last-good external feed snapshots in versioned data files (`data/threads-archive.json`, `data/github-context-cache.json`, `data/feed-cache.json`) committed by a scheduled/manual CI sync step (`contents: write` scoped to `data/*.json` before Pages build, respecting the workflow concurrency group) so ephemeral CI runners accumulate history across runs and degrade gracefully on cold starts.

#### Scenario: Scheduled CI run persists new snapshots before build
- **WHEN** the scheduled or manual workflow runs in GitHub Actions and upstream fetches discover new Threads posts, GitHub repo updates, or feed entries
- **THEN** the sync step updates `data/threads-archive.json`, `data/github-context-cache.json`, and `data/feed-cache.json`, commits changes (if any) back to `main` before `npm run build` runs, and avoids recursive CI loops.

#### Scenario: First-run empty cache with unreachable upstream
- **WHEN** no prior snapshot exists and an upstream source fails during build
- **THEN** the generator emits an empty-source envelope with `syncStatus: "stale"` and `lastSyncedAt: null` without failing the build.

### Requirement: Deterministic GitHub repository and activity ingestion
The system SHALL ingest GitHub context via paginated REST API (using `GITHUB_TOKEN` when present) and Atom feed with 10s timeouts, filtering pure forks unless listed in `data/github-featured.json`, excluding `david888-bento-portfolio` from activity feed, and backing results with `data/github-context-cache.json`.

#### Scenario: GitHub API rate-limit or network timeout
- **WHEN** the GitHub REST API or Atom feed fails or times out (10s per-source timeout)
- **THEN** the generator retains `data/github-context-cache.json` and `public/github-activity.json` marked `syncStatus: "stale"` and continues without throwing.

### Requirement: Conservative Threads original-post filtering and rolling archive
The system SHALL fetch `https://www.threads.com/@david888.chiang` via `https://2md.aiurl.tw/` (10s timeout), classify parsed post blocks strictly as `original`, `repost`, or `unknown`, exclude both `repost` and `unknown` blocks from `site-context.json` and `rss.xml`, and merge deduplicated `original` posts by post ID into `data/threads-archive.json` (capped at 40 entries, newest first).

#### Scenario: Pure reposts and ambiguous blocks are excluded
- **WHEN** a Threads block links a `@david888.chiang/post/<id>` immediately to another author's post without verified original commentary by `@david888.chiang`, or matches a login-wall / unrecognized markup
- **THEN** the parser classifies it as `repost` or `unknown` and omits it from `site-context.json` and `rss.xml`.

#### Scenario: All-repost fetch vs. upstream failure
- **WHEN** `2md.aiurl.tw` returns a valid page whose visible entries are all reposts (0 new originals), OR returns an HTTP error/login wall
- **THEN** existing archived originals in `data/threads-archive.json` are preserved intact; an HTTP error or login wall sets `syncStatus: "stale"`.

### Requirement: Bounded site-context.json, feed-summary.json, and unified rss.xml
The system SHALL generate static discovery artifacts via dependency-injected helpers with <= 10s upstream timeouts: `public/site-context.json` (`<= 57,344` bytes / 56 KB, deduplicated bilingual titles, balanced per-source feed quotas), `public/feed-summary.json` (latest 20 deduplicated items), and valid RSS 2.0 `public/rss.xml` (latest 25 items).

#### Scenario: Strict 56 KB context budget, balanced feed quotas, and offline test isolation
- **WHEN** `buildSiteContext` runs against full catalog and multi-source feed datasets (`sitemap.xml` and `index.html` linked to `/rss.xml`)
- **THEN** serialized `public/site-context.json` is strictly `<= 57,344` bytes (under the Worker 64 KB cap) while retaining `blog`, `podcast`, `threads`, and `github` entries, `public/rss.xml` validates with escaped entities, and no tracked files under `public/` are modified during `npm test`.
