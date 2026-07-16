# Changelog

## [2026-07-17] - Production Tailwind CSS Migration

### Changed
- **Tailwind CSS Compilation**: Migrated from the development-only Tailwind playground CDN (`cdn.tailwindcss.com`) to the compiler-optimized `@tailwindcss/vite` plugin for build-time compilation.
- **Project Styles**: Fixed an invalid `@apply` transition statement in `index.css` to comply with standard Tailwind CSS v4 compiler requirements.
- **Index HTML Clean Up**: Removed inline Tailwind configurations and CDN script tags from `index.html`, reducing HTML overhead.

## [2026-07-16] - WebTalk Tool Addition

### Added
- **WebTalk 333 Tool**: Added WebTalk real-time chat tool to the "實用工具" category with bilingual descriptions.

## [2026-07-16] - YouTube Playlist Addition and Threads Fix

### Added
- **DAVID888 Daily YouTube**: Added new "DAVID888 Daily 每日放送" YouTube playlist link to personal entry section.

### Changed
- **Threads Link Fix**: Fixed mismatched title in stacked social titles to properly match "Threads: @david888.chiang".

## [2026-07-16] - WebTalk Chat Integration

### Added
- **WebTalk Chat**: Integrated WebTalk AI chat widget into the homepage for real-time visitor engagement.
- **Chat Script**: Added the WebTalk JavaScript library with async loading to avoid blocking page render.

## [2026-07-14] - Firebase CRM and Homepage Operations

### Added

- **Firebase CRM**: Connected the site to the `aicreate360-official-web-stg` Firebase project and its `david888-crm2` web app.
- **Contact Form**: Replaced the public email button with a contact form that creates a `CS-YYYYMMDD-0000` service number.
- **CRM Admin Console**: Added `/?admin=1` for authenticated ticket management, customer replies, and homepage announcement editing.
- **Homepage Announcements**: Added a Firestore-backed announcement bar above the homepage categories, with external links opening in a new tab.
- **SMTP Notifications**: Added Firebase Secret Manager bindings for Gmail SMTP so new tickets and admin replies can send email without exposing credentials in the repository.
- **GitHub Activity Sync**: Added a daily GitHub Actions refresh, retained stale data when GitHub is unavailable, and excluded `david888-bento-portfolio` from the activity feed.

### Changed

- **Profile Content**: Moved the long-form profile copy into maintainable Markdown source files instead of hardcoding the content in React data structures.
- **Category Navigation**: Converted category counts into iPhone-style notification badges and kept each category button as a fixed square.
- **Social Layout**: Positioned LinkedIn below the Podcast commercial report card.
- **Blog Feed**: Rendered feature images for all three live blog posts and aligned the feed content to the top of its card to avoid large empty gaps.
- **Public Contact Surface**: Removed the visible `104@david888.com` link from the homepage in favor of the contact form.

## [2026-07-08] - Live Podcast Feed Card

### Added
- **Live Podcast Feed Card**: Added a new featured podcast card in the `social` category that fetches `https://podcast.david888.com/rss.xml` client-side and renders the latest episodes directly on the homepage.
- **Inline Audio Playback**: Added in-card audio playback for the newest podcast episode using the RSS `enclosure` MP3 URL.
- **Live Blog Feed Card**: Added a blog activity card in the `social` category that fetches the latest Ghost posts via the public Content API and surfaces recent articles on the homepage.
- **GitHub Activity Feed Card**: Added a GitHub activity card backed by a build-time snapshot of `https://github.com/tbdavid2019.atom`, showing recent public activity without relying on browser-side CORS access.

### Changed
- **Social Category Hero Content**: Promoted the latest podcast episode into a larger featured card with summary text and direct episode access, making the homepage feel more active and less repetitive.
- **Fallback Behavior**: Added graceful fallback UI when the podcast RSS cannot be loaded, so the page still renders cleanly.

## [2026-07-07] - Agent Discovery, Robots, and Sitemap

### Added
- **Robots Exclusion Protocol**: Added `/robots.txt` at the site root with explicit `User-agent`, `Allow`, and `Disallow` rules, plus a `Sitemap` reference.
- **Sitemap Publishing**: Added auto-generated `/sitemap.xml` with canonical URLs for the homepage and agent discovery documentation.
- **Agent Discovery Endpoints**: Added `/.well-known/api-catalog` and `/docs/api/` to advertise machine-readable and human-readable discovery resources.
- **Static Host Header Configs**: Added `public/_headers` and `vercel.json` so hosts that support custom headers can emit `Link` headers for `api-catalog` and `service-doc`.
- **GitHub Pages Compatibility**: Added `public/.nojekyll` to ensure dot-prefixed discovery assets under `/.well-known/` are published correctly.

### Changed
- **Build Pipeline**: Added `scripts/generate-discovery-files.mjs` and wired it into the `prebuild` step so `robots.txt`, `sitemap.xml`, and the API catalog stay current on publish.
- **Homepage Metadata**: Added canonical and discovery `<link>` relations in `index.html` for crawlers and agent clients that inspect document metadata.

## [2026-05-28]

### Added
- **888box 統一資產管理**: Added the open-source Dropbox-like storage and asset management application under the "Handy Tools" section.
- **888desturl 最終目的地網址追蹤**: Added the redirect trace application under the "Handy Tools" section.
- **Custom SVG Assets**: Added/cached custom SVG logos for `888box` (`/public/bento/888box.svg`) and `888desturl` (`/public/bento/888desturl.svg`) for optimized loading.

## [2026-04-22] - Bento Design System & Categorization Update

### Added
- **LLM Developer Skills**: Added 5 new high-density developer skill cards optimized for AI agents:
  - LINE Docs Skill
  - OpenClaw Docs Skill
  - SAP Spartacus Docs Skill
  - Telegram Docs Skill
  - Hermes Agent Docs Skill
- **Card Descriptions**: Enhanced `BentoLinkCard` to display descriptions, providing more context for each project/link.
- **Section Headers**: Added sticky headers and visual dividers to separate content into logical thematic groups.

### Changed
- **Bento Design System Migration**: 
  - Updated color palette to Primary Apricot (`#FAD4C0`) and warm Surface tones (`#FFF5E6`).
  - Refined typography hierarchy and spacing rhythm.
  - Implemented modern UI elements: `rounded-3xl` corners, layered shadows, and glassmorphism effects.
- **Tag-Based Categorization**: 
  - Migrated from hardcoded logic to a scalable `tag` system in `bento-links.json`.
  - Content is now organized into: Social & Content, LINE Bots, Telegram Bots, AI Apps, Handy Tools, Extensions, and Dev Skills.
- **Sticky Profile**: The `ProfileCard` is now sticky on large screens for constant access to bio and contact info.
- **Costco Link**: Updated the Costco tool URL to `https://cost.david888.com/`.

### Optimized
- **Responsive Layout**: Improved grid behavior across mobile, tablet, and desktop viewports.
- **Visual Contrast**: Enhanced icon backgrounds and border aesthetics for better scannability.
- **Performance**: Optimized image rendering and transition animations.
