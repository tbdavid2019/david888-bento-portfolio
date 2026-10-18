# Changelog

## [2026-10-18] - Direct Canonical Route `/commitments`, Auto-Expansion, Smooth Scroll & 1-Click Sharing

### Routing, Deep-Linking & 1-Click Sharing
- **Direct Canonical Route Support (`/commitments`, alias `/promises`, `#commitments`) (`App.tsx`, `components/BentoGrid.tsx`, `components/ProfileCard.tsx`, `components/ProfileIntroduction.tsx`)**:
  - **Full Routing Support**: Registered `'commitments'` and `'promises'` in `VALID_CANONICAL_ROUTES` and mapped `'promises'` to `'commitments'` in `normalizeRouteAlias`.
  - **Auto-Expansion on Direct Arrival**: When accessing `https://david888.com/commitments`, `/promises`, or `#commitments`, `ProfileIntroduction` automatically sets `expanded = true`.
  - **Auto Smooth Scroll**: Automatically executes `scrollIntoView({ behavior: 'smooth', block: 'start' })` with `scroll-mt-24` ensuring the 5 Commitments banner lands cleanly in the user's viewport without being occluded by the sticky navigation bar.
  - **1-Click Copy Direct Link Action**: Added a high-visibility `複製直達連結` (EN: `Copy Direct Link`) button on the 5 Commitments banner with immediate toast feedback (`直達網址 https://david888.com/commitments 已複製！可直接貼在 LINE、Telegram、信件中發送給老闆與合作夥伴。`) and visual state change (`Check` icon and green confirmation styling) for 3 seconds. Also added a companion copy button at the bottom of the expanded section.
  - **Route Preservation in BentoGrid**: Updated category route checks in `App.tsx` and `BentoGrid.tsx` to preserve `/commitments` without defaulting back to `/social`, while gracefully displaying the executive view and highlighting the executive collaboration context.

### SEO, Prerendering & Discovery Files
- **Static HTML Prerendering (`scripts/prerender.mjs`)**: Added `/commitments` and `/promises` to `canonicalRoutes`, generating `dist/commitments/index.html` and `dist/promises/index.html` with `<link rel="canonical" href="https://david888.com/commitments" />` for Cloudflare Pages server hits and social crawler rich link previews.
- **Sitemap & Discovery Coverage (`scripts/generate-discovery-files.mjs`, `scripts/llms-txt.mjs`)**: Included `/commitments` and `/promises` in `canonicalCategoryRoutes` within `public/sitemap.xml`. Added direct link entry `- 5 Core Commitments (Direct Route): https://david888.com/commitments` in `public/llms.txt` and `public/llms-full.txt`.

### Test Suite
- **Extended Test Coverage (`test/bento-navigation.test.mjs`, `test/llms-txt.test.mjs`)**:
  - Added unit test asserting `/commitments` and `/promises` canonical routes, deep link anchor `#commitments`, auto-expansion, and 1-click sharing buttons.
  - Updated `llms-txt.test.mjs` asserting direct route URL presence in LLM standard files. All 36 tests pass cleanly.

## [2026-10-18] - UI/UX Hierarchy Redesign: Elevated Hero Solution Cards with Commanding Typography

### UI/UX & Visual Hierarchy Redesign
- **Redesigned 5 Commitments into Hero Solution Cards (`components/ProfileIntroduction.tsx`)**:
  - **Identified Core UX Flaw**: Previously, the question (boss's anxiety) received a full-width background box, while David's solution (the actual selling point) was rendered as tiny 14px plain bullet text, making the answer visually recessive and easily overlooked.
  - **Created Dedicated Emerald Solution Cards**: Encapsulated each solution into an elevated, high-contrast container (`border-2 border-emerald-600/35 bg-emerald-50/70 p-5 sm:p-6 shadow-[0_4px_20px_rgba(5,150,105,0.08)]`).
  - **Added Header Bar with Verification Badges**: Equipped each card with a header bar featuring `David 的專家實戰解方` (EN: `David's Solution & Commitment`) with an emerald `CheckCircle2` icon (2.5 stroke width) and a pill badge `核心實戰承諾` (EN: `Core Deliverable`).
  - **Large Bold Solution Title**: Extracted the solution headline and rendered it in prominent, high-contrast typography (`text-base font-black sm:text-xl text-emerald-950 dark:text-emerald-100`).
  - **High-Legibility Solution Body Copy**: Upgraded solution body text from tiny 14px to a generous, readable scale (`text-base sm:text-[1.125rem] font-medium leading-[1.8] text-emerald-950/90 dark:text-emerald-50/90`), making David's real-world answers the undeniable centerpiece of the executive briefing.
  - **Refined Question Styling**: Reframed the question box into a warm amber quote card (`? 老闆心中的痛點與疑慮`), creating a natural problem-to-solution narrative arc.

## [2026-10-18] - Deep Business Architecture Realignment: Full System Audit, Open-Source Thrift & Untangling Spaghetti Flows

### Architecture & Business Alignment
- **Full Architecture Audit & Untangling Spaghetti Flows (毛線團資訊流) (`data/profile-content.zh.md`, `data/profile-content.en.md`, `components/ProfileIntroduction.tsx`, `components/ExecutiveBriefing.tsx`, `scripts/llms-txt.mjs`)**:
  - **Commitment 1 (Precision Audit & Open-Source Thrift / 精準盤查、開源節流)**:
    - *「精準盤查、開源節流：加錢堆機器誰都會，那毫無技術含金量。只用商業回報與成本效益溝通，把技術黑話翻譯成大白話；全面盤查現有架構的冗餘運算與隱性浪費，清理虛胖的雲端帳單，用最精準的資源解決實際營運卡關，絕不盲目要預算。」*
  - **Commitment 2 (Untangling Spaghetti Information Flows / 梳理毛線團、消除單點故障)**:
    - **CEO Pain Point**: *「問他何時上線，永遠說在還技術債；系統像毛線團一樣疊床架屋，串接一堆銀行、金流、優惠與渠道，動一髮動全身，一般人根本搞不定。」*
    - **David's Real-World Solution**: *「梳理毛線團、消除單點故障（SPOF）：很多團隊整天吵著要推倒重構，但真實商務場景（銀行串接、行銷優惠、多通路渠道）邏輯盤根錯節，動不了也絕不能停機。我具備操刀大型商務與金流系統的實戰底氣，能對疊床架屋的龐大系統進行全面脈絡盤查；建置健全的 Fallback 降級容錯機制，杜絕單點故障（SPOF）引發的連鎖癱瘓；並以科學的『消融試驗（Ablation Analysis）』一層層剝離變數，精準揪出真正瓶頸，在維持日常營運下完成穩健重構，不做勞民傷財的無效翻新。」*
  - **Banner Chips & Prompt Updated**:
    - Chip 2: Updated to **`✓ 梳理複雜毛線團`** (EN: `✓ Untangle Spaghetti Flows`).
    - Banner Prompt: Updated to **`「害怕被黑話唬弄？系統像毛線團疊床架屋、多方串接動不了？開口只會要錢買機器？」點擊立即解鎖 5 大安心解方與完整實績 ➔`** (EN: *"Afraid of tech jargon, tangled spaghetti architectures, or endless hardware budgets? Click to see how I eliminate business owners' biggest anxieties & view full CTO track record."*).
  - **Tech Due Diligence Scope Upgraded**: Reframed system reviews in `ExecutiveBriefing.tsx`, `profile-content.*`, and `llms-txt.mjs` around *「針對企業疊床架屋的毛線團資訊流、多方渠道串接摩擦（銀行/金流/優惠/物流）與單點故障風險進行全面盤查，以科學消融試驗揪出隱性浪費與真實瓶頸，落實開源節流」*.

## [2026-10-18] - True Enterprise CTO Core Value: Mastering Massive Complex Systems, Zero SPOF, Fallbacks & Ablation Testing

### Core Value Realignment & Architecture Grounding
- **Reframed Value Proposition from Superficial "Traffic" to True High-Stakes Enterprise Architecture (`data/profile-content.zh.md`, `data/profile-content.en.md`, `components/ProfileIntroduction.tsx`, `components/ExecutiveBriefing.tsx`, `scripts/llms-txt.mjs`)**:
  - **Eliminated Shallow Traffic Bottleneck Narrative**: Acknowledged that simple CRUD and traffic spikes are trivial issues solved by hardware/budget scaling. Realigned the narrative to the true high-stakes enterprise problem: sprawling legacy systems, dozens of third-party integrations, cascading failures, single points of failure (SPOF), and lack of graceful fallback mechanisms.
  - **Commitment 2 Overhaul (Question & Expert Solution)**:
    - **CEO Pain Point**: *「問他何時上線，永遠說在還技術債；系統越來越龐大、串接一堆外部服務，動一髮動全身，常常一個小地方壞掉整個系統就癱瘓。」* (EN: *"Always 'paying tech debt'; the system grows so massive and entangled with dozens of integrations that a single failure brings down the entire business."*).
    - **David's Expert Solution**: *「搞定龐大複雜架構、消除單點故障（SPOF）：很多 CTO 搞不定龐大系統，一出問題只會要求花幾年砍掉重練。我具備管理百人團隊操刀跨國大型商務系統的實戰經驗，擅長梳理錯綜複雜的商業邏輯與多方串接（CRM、ERP、金流、物流等），建立健全的 Fallback 降級容錯機制，徹底杜絕單點故障（SPOF）引發的連鎖癱瘓；並擅長透過科學的『消融試驗（Ablation Analysis）』一層層剝離變數、精準揪出系統真正的致命瓶頸，不做勞民傷財的無效重構。」*
  - **Banner Chips & Prompt Updated**:
    - Chip 2: Updated to **`✓ 搞定複雜防單點`** (EN: `✓ Resilient Architecture`), matching the 7-character rhythm of all 5 chips.
    - Banner Prompt: Updated to **`「害怕被黑話唬弄？龐大系統動一髮動全身？開口只會要預算？」點擊立即解鎖 5 大安心解方與完整實績 ➔`** (EN: *"Afraid of tech jargon, tangled fragile architectures, or endless budgets? Click to see how I eliminate business owners' biggest anxieties & view full CTO track record."*).
  - **Tech Due Diligence Scope Upgraded**: Reframed system reviews in `ExecutiveBriefing.tsx`, `profile-content.*`, and `llms-txt.mjs` around *「針對龐大架構多方串接摩擦、單點故障 (SPOF) 風險、資料庫效能瓶頸或跨系統資料不同步進行消融試驗與架構改善」*.

## [2026-10-18] - Complete Privacy Protection: Zero Raw Email Exposure & Enforced Verified Contact Form

### Security & Privacy Protection
- **Zero Raw Email Exposure Across Codebase & Public Discovery Files (`scripts/llms-txt.mjs`, `public/llms.txt`, `public/llms-full.txt`, `data/bento-profile.json`, `components/ContactDialog.tsx`, `test/llms-txt.test.mjs`, `data/bento-raw.md`, `data/bento_full.md`)**:
  - **Eliminated Raw Email in `llms.txt` & `llms-full.txt`**: Replaced exposed raw email with verified web contact form entry: `- Contact: Verified web contact form at https://david888.com/ (anti-spam protected, direct dispatch to David)`. Prevents automated web crawlers and LLM harvesters from scraping the email.
  - **Reset Profile Email**: Cleared `email: ""` in `data/bento-profile.json` so no `mailto:` links are exposed on public profile elements.
  - **Sanitized Contact Dialog Confirmation**: Replaced raw email address display on the submission success receipt card with `訊息已送達 David 個人信箱，將盡速與您聯繫。` (EN: `Delivered directly to David's inbox. You will receive a response shortly.`), completely safeguarding the recipient address from client-side inspection.
  - **Cleaned Data Markdown Files**: Removed raw email from `data/bento-raw.md` and `data/bento_full.md`.
  - **Updated Test Suite**: Added negative assertions in `test/llms-txt.test.mjs` verifying `Contact Email:` and raw email addresses never appear in `llms.txt`.

## [2026-10-18] - llms.txt Full Taxonomy Alignment & Eradication of "雙 11" Narrative

### Fixed & Enhanced
- **Full `llms.txt` and `llms-full.txt` Streamlining & Bug Fixes (`scripts/llms-txt.mjs`, `public/llms.txt`, `public/llms-full.txt`, `test/llms-txt.test.mjs`, `data/bento-profile.json`)**:
  - **Fixed Contact Email Bug**: Corrected the `- Contact Email:` field in `llms.txt` which mistakenly displayed the service region (`台北/高雄 可合作`) instead of the official contact email (`104@david888.com`). Added an explicit `- Location / Availability:` line displaying `台北/高雄 可合作 (Taipei / Kaohsiung / Remote collaboration)`. Set `"email": "104@david888.com"` in `data/bento-profile.json`.
  - **Added `## Ways to Work & Executive Advisory` Section**: Added the missing 2nd category (`合作方式`) directly into `llms.txt` linking to `/executive`, outlining the 3 engagement models (12-Month Advisory Retainer, CTO/VP of Engineering, Tech Due Diligence) and the 5 Commitments for Non-Technical Leaders.
  - **Full 5-Category Alignment**: `llms.txt` now precisely matches the 5 streamlined portfolio categories: `Latest Updates (最新動態)`, `Ways to Work & Executive Advisory (合作方式)`, `Finance, Quant & Metaphysics Systems (財經命理)`, `Skills & MCP Tools for LLMs & AI Agents (Skills)`, and `Productivity Apps, Tools & Interactive Visuals (其他應用)`.
  - **Updated Test Suite**: Added assertions in `test/llms-txt.test.mjs` ensuring `## Ways to Work & Executive Advisory`, `Contact Email: 104@david888.com`, and `/executive` links are strictly validated.
- **Complete Eradication of "雙 11" & Ecommerce-Centric Framing Across Codebase (`components/ProfileIntroduction.tsx`, `data/profile-content.zh.md`, `data/profile-content.en.md`, `data/profile-content.json`)**:
  - **Eradicated "雙 11" and "大檔期"**: Completely eliminated all mentions of "雙 11" and seasonal ecommerce sale campaigns from the hero banner chips, commitment text, profile content, and generated discovery files.
  - **Reframed as Mission-Critical Business Continuity & High Availability**:
    - Chip: Replaced `✓ 雙 11 大檔不當機` with **`✓ 關鍵營運不當機`** (EN: `✓ Business Continuity`).
    - Banner Prompt: Replaced `擔心大檔期當機？` with **`擔心關鍵時刻系統當機？`** (EN: `Afraid of critical system outages?`).
    - Commitment 2: Updated to **`「問他何時上線，永遠說在還技術債；一到業務高峰或關鍵活動，系統照樣當機給你看。」`** with solution **`生意優先、營運不中斷：技術重構絕不能影響日常做生意。提前做好架構瓶頸排查、分流降級與容災備援方案，以「系統高可用、守住核心營運」為最高底線。`** (EN: *"Business Continuity & High Availability: Technical refactoring must never disrupt core operations. Architect proactive failovers, graceful degradation, and load-shedding to guarantee enterprise stability and zero downtime during critical business moments."*).
    - Due Diligence: Replaced `促銷檔期流量瓶頸` with **`業務高峰流量瓶頸`** (mission-critical business peaks and operational bottlenecks).

## [2026-10-18] - Occam's Razor Metric Streamlining: 100+ Team Scale & Zero Headcount Redundancy

### Enhanced & Streamlined
- **Major Portfolio Taxonomy Streamlining to 5 Core Categories & Cross-Category Hashtag Interoperability (`data/bento-categories.json`, `data/bento-links.json`, `components/BentoGrid.tsx`, `components/cards/BentoLinkCard.tsx`, `index.css`, `App.tsx`)**:
  - **Occam's Razor Category Consolidation (8 Tabs -> 5 Tabs)**: Consolidated bloated 8-tab navigation into 5 focused, audience-first categories in requested sequence: **`最新動態` (Latest)**, **`合作方式` (Ways to Work · CTO)**, **`財經命理` (Finance & Metaphysics)**, **`Skills` (AI Agent Skills)**, and **`其他應用` (Other Apps)**.
  - **Removed Redundant "5 大主力系統" Navbar Tab**: Demoted flagships from a redundant top-level navbar tab into distinguished `🌟 主力系統` (Flagship) hero cards highlighted within their natural domains (StockBot & StockQuant in 財經命理, 888news in Skills, Podcast in 最新動態, 333 奇門遁甲 in 財經命理). Preserved canonical `/flagships` URL route for backward-compatibility.
  - **Merged Finance & Metaphysics into `財經命理`**: Unified quantitative equity analytics and Qi Men calendar decision systems under a common predictive/decision-support category (17 items total).
  - **Merged Games/XR & Utilities into `其他應用`**: Grouped experimental 3D/WebXR lab prototypes and lifestyle utilities into `其他應用` with dedicated sub-sections (35 items total).
  - **Interactive Cross-Category Hashtags (`BentoLinkCard.tsx`, `BentoGrid.tsx`)**: Upgraded all `techStack` tags to interactive `#hashtag` buttons. Clicking any hashtag (e.g. `#MCP`, `#TypeScript`, `#DCF`, `#奇門遁甲`) instantly triggers cross-category search and filtering across the entire site.
  - **Balanced 5-Column Navigation Grid (`index.css`)**: Updated CSS grid to 5 equal columns on desktop (`repeat(5, minmax(0, 1fr))`) for maximum breathing room, and an elegant 3+2 symmetrical 2-row layout on mobile (`repeat(6, minmax(0, 1fr))` with 3 items spanning 2 cols, 2 items spanning 3 cols).
- **Hero Eye-Catching Centerpiece: 5 Commitments for Non-Technical Leaders with Big Certified Seal Logo (`components/ProfileIntroduction.tsx`, `data/profile-content.zh.md`, `data/profile-content.en.md`)**:
  - **Big Eye-Catching Logo Seal (`ExecutiveCommitmentSeal`)**: Designed a prominent, high-impact SVG medallion seal (80px-96px) featuring a 5-star arc (★★★★★), a bold metallic number `5`, and a gold ribbon banner reading `安心承諾` (`PROMISES` in EN), complete with a subtle ambient pulsing aura and hover scale transition.
  - **Hero Interactive Banner Card**: Replaced the small, inconspicuous right-aligned toggle button with a full-width, high-contrast banner card. Styled with warm saffron-gold gradient & gold border in light mode and glowing deep navy in dark mode, making it an irresistible visual magnet for business owners and non-technical founders.
  - **Executive-Targeted Value Hook & Feature Chips**: Displayed the badge `🔥 老闆與主管必看 · 零技術黑話`, headline `給不諳技術老闆的「5 大安心承諾」`, and 5 high-converting feature chips (`✓ 說人話不唬弄`, `✓ 雙 11 大檔不當機`, `✓ 尊重業務不自嗨`, `✓ 聽得懂生意經`, `✓ 正派透明可驗證`), directly addressing the top 5 anxieties of business leaders.
  - **Zero-Friction Expand & Collapse UX**: Clicking anywhere on the banner card seamlessly expands the 5 commitments and full track record below it. Added a convenient bottom collapse button at the end of the section so users can easily close it without scrolling back to the top.
- **Pre-allocated Equal Column Navigation Bar (`index.css`, `components/BentoGrid.tsx`)**:
  - **Eliminated Awkward Multi-Row Wrap & Orphan Tabs**: Replaced `flex-wrap: wrap` with CSS Grid `grid-template-columns: repeat(8, minmax(0, 1fr))` on desktop viewports. This pre-allocates exact equal widths across all 8 navigation tabs, completely guaranteeing all items sit on a single horizontal row without broken wrapping or orphan tabs.
  - **Flexible In-Tab Text Wrapping**: Replaced rigid `truncate` / `nowrap` on tab labels with `break-words text-center leading-tight`, allowing text inside buttons to gracefully wrap onto 2 lines on compact widths without breaking the outer navigation bar.
  - **Symmetrical Multi-Tier Breakpoints**: Configured 8 equal columns on desktop (>=1024px), 4 equal columns on tablet (640px-1023px, 2 symmetrical rows of 4), and 2 equal columns on mobile (<640px, 4 symmetrical rows of 2), eliminating any unbalanced trailing tabs.
- **Personal Subtitle Refinement: Zero Self-Aggrandizement (`components/ProfileCard.tsx`)**:
  - Replaced the self-important phrasing *"具百人規模視野的第一線技術領袖"* with the grounded, authentic executive tagline: **`大型系統架構 ｜ 系統整合 ｜ 實戰經驗豐富技術長`** (EN: *"Enterprise Systems Architecture · Systems Integration · Experienced Hands-on CTO"*).
- **Site-Wide Headcount Scale Unification to 100+ (`data/profile-content.zh.md`, `data/profile-content.en.md`, `components/ExecutiveBriefing.tsx`)**:
  - Unified all occurrences of 70 and 300+ across the entire codebase to **`100+ 人團隊`** (100+ engineering team scale), completely eliminating cognitive confusion or conflicting metrics.
- **Sub-headline & Opening Narrative Overhaul (`data/profile-content.zh.md`, `data/profile-content.en.md`)**:
  - Sub-headline updated to: *「管理超過 100+ 人團隊，處理過大型商務系統開發和調整；懂戰略也能挽起袖子在第一線寫 Code 解決核心技術痛點。」*
  - Opening paragraph rewritten to focus purely on grounded operational facts: managing 100+ engineers, shortening RMA turnaround from days to minutes, and solving system bottlenecks with zero consultant jargon.
- **New Non-Cynical H1 Headline & SEO Alignment (`profile-content.zh.md`, `profile-content.en.md`, `index.html`)**:
  - Replaced the previous cynical phrase with the confident, positive executive headline: **`具百人團隊實戰經驗的技術長：為企業打造能扛大盤的好系統`** (EN: *"An Experienced CTO with 100+ Team Scale: Building Resilient Systems for Enterprise Growth"*), completely eliminating cynicism and passive aggressiveness.
  - Synchronized `index.html` SEO metadata (`description`, `og:description`, `twitter:description`).
- **Dedicated Executive Section: 5 Concerns Addressed for Non-Technical Leaders (`data/profile-content.zh.md`, `data/profile-content.en.md`, `components/ProfileIntroduction.tsx`)**:
  - Added dedicated section **「給企業經營層：不懂技術的老闆請看這（我如何為您免除疑慮）」** answering the 5 biggest fears of non-technical CEOs: technical jargon/runaway costs, infinite refactoring/traffic crashes, arrogance/lack of business understanding, communication disconnect, and contractor integrity/reliability.
  - Enhanced `ProfileIntroduction.tsx` to render the executive section with a gold shield banner, distinct question quote boxes with `HelpCircle`, and solution cards with `CheckCircle2`.
  - Updated the expand button label to **`展開完整 CTO 實績與給經營層的 5 大安心承諾`** for immediate executive click-through.
- **Occam's Razor Metrics Refinement (`components/ProfileCard.tsx`)**:
  - **Eliminated Duplicate Headcount Metric**: Removed the redundant middle `70 人` card, strictly abiding by the principle of "若無必要，勿增實體" (entities should not be multiplied beyond necessity) and eliminating repetitive counting.
  - **Calibrated Executive Management Scale (`100+ 人`)**: Adjusted the primary leadership metric from `300+ 人` to a grounded, non-intimidating **`100+ 人` ｜ `能帶大團隊，也能寫 Code`** (EN: `100+ Team Scale · Leads Teams & Still Codes`). This eliminates intimidation for Taiwanese enterprise employers and mid-market organizations while retaining strong executive leadership proof.
  - **Balanced 2-Column Grid Layout**: Refactored the metrics container to `grid-cols-1 sm:grid-cols-2`, evenly displaying `100+ 人` (management & execution) alongside `180+ Repos` (hands-on open source builder).
  - **Zero Startup/Entrepreneurship Mention**: Ensured no "創業" references to prevent unintended gaming/gambling associations and perfectly align with corporate in-house hiring expectations in Taiwan.

## [2026-10-17] - Contact Dialog Tone Softening & Zero-Friction UX, English Podcast Edition, and Live Catalog Updates

### Fixed & Enhanced
- **Eliminated Hero Headline Squeezing & Broken Line-Wrapping (`components/ProfileCard.tsx`)**:
  - **Full-Width H1 Hero Container**: Restructured `ProfileCard.tsx` so the H1 statement (`Turning Complex Technology into Business Results` / `把複雜的技術，轉化為看得見的商業成果`) is placed on its own dedicated full-width line with `text-balance`. It no longer competes with the 3 action CTA buttons in a narrow ~300px column, completely eliminating the unnatural 5-line English break (`Turning / Complex / Technology / into Business / Results`) and 4-line Chinese mid-word break (`把複雜的技 / 術，轉化為 / 看得見的商 / 業成果`).
  - **Balanced Engagement Mandate Pills**: Shortened and harmonized the 3 target mandate titles (e.g. `全職技術長 / 研發負責人 (CTO / VP)`), eliminating awkward compound splits ("負責" / "人") and guaranteeing uniform single/double line heights.
  - **Streamlined 3 Key Metrics Labels**: Refined the `300+ 人` label to **`能帶大團隊，也熱愛動手寫 Code`** (16 characters), achieving exact visual length balance with the other two metrics (`帶領跨國 SAP 電商工程團隊`, `GitHub 開源專案與多套線上系統`) and eliminating orphan wrapping.
- **Full-Site Copywriting Elevation: Grounded Dual-Threat Technical Leadership (`data/profile-content.zh.md`, `data/profile-content.en.md`, `data/profile-content.json`)**:
  - **Elevated Sub-Headline**: Updated the profile mission statement to clearly convey rare dual-threat capability: *「經歷過 300+ 人組織擴張與大型電商架構洗禮；既懂高階戰略協同，也能挽起袖子在第一線寫 Code 解決核心技術痛點。」* (EN: *“Proven leadership across 300+ person organizations and enterprise e-commerce platforms. Combining high-level strategic alignment with hands-on architecture and code to solve complex engineering challenges.”*).
  - **Seamless Executive & Engineering Collaboration**: Highlighted the ability to navigate both worlds effortlessly: *「無論是面對投資人與經營層討論技術戰略，還是與工程師坐在一起 Debug 與做架構 Review，都能無縫切換，把複雜的技術債轉化為穩定、高效的商業產出。」*
- **Executive Copywriting Overhaul: Zero "總經理" Titles & Grounded Management Span (`ProfileCard.tsx`, `ExecutiveBriefing.tsx`, `profile-content.zh.md`, `profile-content.en.md`)**:
  - **Completely Eradicated "曾任總經理" / "Former General Manager"**: Removed all corporate GM titles that create an unapproachable "高高在上" barrier or make hiring teams assume an ivory-tower manager who doesn't build.
  - **Repositioned 300+ Metric to Grounded, Hands-on Leadership**: Reframed the metric to **`300+ 人` ｜ `能帶大團隊，也熱愛動手寫 Code`** (EN: `300+ Org Scale · Leads Teams & Still Codes`).
  - **Emphasized Rare Dual-Threat Value**: Clearly conveys the ability to steer multi-hundred person organizations through growth bottlenecks while remaining deeply grounded and active in first-line technical execution, architecture, and code.
- **Fixed Social Bento Grid Layout Hole & Empty Slots (`components/BentoGrid.tsx`, `data/bento-links.json`)**:
  - **Eliminated Orphan Cards & Empty Grid Slots**: Fixed the gap in the 2-column social grid where un-stacked cards fell into an isolated outer grid, leaving an empty hole beside Threads.
  - **Unified 2x2 Symmetrical Grid**: Integrated all 4 active social link cards (`DAVID888 YouTube`, `DAVID888 Daily 每日放送`, `Threads: @david888.chiang`, `DAVID888 Daily 每日科技播客（英文版）`) into `isStackedSocialItem` and standardized card heights, producing a clean, gap-free 2x2 grid.
- **Contact Dialog Tone Softening & Friction Reduction (`components/ContactDialog.tsx`)**:
  - **Removed Visual Asterisks (`*`)**: Removed visual asterisks from all form labels (`姓名`, `Email`, `交流主旨`, `想討論的內容`, and custom topic input), eliminating excessive visual stress and bureaucratic feel while maintaining HTML5 `required` validation and Clef-Flash zero-shot spam protection.
  - **Humanized Header & Submit Button**: Softened the modal header from IT-ticketing tone ("把你的問題交給我") to approachable executive greeting **`與 David 交流與合作`** (EN: `Get in Touch with David`), and changed the submit button from "送出並取得服務序號" to clean and natural **`送出訊息`** (EN: `Send Message`).
  - **Diversified Subject Chips Beyond Pure Commerce**: Refactored `SUBJECT_OPTIONS` to welcome open community and developer networking instead of 100% transactional business inquiries:
    1. **`技術交流／打個招呼`** (`Tech Chat & Say Hello`) — set as friendly default
    2. **`顧問諮詢／業務合作`** (`Consulting & Business`)
    3. **`職缺邀約／演講培訓`** (`Opportunities & Speaking`)
    4. **`其他想法／隨意聊聊`** (`Other Ideas & Chat`)
- **English Podcast Edition Integration (`https://podcast.david888.com/en`)**:
  - **Bento Card**: Added a dedicated production link card in `data/bento-links.json` under the `social` category for the newly launched daily English tech podcast.
  - **Flagship Deep-Dive Sub-Links (`components/FlagshipShowcase.tsx`)**: Added `English Edition (英文版)` (`https://podcast.david888.com/en`) and `RSS 訂閱源` to the DAVID888 Daily showcase subLinks alongside bilingual script generation highlights.
  - **Live Podcast Feed Card Header (`components/cards/PodcastFeedCard.tsx`)**: Added an `EN` edition button right next to the RSS feed button for 1-click access to English episodes.
  - **AI Agent Discovery (`llms.txt`, `llms-full.txt`)**: Automatically indexed `https://podcast.david888.com/en` across all discovery manifests.
- **Disabled Unmaintained SoundOn Link (`data/bento-links.json`)**:
  - Set `"hidden": true` on `https://player.soundon.fm/p/david777/`, seamlessly filtering it out from the live Bento grid, `siteCatalog`, and `llms.txt` without deleting historical record.

### Fixed
- **Fixed English UI Truncation & Forced Navbar Wrapping (`Navbar.tsx`, `ContactDialog.tsx`, `ProfileCard.tsx`)**:
  - **Eliminated Ellipsis Squeezing ("...") in Contact Dialog**: Removed rigid `truncate` CSS from inquiry subject buttons and replaced with `min-w-0 flex-1 leading-snug`, updated subject option English labels to concise executive terminology (`IT Consulting & Advisory`, `Executive Recruitment`, `Speaking & Workshops`), and widened modal to `max-w-xl sm:max-w-2xl` for ample horizontal breathing room.
  - **Fixed Top Navbar Forced Multi-Row Wrap**: Removed `flex-wrap` from `<nav>` in `Navbar.tsx`, gave brand title container `min-w-0 flex-1`, and streamlined the English subtitle to guarantee the entire top navigation banner always remains a sleek, single-row element across all desktop and mobile viewport widths.
  - **Fixed H1 Headline 5-Line Breaking in Profile Card**: Removed restrictive `max-w-[36ch]` from `ProfileCard.tsx` and adjusted CTA layout breakpoint to `xl:flex-row`, preventing the headline (`Turning Complex Technology into Business Results`) from being crammed into an unnatural 5-line vertical strip on standard laptop screens.
- **Executive Scale Rephrasing: General Manager & 300+ Organization Leadership (`ProfileCard.tsx`, `ExecutiveBriefing.tsx`, `profile-content.zh.md`, `profile-content.en.md`)**:
  - Replaced ambiguous, passive phrasing ("曾管理科技與工程組織規模") with direct, authoritative executive record: **`曾任總經理 · 管理 300+ 人組織`** (`Former GM · Led 300+ Staff Org`) and metric value **`300+ 人`**.
- **Streamlined 3-Column Hard Metrics Ribbon (`ProfileCard.tsx`)**:
  - Removed the non-numerical "SAP · CRM" item from the hero metrics bar, ensuring 100% of items are concrete, indisputable hard numbers: **`300+ 人`**（曾任總經理 · 管理 300+ 人組織）、**`70 人`**（帶領跨國 SAP 電商工程團隊）、**`180+ Repos`**（GitHub 開源專案與多套線上系統）。
  - Switched the container grid to `sm:grid-cols-3`, providing a clean, balanced 1:1 visual symmetry with the 3 engagement mandate pills directly above it.
### Added
- **Floating Labels (方案 B: 浮動標籤) in Contact Form (`components/ContactDialog.tsx`)**:
  - Implemented sleek, space-saving floating labels for `Name`, `Email`, `Company`, and `Message` fields (plus custom subject input).
  - Labels sit inside inputs when empty and smoothly animate to the top edge (`top-1.5`, `text-[11px] font-bold text-primary`) upon focus or when containing text.
  - Completely eliminates external label margins, saving over ~70px of vertical space and keeping the modal dialog compact and scroll-free on mobile and desktop screens.
- **Typography Upgrade: JetBrains Mono (English) + Gen Jyuu Gothic (Traditional Chinese)**:
  - Standardized English typography across the site to `JetBrains Mono` paired with local `Gen Jyuu Gothic` (源柔黑體) and `Noto Sans TC` fallback across `index.html`, `index.css`, and `tailwind.config.js`.
  - Added font preload for `/fonts/GenJyuuGothic-Medium.woff2` in `index.html` to eliminate layout shift and provide instantaneous rendering with 100% Traditional Chinese glyph coverage.
- **2md.aiurl.tw Family Visual Architecture (`Option A`)**: Replaced the split-screen Bento layout with the single-axis centered dossier container (`.dossier-shell`, `width: min(1080px, calc(100% - 32px))`), Saffron (`#ffb010`) full-bleed header with the `888 DAVID` badge, Deep Blue (`#17324d`) sticky section navigation bar (`.section-nav-bar`), Warm Cream (`#fff9e8`) dossier cards, and crisp `2px` borders.
- **Canonical Routes Direct Navigation (`Canonical Routes 直達`)**:
  - Supported direct path routes (`/executive`, `/advisory`, `/flagships`, `/finance`, `/products`, `/agent-skills`, `/experiments`, `/metaphysics`, `/social`) as well as hash and query routes.
  - Updated `scripts/prerender.mjs` to generate static HTML route entrypoints (`dist/<route>/index.html`) with route-specific `<link rel="canonical">` tags for 200 OK direct access on static hosting.
- **5 Flagship Production Systems Deep-Dive (`components/FlagshipShowcase.tsx`)**:
  - Dedicated architectural showcase for `bot.david888.com` (888 StockBot 2.0), `stockdata.david888.com` (888 StockQuant with TimesFM & Timestral), `news2.david888.com` (888news 100+ source AI intelligence radar), `podcast.david888.com` (DAVID888 Daily automated neural TTS podcast pipeline), and `qi.david888.com` (333 Qi Men Dun Jia high-DAU deterministic calendar & AI decision engine).
- **888news Remote MCP Server (5 Agent Tools) & Universal MCP Configuration (`https://news2.david888.com/api/mcp` & `https://news2.david888.com/agent`)**:
  - Added dedicated Streamable HTTP Remote MCP integration for `888news` in both the 5 Flagship Systems deep-dive (`components/FlagshipShowcase.tsx`) and the AI Agent Skills catalog (`data/bento-links.json`, `components/cards/BentoLinkCard.tsx`).
  - Provides direct 1-click copy for the remote endpoint (`https://news2.david888.com/api/mcp`), universal JSON configuration (`mcpServers.news888`), CLI installation command, and direct link to the Agent Integration Guide (`https://news2.david888.com/agent`) for calling the 5 tools (`news888_get_latest`, `news888_search`, `news888_get_hot_topics`, `news888_get_story`, `news888_get_daily`).
- **Clef-Flash System One Spam & Scam Guard (`Option A: Direct Hard Shield with 3-Tier Resilient Fallback`)**:
  - Integrated the Cloudflare Clef-Flash Decision API with a 3-tier high-availability fallback architecture across frontend (`components/ContactDialog.tsx`, `lib/clef-guard.ts`) and backend edge workers (`workers/contact-worker/src/index.ts`, `api/contact.ts`):
    - **Tier 1 (Primary)**: `https://clef.create360.ai/v1/systemone`
    - **Tier 2 (Fallback 2)**: `https://clef.aiurl.tw/v1/systemone` (Clef-Flash-Q4 backup node)
    - **Tier 3 (Fail-Open)**: If both nodes time out or encounter issues, the system fails open (allows normal message delivery), guaranteeing genuine business inquiries are never blocked.
  - Automatically classifies incoming inquiries using zero-shot `choice` decision (`legitimate_inquiry` vs `spam_or_scam`).
  - When spam, casino, SEO solicitation, crypto pump, or bot noise is detected, activates the **Option A Direct Hard Shield** (`🛡️ 系統安全防護：此內容未通過安全性檢驗，已被系統自動屏蔽拒絕發送。`), completely blocking email dispatch and preventing Resend quota consumption and mailbox spam.
  - Zero personal email addresses or contact details are leaked in the block message.
- **Removed All Redundant Input Placeholders (`components/ContactDialog.tsx`)**:
  - Eliminated redundant and noisy placeholder text (`您的姓名或稱呼`, `contact@yourdomain.com`, `例如：某某科技...`, `請描述您的諮詢需求...`) from the contact form inputs, delivering a clean, modern, and uncluttered executive interface.
- **Accurately Reflected 180+ Open-Source GitHub Repositories & 5 Flagship Live Systems**:
  - Updated `ProfileCard.tsx` key metrics ribbon from the understating `5 套系統` to **`180+ Repos` ｜ `GitHub 開源專案與多套線上系統`** with a direct link pointing to `https://github.com/tbdavid2019?tab=repositories`.
  - Updated `FlagshipShowcase.tsx` and `BentoGrid.tsx` navigation to **「精選 5 大主力線上系統（*.david888.com）」**, explicitly noting they are selected from over 180+ open-source repositories and production tools.
  - Updated `data/profile-content.zh.md` and `data/profile-content.en.md` to highlight both the 180+ GitHub repos and the 5 flagship live systems.

### Changed
- **Mobile RWD & Typography Overhaul**:
  - Eliminated the broken 35%/65% fixed sidebar overlap and removed the unreadable 2-column CSS newspaper layout (`column-count: 2`) on `.profile-introduction-body`.
  - Fixed mobile horizontal overflow and text truncation in `FlagshipShowcase.tsx`, `BentoLinkCard.tsx`, `ProfileCard.tsx`, and `ExecutiveBriefing.tsx`: switched the 3-column metrics banner in `ExecutiveBriefing.tsx` from `grid-cols-3 truncate` to responsive `grid-cols-1 sm:grid-cols-3` with `break-words` so long values (`數天縮短至數分鐘`) never get cut off on mobile; added full-width responsive action button groups (`w-full sm:w-auto`), 2-column mobile grid for MCP copy buttons with `min-h-[38px]` touch targets, `min-w-0 max-w-full break-all` on long MCP endpoint URLs and CLI commands, and `break-words [overflow-wrap:anywhere]` on card highlight lists.
  - Replaced global monospace prose with `'Outfit', 'Noto Sans TC', sans-serif` while reserving `'Fira Code', 'JetBrains Mono', monospace` strictly for metrics, URLs, domains, and tech stack badges.
  - Responsive sticky navigation bar automatically switches to a 2-column grid with `min-height: 44px` touch targets on mobile screens (`< 768px`).
- **Dead Hugging Face Space & Broken Link Filtering**:
  - Marked paused/sleeping Hugging Face Spaces and unreachable `http://git-gl.david888.com:5678/` with `"hidden": true` in `data/bento-links.json` and filtered them out of `siteItems`, `llms.txt`, and `llms-full.txt` so visitors only see live, working production systems.

## [2026-09-16] - Resend API Contact Dispatch, Turnstile & Submission Receipt

### Added
- **Full Submission Receipt for Senders**: The contact dialog now presents a complete post-submission receipt including service tracking number (`CS-YYYYMMDD-XXXX`), sender name, email, company, subject, and message content, with a 1-click clipboard copy feature.
- **Subject Option Chips (打勾選項)**: Replaced free-form subject input with 4 interactive category chips:
  - `資訊顧問／工商合作` (IT Consulting & Business Cooperation)
  - `獵頭招募／職缺邀約` (Recruitment & Job Opportunity)
  - `技術演講／企業培訓` (Keynote & Tech Workshop)
  - `其他合作提案` (Other Inquiries with optional custom note input)
- **Cloudflare Turnstile Bot Protection**: Added `components/TurnstileWidget.tsx` for Turnstile verification on modal form open, validated via `challenges.cloudflare.com/turnstile/v0/siteverify` in edge and backend handlers.
- **Cloudflare Edge Worker Dispatcher**: Added `workers/contact-worker/` to run standalone on Cloudflare Edge, verifying Turnstile and sending emails to `104@david888.com` via Resend API with 0% Firebase dependency.
- **Vite Dev Server Middleware & Local Runner**: Added dev server interceptor for `/api/contact` in `vite.config.ts` and `api/contact.ts` enabling local testing with `RESEND_API_KEY`.
- **Automated Fallback Architecture**: `lib/crm.ts` now calls the Cloudflare Worker first; if unreachable or failing, it automatically falls back to Firebase Cloud Functions (`createContactTicket`).
- **Resend Support in Firebase Cloud Functions**: `functions/index.js` now also supports `RESEND_API_KEY` as preferred mailer before falling back to Gmail SMTP (`nodemailer`).
- **Contact API Unit Tests**: Added unit tests in `test/contact-api.test.mjs` verifying input sanitization, ticket number generation, Turnstile token verification, and fallback behavior.

### Changed
- **Admin Recipient Email**: Changed default admin contact notification email from `ray168j@gmail.com` to `104@david888.com`.

## [2026-09-10] - QAC-MAN Playable QR Card & Collapsible Navbar Search

### Added
- Added **QAC-MAN 8-bit 吃豆人互動 QR 名片** to `ProfileCard`:
  - Scannable QR maze targeting `david888.com` using Level-H error correction.
  - Playable directly in-browser with arrow keys / WASD or touch gestures.
  - Muted audio (`&mute=1`) to prevent autoplay noise.
  - Collapsible inline view and an expandable full-screen arcade modal.

### Changed
- Refactored global search from an intrusive standalone row into a compact, collapsible action in `Navbar`:
  - Default state is an icon button alongside language and theme switches.
  - Expands smoothly on click or via `/` and `Cmd+K` / `Ctrl+K` shortcuts.
  - Pressing `Esc` or clicking close collapses the search input.
  - Main portfolio grid begins cleanly with Category Tabs.

## [2026-09-02] - Security Audit & Access Control Hardening

### Added
- Installed `cloudflare/security-audit-skill` in `.agent/skills/security-audit/` for continuous repository security auditing and vulnerability verification.

### Security
- **Firestore Admin Authorization**: Enforced `request.auth.token.email_verified == true` requirement in `firestore.rules` and `functions/index.js` to prevent authorization bypass via unverified email accounts.
- **Email Injection Sanitization**: Added CRLF (`\r\n`) stripping for single-line contact form inputs in `functions/index.js` (`createContactTicket`).
- **Announcement Link Validation**: Added protocol whitelist validation (`http:`, `https:`, `/`) for homepage announcement links in `components/AnnouncementBar.tsx`.

## [2026-09-01] - Finance & Investment Category Reorganization

### Added
- Created dedicated top-level **財經投資 (Finance & Investment)** category (`finance`) for all stock analysis, AI hedge fund models, quantitative decision platforms, and finance bots.
- Added **888 StockBot** (`https://bot.david888.com/`) with TradingView charts, real-time quotes, and 2MD search integration.
- Added **888 Stock Quant** (`https://stockdata.david888.com/`) for multi-dimensional quantitative decision-making, LSTM price prediction, and institutional flow analysis.
- Added automated taxonomy and regression tests for the finance category and project grouping.

### Changed
- Reorganized existing finance and stock market projects into the `finance` category:
  - `台灣公司關係網路可視化` -> `企業與投資網路`
  - `888 StockBot` & `888 Stock Quant` -> `Web 產品與分析平台`
  - `選出潛力股 | 投資新聞濃縮包 | 333` -> `選股與新聞分析`
  - `Telegram: 股靈精怪 Stock` & `Telegram: 投資新聞濃縮包` -> `Telegram 投資機器人`
  - `HF: 股神 AI 投資公司`, `台股預測 (HF Space)`, `HF: Stock Top Wick`, `股市K線判別` -> `AI 投資研究與模型`
- Regenerated `llms.txt`, `llms-full.txt`, and discovery files to reflect the new category taxonomy.

## [2026-08-26] - Portfolio Readability, Navigation, and Catalog Cleanup

### Added
- Added larger typography across portfolio cards, category headers, announcement copy, and the live Podcast, Blog, and GitHub cards.
- Added a sub-category table of contents for long category pages.
- Added an accessible back-to-top button that appears after scrolling.
- Added a global portfolio search for finding works by title, description, category, or topic.
- Added regression tests for category placement, typography, section navigation, and the back-to-top action.

### Changed
- Moved `333 Taiwanese TTS Hub` into `研究與實驗 > 語音與語言`, alongside `HF: 台語 TTS`.
- Moved lifestyle side projects into `命理與生活 > 生活型 Side Projects`.
- Kept the homepage's auto-updating Podcast, Blog, and GitHub Activity layout unchanged.
- Added `[暫停]` and `[休眠]` status labels with hover tooltips to Hugging Face Space cards.
- Added a `本機運行` source link and `git clone` tooltip for Taiwan Tender so users can run the paused Space locally.

### Removed
- Removed the retired `HF: Docs 轉 MD Markdown` entry for `hg-markitdown`.
- Removed the inaccessible `HF: Pdf2quiz 考卷產生器` entry after its Hugging Face endpoint returned HTTP 401.

## [2026-08-24] - WebMCP Capability Tools

### Added
- Added a structured public capability catalog for David's consulting and engineering services.
- Added WebMCP tools for capability search, goal-based recommendations, capability/project details, and opening the contact form.
- Added keyword-aware ranking for Traditional Chinese and English capability searches.
- Added automated tests for WebMCP capability matching and result ranking.

### Changed
- Updated WebMCP registration to use the current `document.modelContext.registerTool()` API.
- Removed the deprecated `navigator.modelContext` registration fallback.

### Notes
- WebMCP requires a supported Chrome experiment or origin trial and a secure browsing context.
- `open_contact_form` opens the form for user review; it does not submit a contact request automatically.

## [2026-08-20] - 888 Paper Daily Research Radar & Skill Addition

### Added
- **888每日論文雷達 (Paper Daily)**: Added 888 Paper Daily (`https://tbdavid2019.github.io/paper-daily/`) to the AI applications catalog. It tracks Embodied AI and machine learning papers across arXiv, HuggingFace, and Semantic Scholar with daily LLM summaries.
- **論文雷達技能 (Daily Paper Scout Skill)**: Added Paper Daily Agent Skill (`https://github.com/tbdavid2019/paper-daily`) under Developer Skills for autonomous academic research workflows.

## [2026-08-10] - Mobile RWD UX Optimization & Featured Work Selection Fix

### Fixed
- **Featured Work Customization**: Configured exact representative works for categories based on user requirements:
  - **個人入口 (social)** ➔ `Podcast: DAVID888商業報告[Oli家]`
  - **實用工具 (tools)** ➔ `David888 Wiki 團隊知識庫` (`https://wiki.david888.com/`)
  - **AI 應用 (ai)** ➔ `台灣公司關係網路可視化` (`https://taiwan-company-network.david888.com/`)

### Added
- **Mobile Collapsible ProfileCard**: Added expandable/collapsible toggle button for `ProfileCard` on mobile screens (`<lg`), defaulting to a compact card so category content is immediately visible.
- **Auto Smooth Scroll on Category Switch**: Added smooth auto-scroll to the category section (`scroll-mt-28`) on mobile when tapping top category tabs, preventing the view from staying stuck at the top bio.
- **llms.txt Standard Support**: Added `/llms.txt` and `/llms-full.txt` generator adhering to the [llmstxt.org](https://llmstxt.org/) specification for LLM inference discoverability.
- **Discovery & SEO Injections**: Updated `generate-discovery-files.mjs`, `robots.txt`, `sitemap.xml`, and `<head>` HTML metadata to reference `/llms.txt` and `/llms-full.txt`.

## [2026-08-10] - 888-url2md Addition & 888box Naming Update

### Added
- **888-url2md Web Reader**: Added 888-url2md (`https://create360.ai`) under "實用工具" (Handy Tools) section for converting web pages & search results to clean Markdown.

### Changed
- **888box Title Update**: Renamed "888box 統一資產管理" to "888box 檔案中心" (888box File Center) to reflect updated project branding.

## [2026-07-20] - Modern UI Updates & Framer Motion Integration

### Added
- **Framer Motion Integration**: Introduced `framer-motion` for fluid spring animations, adding staggered layout transitions and micro-interactions.
- **Spotlight Hover Effect**: Added a cursor-tracking spotlight glow effect and SVG noise overlay to `CardWrapper.tsx` for a premium, Apple-like frosted glass feel.
- **Segmented Tabs**: Replaced the square category buttons with a modern, pill-shaped segmented tab control that spans full width above the main content grid.
- **Layout Animations**: Applied `AnimatePresence` for smooth layout transitions when switching categories.

### Changed
- **Category Navigation Alignment**: Moved the category tabs to the top of the grid and aligned them to the right, resolving the disjointed layout feel and providing more space for longer English category names.

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
