# Design

## Context

See `proposal.md` for motivation and scope. Existing constraints verified directly in the repository:
- `App.tsx` mounts `FloatingConciergeButton` (bottom-right) and `ContactDialog` (`/contact`, `/contact/form`); `test/bento-navigation.test.mjs:99-123` currently asserts `FloatingConciergeButton` imports/styles and `bottom-20 right-6 z-40` on the Back-to-Top button in `BentoGrid.tsx`.
- `Navbar.tsx:60-86` registers a global `window` `keydown` listener for `/`, `Cmd/Ctrl+K`, and `Escape`, and `Navbar.tsx:39-43` focuses its top search input whenever `isSearchOpen` becomes `true`.
- `BentoGrid.tsx:118-133` overrides route views when `isSearching` (`searchQuery.trim().length > 0`), and uses `pb-16` (64px) on `<main>`.
- `vite.config.ts:20-46` handles `/api/contact` in dev by calling `processContactSubmission` unconditionally without branching on `action: 'chat'`.
- `.github/workflows/deploy.yml` runs on `node-version: "20"`, sets `permissions: contents: read`, runs `npm run build` (`prebuild` -> `tsc --noEmit && vite build`), does not run `npm test`, and deploys only GitHub Pages (Cloudflare Worker is deployed separately via `wrangler deploy`).
- `test/contact-api.test.mjs` imports `.ts` directly using Node 22+ type-stripping (`node --test`). Pure `.ts` helpers must use erasable TypeScript syntax (no parameter properties), and Node cannot import `.tsx` without a DOM/JSX harness.

## Goals / Non-Goals

**Goals:**
- Provide a unified sticky bottom command & concierge bar (`BottomConciergeDock`) with `/` slash commands, instant local `/search` and `/rss`, and seamless stateful handoff to `ContactDialog` (`lib/useConciergeSession.ts`).
- Keep `npm test` 100% offline, deterministic, and non-mutating against tracked `public/` files.
- Persist rolling Threads/GitHub/Feed snapshots durably across scheduled GitHub Actions runs (`data/*.json`).
- Separate informational Q&A (`mode: 'qa'`) from Double Opt-in email dispatch (`mode: 'contact'`) across Worker, `api/contact.ts`, Vite middleware, and `lib/crm.ts`.

**Non-Goals:**
- Replacing the Bento Grid homepage with a terminal/chat-only interface.
- Authenticated scraping of private social accounts or storing social cookies.
- Adding a heavy browser/DOM test framework (e.g. Playwright/jsdom) unless explicitly required later — keep pure logic & command state machines in erasable `.ts`/`.mjs` modules testable with `node --test`, and update `test/bento-navigation.test.mjs` source assertions cleanly.

## Decisions

### 1. Unified Bottom Dock (`BottomConciergeDock`), Back-to-Top Spacing & Shared Session (`useConciergeSession`)
- **Choice**:
  - Extract a shared React hook `lib/useConciergeSession.ts` (backed by pure state helpers in `lib/concierge-session.ts` testable under `node --test`) holding `{ messages, draft, mode, autoDispatched, dispatchedTo, references }`. Both `BottomConciergeDock` and `ContactDialog` consume this shared session from `App.tsx`, preventing transcript loss or duplicate confirmation sends when switching via `/contact` or `/form`.
  - Refactor `FloatingConciergeButton.tsx` (or render `BottomConciergeDock` alongside updated `test/bento-navigation.test.mjs` contracts) so there is only **one** concierge bar at the bottom (`BottomConciergeDock`), with `BentoGrid.tsx` `<main>` bottom padding increased to `pb-24 sm:pb-28` and Back-to-Top preserving `bottom-20 right-6 z-40` (with `sm:bottom-24` appended after `bottom-20 right-6 z-40` or explicit test update).
  - Standardize drawer height across all viewports to **`max-h-[60dvh]`**, and use `window.visualViewport` resize/scroll listeners on mobile to keep the sticky dock positioned cleanly above the virtual keyboard and `env(safe-area-inset-bottom)`.
  - Enforce explicit WCAG AA/AAA foreground/background pairs (`#17324d` / `#2b251a` text on `#fffdf5` / `#ffb010` surfaces; `#fff9e8` / `#ffb010` text on `#17324d` dark dock pill—never `#ffb010` text on light surfaces).

### 2. Single-Owner Global Shortcuts (`App.tsx`) & Route Command Sync
- **Choice**:
  - Add `disableGlobalShortcuts?: boolean` (or move shortcut registration out of `Navbar.tsx` into `App.tsx`) so `App.tsx` is the single global `keydown` owner.
  - Priority order:
    1. Ignore `/` and `Cmd/Ctrl+K` if `event.isComposing || event.keyCode === 229` or `document.activeElement` is `INPUT`, `TEXTAREA`, `SELECT`, or `isContentEditable`.
    2. Ignore `/` and `Cmd/Ctrl+K` when `ContactDialog` modal is open; `Escape` closes `ContactDialog` first and restores trigger focus.
    3. If `Navbar` inline search is open, `Escape` closes Navbar search; otherwise `Escape` closes the Bottom Dock drawer and returns focus to the dock input.
    4. `/` focuses Bottom Dock and inserts `/` to show the ARIA `listbox` command menu; `Cmd/Ctrl+K` focuses Bottom Dock without stealing focus to Navbar.
  - When `/commitments`, `/executive`, `/flagships` run from the dock, `App.tsx` clears `searchQuery`, closes `isSearchOpen` and the dock drawer, updates the canonical route (`window.history.pushState`, preserving `?lang=en`), and scrolls smoothly to `#bento-content` / top. `/form` sets `contactInitialTab = 'form'` and pushes `/contact/form` (`App.tsx` canonical route).

### 3. Scheduled Multi-Source Context Sync & Durable Snapshot Persistence
- **Choice**:
  - **GitHub (`scripts/github-context.mjs`)**: Fetch `https://api.github.com/users/tbdavid2019/repos?sort=pushed&per_page=30` (paginating up to 2 pages / 60 repos, filtering `fork === false` unless listed in explicit `data/github-featured.json` allowlist, keeping `david888-bento-portfolio` in repo catalog if desired while `github-activity.mjs` keeps excluding it from the activity feed) + existing `github-activity.mjs` Atom feed (`curl` replaced or wrapped with bounded `fetch` + 10s timeout). Store last-good snapshot in `data/github-context-cache.json`.
  - **Threads (`scripts/threads-context.mjs`)**: Fetch `https://2md.aiurl.tw/https://www.threads.com/@david888.chiang` (10s timeout, `Accept: text/plain`). Classify each block anchored by `@david888.chiang/post/<id>` into `original | repost | unknown`:
    - `repost`: `@david888.chiang/post/<id>` immediately followed by another `@<other>/post/<other_id>` without original David commentary.
    - `unknown`: login wall, empty text, or ambiguous layout.
    - Merge only `original` entries into `data/threads-archive.json` (deduplicated by `id`, capped at 40, using `fetchedAt` ISO timestamp as `publishedAt` fallback when relative time like `2h` cannot be resolved to an exact second). On fetch failure or login wall, mark `syncStatus: "stale"` and preserve existing `data/threads-archive.json`.
  - **Blog & Podcast (`scripts/build-site-context.mjs`)**: Fetch Blog Ghost API (latest 10) and Podcast `rss.xml` (latest 10) with 10s timeouts and `data/feed-cache.json` stale fallback.
  - **CI Persistence (`.github/workflows/deploy.yml`)**:
    - Upgrade workflow Node to `"22"` so `node --test` (including `.ts` tests) runs in CI before build.
    - Split scheduled/manual persistence cleanly: run a `sync-context` step on `schedule` / `workflow_dispatch` (with `permissions: contents: write, pages: write, id-token: write`) that updates `data/threads-archive.json`, `data/github-context-cache.json`, and `data/feed-cache.json`, and commits only `data/*.json` changes (`git diff --quiet data/ || git commit -m "chore(sync): update scheduled context snapshots [skip ci]" && git push`) *before* `npm run build` uploads the Pages artifact—eliminating stale runner resets and infinite re-triggers.
  - **Output Files & Budgets**:
    - `public/site-context.json`: `{ syncStatus, lastSyncedAt, profile, items }` strictly `<= 40,960` bytes (priority truncation: core bio + flagship catalog first, cap summaries at 140 chars, trim oldest feed items if over budget).
    - `public/feed-summary.json`: `{ syncStatus, lastSyncedAt, items }` (latest 20 deduplicated items with `{ id, source, sourceFeedUrl, title, summary, url, publishedAt, tags }`).
    - `public/rss.xml`: valid RSS 2.0 XML (latest 25 deduplicated items, RFC 2822 `<pubDate>`, `<guid>`, escaped/CDATA descriptions <= 280 chars) + `<link rel="alternate" type="application/rss+xml" href="/rss.xml">` in `index.html` + `/rss.xml` in `sitemap.xml`.
  - **Offline Testability**: All script modules accept `{ fetchImpl, outputDir, dataDir, now }`. Unit tests use fixture HTML/JSON/XML and `fs.mkdtemp` so `npm test` never touches tracked `public/` or hits live networks.

### 4. Dual-Mode Worker `/chat`, Bilingual Retrieval & Security Boundaries
- **Choice**:
  - **Bilingual Retrieval (`lib/context-retrieval.ts`)**: Tokenize ASCII words (`>= 2` chars) **plus** overlapping CJK 2-gram tokens (`[\u4e00-\u9fff]{2}`) and full substring bonus, scoring over the latest query + last 2 user turns (`K = 6`). If top score is `0`, return `matches: []` so the Q&A prompt instructs the LLM to abstain rather than hallucinate.
  - **Explicit `mode: 'qa' | 'contact'` State Machine**:
    - `mode` defaults to `'qa'` unless: (a) client passes `mode: 'contact'` (e.g. from `ContactDialog` or `/contact`), OR (b) Clef/regex detects genuine contact/consulting/recruitment/forwarding intent (`wantsContact`), OR (c) visitor already entered `'contact'` mode earlier in the session.
    - **Crucial Guard**: Presence of an email address inside a `'qa'` question NEVER triggers `processContactSubmission`, `readyToConfirm`, or `revealEmail` while `mode === 'qa'`.
    - Q&A mode uses a compact dedicated Q&A prompt (~600 chars + Top-6 context items inside `<untrusted_reference_data>` tags, total <= 2,200 tokens).
    - Server constructs `references` exclusively from the validated selected context records (`http:`/`https:` URLs only), ignoring client-supplied `systemPrompt` / `context` and never trusting model-fabricated URLs.
  - **Runtime-Safe Cache & Dev Parity**:
    - Guard `caches.default` with `typeof caches !== 'undefined' && caches?.default && typeof caches.default.match === 'function'`, rewrite `Cache-Control: public, max-age=3600` when storing in Cloudflare Cache API (overriding GitHub Pages `max-age=600`), wrap fetch in 2.5s timeout + 64 KB response cap + `try/catch` JSON parse, and degrade to an embedded minimal core bio.
    - Update `vite.config.ts` `/api/contact` middleware to dispatch `action === 'chat'` to `processConciergeChat(payload, mergedEnv)`.
    - Add basic per-isolate rate limiting / payload caps on `/chat` (<= 800 chars/msg, <= 10 messages).
    - Update `lib/crm.ts` `ConciergeChatOutput` with `mode?: 'qa' | 'contact'` and `references?: Array<{ title: string; url: string; source: string }>`, and ensure `lib/crm.ts` client fallback in `qa` mode returns catalog links instead of demanding email.

## Risks / Trade-offs

- **[Automated git push on scheduled CI runs]** → Scope `git add` strictly to `data/threads-archive.json data/github-context-cache.json data/feed-cache.json`, append `[skip ci]` to avoid re-triggering builds, and run `git pull --rebase` before push (continuing non-fatally if a concurrent push raced).
- **[Cloudflare Worker deployment vs. Pages CI]** → GitHub Pages workflow builds and tests static assets (`npm test && npm run build`), while `workers/contact-worker/` is deployed independently via `wrangler deploy` (`CLOUDFLARE_API_TOKEN` / local wrangler auth); `wrangler deploy --dry-run` verifies Worker bundling cleanly during pre-release checks, and cold-cache embedded bio ensures Worker works regardless of deploy order.
- **[Local dev without `prebuild`]** → Update `package.json` `predev` or provide graceful fallback in `BottomConciergeDock` when `/feed-summary.json` returns 404 in `vite dev`, falling back to local `lib/siteCatalog.ts` search.
