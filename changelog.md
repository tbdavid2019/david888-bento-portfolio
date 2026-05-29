# Changelog

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
