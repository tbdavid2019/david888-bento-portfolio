# Proposal

## Why

Visitors evaluating David Chiang (CTO & Technical Advisor) benefit from the fast visual scan of the Bento Grid, but the current concierge experience hides behind a bottom-right button (`FloatingConciergeButton`) and lacks live awareness of David's portfolio catalog, recent GitHub projects, Blog/Podcast feeds, and Threads posts. Meanwhile, pure chat-only sites like `miantiao.me` demonstrate how a sticky bottom command/chat bar with `/` slash commands, instant search, and RSS discovery lowers interaction friction—without sacrificing structured Bento browsing, SEO routes, or executive scannability.

## What Changes

- **Hybrid Bottom Command & Concierge Dock**: Upgrade the bottom concierge trigger into a persistent, compact sticky bottom command/chat dock (`BottomConciergeDock`) that expands upward (`max-h-[60dvh]`) on focus, slash command, or question submission, sharing conversation/draft state with `ContactDialog` via a shared session hook (`lib/useConciergeSession.ts`).
- **Slash Commands, Local Instant Search & Unified Shortcuts**: Support `/` autocomplete commands (`/help`, `/search`, `/rss`, `/contact`, `/form`, `/commitments`, `/executive`, `/flagships`, `/clear`) with local catalog + preloaded feed-summary search, unified global shortcut ownership (`/` and `Cmd/Ctrl+K` coordinated in `App.tsx` with `Navbar.tsx` yielding duplicate listeners), and RSS autodiscovery in `index.html`.
- **Scheduled Multi-Source Context & Durable Archive Sync**: Extend the scheduled GitHub Actions and discovery pipeline (`scripts/generate-discovery-files.mjs`) with durable snapshot caches (`data/threads-archive.json`, `data/github-context-cache.json`, `data/feed-cache.json`) committed on scheduled sync (`contents: write`) prior to build, aggregating GitHub REST API + Atom, Threads via `2md.aiurl.tw` (excluding reposts and unverified markup), Blog Ghost API, Podcast RSS, and Bento catalog into bounded `public/site-context.json` (< 40 KB), `public/feed-summary.json`, and `public/rss.xml`.
- **Context-Aware Dual-Mode Edge Concierge (`/chat`)**: Upgrade `workers/contact-worker/src/index.ts`, `api/contact.ts`, `vite.config.ts` dev middleware, and `lib/crm.ts` with a shared `mode: 'qa' | 'contact'` state machine, bilingual CJK/English Top-K retrieval (`lib/context-retrieval.ts`), strict untrusted-data prompt isolation, server-validated `references` pills, and non-blocking Q&A responses that never trigger Double Opt-in email dispatch unless the visitor enters contact mode.

## Capabilities

### New Capabilities
- `bottom-command-concierge`: Sticky bottom command & concierge dock UI with slash-command autocomplete, local search/RSS views, single-owner keyboard shortcuts, mobile virtual-keyboard/safe-area responsiveness, and stateful handoff to `ContactDialog`.
- `scheduled-context-sync`: Build-time and scheduled ingestion of GitHub, Threads (original-post filtered via `2md.aiurl.tw`), Blog, Podcast, and Bento catalog into bounded `public/site-context.json`, `public/feed-summary.json`, and unified `public/rss.xml` backed by durable `data/*.json` stale caches.
- `context-aware-concierge-chat`: Server-side bilingual Top-K context retrieval, Edge Cache isolation, untrusted-data prompt boundaries, abuse rate/length guards, and explicit `qa` vs. `contact` mode gating across Worker, API, Vite middleware, and client fallback.

### Modified Capabilities
<!-- No existing specs in openspec/specs/ yet -->

## Impact

- **Frontend**: `App.tsx`, `components/BottomConciergeDock.tsx`, `components/FloatingConciergeButton.tsx` (refactored/replaced cleanly with updated navigation tests), `components/Navbar.tsx`, `components/BentoGrid.tsx`, `components/ContactDialog.tsx`, `lib/useConciergeSession.ts`, `lib/crm.ts`, `index.html`.
- **Scripts, Data & CI**: `scripts/generate-discovery-files.mjs`, `scripts/github-context.mjs`, `scripts/threads-context.mjs`, `scripts/build-site-context.mjs`, `data/threads-archive.json`, `data/github-context-cache.json`, `data/feed-cache.json`, `data/github-featured.json`, generated `public/site-context.json`, `public/feed-summary.json`, `public/rss.xml`, `.github/workflows/deploy.yml` (Node 22 + `npm test` + scheduled snapshot persistence).
- **Edge Worker & Local API**: `lib/context-retrieval.ts`, `workers/contact-worker/src/index.ts`, `workers/contact-worker/wrangler.jsonc`, `api/contact.ts`, `vite.config.ts`.
- **Tests**: `test/bento-navigation.test.mjs`, `test/contact-api.test.mjs`, and offline fixture-based tests `test/context-sync.test.mjs`, `test/context-retrieval.test.mjs`, `test/bottom-concierge.test.mjs`.
