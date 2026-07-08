# Changelog

## [2026-07-08] - Live Podcast Feed Card

### Added
- **Live Podcast Feed Card**: Added a new featured podcast card in the `social` category that fetches `https://podcast.david888.com/rss.xml` client-side and renders the latest episodes directly on the homepage.
- **Inline Audio Playback**: Added in-card audio playback for the newest podcast episode using the RSS `enclosure` MP3 URL.

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
