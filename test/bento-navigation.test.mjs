import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bentoGridSource = fs.readFileSync(new URL('../components/BentoGrid.tsx', import.meta.url), 'utf8');
const navbarSource = fs.readFileSync(new URL('../components/Navbar.tsx', import.meta.url), 'utf8');

test('provides a table of contents for category sub-sections', () => {
  assert.match(bentoGridSource, /aria-label=\{locale === 'en' \? 'Section navigation' : '子分類目錄'\}/);
  assert.match(bentoGridSource, /href=\{`#\$\{getSectionAnchorId/);
  assert.match(bentoGridSource, /id=\{section \? getSectionAnchorId/);
});

test('provides an accessible back-to-top action for long pages', () => {
  assert.match(bentoGridSource, /window\.scrollTo\(/);
  assert.match(bentoGridSource, /aria-label=\{locale === 'en' \? 'Back to top' : '回到頂端'\}/);
  assert.match(bentoGridSource, /showScrollTop/);
});

test('uses a larger type scale for portfolio browsing', () => {
  const linkCardSource = fs.readFileSync(new URL('../components/cards/BentoLinkCard.tsx', import.meta.url), 'utf8');
  assert.match(linkCardSource, /min-h-\[180px\]/);
  assert.match(linkCardSource, /text-lg font-bold[^\n]*md:text-xl/);
  assert.match(bentoGridSource, /text-base font-bold transition-colors/);
});

test('shows runtime status tooltips and local clone actions on link cards', () => {
  const linkCardSource = fs.readFileSync(new URL('../components/cards/BentoLinkCard.tsx', import.meta.url), 'utf8');
  assert.match(linkCardSource, /runtimeStatus/);
  assert.match(linkCardSource, /title=\{statusTooltip\}/);
  assert.match(linkCardSource, /repoUrl/);
  assert.match(linkCardSource, /cloneCommand/);
  assert.match(linkCardSource, /本機執行/);
});

test('provides a global work search collapsible in the navbar', () => {
  assert.match(navbarSource, /type="search"/);
  assert.match(navbarSource, /placeholder=\{locale === 'en' \? 'Search portfolio\.\.\.' : '搜尋作品、主題…'\}/);
  assert.match(bentoGridSource, /searchMatches/);
  assert.match(bentoGridSource, /搜尋結果/);
  assert.match(bentoGridSource, /清除搜尋/);
});

test('supports Canonical Routes and highlights the 5 flagship production domains', () => {
  const appSource = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const flagshipSource = fs.readFileSync(new URL('../components/FlagshipShowcase.tsx', import.meta.url), 'utf8');

  assert.match(appSource, /VALID_CANONICAL_ROUTES/);
  assert.match(appSource, /'commitments'/);
  assert.match(appSource, /'promises'/);
  assert.match(appSource, /window\.history\.pushState/);
  assert.match(flagshipSource, /https:\/\/bot\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/stockdata\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/news2\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/podcast\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/qi\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/2md\.aiurl\.tw\//);
  assert.match(flagshipSource, /https:\/\/storepulse\.david888\.com\//);
});

test('provides direct canonical route /commitments, deep-linking, and 1-click sharing', () => {
  const appSource = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const profileIntroSource = fs.readFileSync(new URL('../components/ProfileIntroduction.tsx', import.meta.url), 'utf8');
  const prerenderSource = fs.readFileSync(new URL('../scripts/prerender.mjs', import.meta.url), 'utf8');
  const discoverySource = fs.readFileSync(new URL('../scripts/generate-discovery-files.mjs', import.meta.url), 'utf8');

  // Route registration & alias mapping
  assert.match(appSource, /VALID_CANONICAL_ROUTES.*commitments/s);
  assert.match(appSource, /cleaned === 'promises'\) return 'commitments'/);

  // ProfileIntroduction deep link target, auto-expand, scroll, and 1-click copy
  assert.match(profileIntroSource, /id="commitments"/);
  assert.match(profileIntroSource, /scrollIntoView/);
  assert.match(profileIntroSource, /handleCopyLink/);
  assert.match(profileIntroSource, /複製直達連結/);
  assert.match(profileIntroSource, /\/commitments/);

  // Prerender and sitemap coverage
  assert.match(prerenderSource, /'commitments'/);
  assert.match(prerenderSource, /'promises'/);
  assert.match(discoverySource, /'\/commitments'/);
  assert.match(discoverySource, /'\/promises'/);
});

test('assigns https://stockdata.david888.com/ as the featured representative work for finance category', () => {
  const categoryConfig = JSON.parse(fs.readFileSync(new URL('../data/bento-categories.json', import.meta.url), 'utf8'));
  const links = JSON.parse(fs.readFileSync(new URL('../data/bento-links.json', import.meta.url), 'utf8'));
  const financeCategory = categoryConfig.categories.find((c) => c.id === 'finance');

  assert.equal(financeCategory?.title, '金融投資與玄學');
  assert.equal(financeCategory?.summary, '金融投資與玄學系統。');
  assert.equal(financeCategory?.featuredUrl, 'https://stockdata.david888.com/');

  const firstFinanceItem = links.find((item) => item.tag === 'finance');
  assert.equal(firstFinanceItem?.url, 'https://stockdata.david888.com/');
  assert.equal(firstFinanceItem?.flagship, true);
});

test('provides a floating LLM Concierge receptionist button with accessibility labels and coordination with back-to-top', () => {
  const conciergeSource = fs.readFileSync(new URL('../components/FloatingConciergeButton.tsx', import.meta.url), 'utf8');
  const appSource = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const bentoGrid = fs.readFileSync(new URL('../components/BentoGrid.tsx', import.meta.url), 'utf8');

  // Verify FloatingConciergeButton component exists and has required structure
  assert.match(conciergeSource, /ConciergeBell/);
  assert.match(conciergeSource, /David 的小秘書/);
  assert.match(conciergeSource, /David's Concierge/);
  assert.match(conciergeSource, /type="button"/);
  assert.match(conciergeSource, /aria-label=\{label\}/);
  assert.match(conciergeSource, /title=\{label\}/);
  assert.match(conciergeSource, /#17324d/);
  assert.match(conciergeSource, /#ffb010/);
  assert.match(conciergeSource, /animate-ping/);
  assert.match(conciergeSource, /motion-reduce:animate-none/);

  // Verify mounting in App.tsx
  assert.match(appSource, /import \{ FloatingConciergeButton \} from '\.\/components\/FloatingConciergeButton';/);
  assert.match(appSource, /<FloatingConciergeButton/);
  assert.match(appSource, /openContactDialog\('consulting', 'chat'\)/);

  // Verify coordination with back-to-top button in BentoGrid.tsx
  assert.match(bentoGrid, /bottom-20 right-6 z-40/);
});

test('renders products and flagships in balanced dual columns (md:grid-cols-2) without stretching full width', () => {
  const links = JSON.parse(fs.readFileSync(new URL('../data/bento-links.json', import.meta.url), 'utf8'));
  const linkCardSource = fs.readFileSync(new URL('../components/cards/BentoLinkCard.tsx', import.meta.url), 'utf8');

  const dualColumnTitles = [
    'Store Pulse 店面脈搏 ｜ Google Maps 多分店評價速查與避雷分析',
    '888news | 科技與 AI 新聞自動彙整系統',
    '2MD 快速閱讀、OCR 表格重建與個資去識別化引擎',
    '888-url2md (2MD) Agent Skill & API',
    '888 Stock Quant | 時間序列預測與籌碼平台',
    '888 StockBot 2.0 | 台美股估值與籌碼分析系統',
    '888 人生K線 | 八字命理可視化',
    '333 奇門遁甲',
    '台灣公司關係網路可視化',
  ];

  for (const title of dualColumnTitles) {
    const item = links.find((entry) => entry.title === title);
    assert.ok(item, `Card titled "${title}" must exist in bento-links.json`);
    assert.notEqual(item.colSpan, 2, `Card titled "${title}" should not span 2 columns`);
  }

  // BentoGrid grid container and cell styling
  assert.match(bentoGridSource, /grid grid-cols-1 gap-4 md:grid-cols-2/);
  assert.match(bentoGridSource, /cn\('min-w-0 h-full', colSpanClass\)/);

  // BentoLinkCard wrapping & overflow protection
  assert.match(linkCardSource, /flex min-w-0 flex-1 flex-wrap items-center/);
  assert.match(linkCardSource, /max-w-\[240px\] truncate/);
  assert.match(linkCardSource, /flex flex-wrap gap-1\.5/);
  assert.match(linkCardSource, /mt-auto flex flex-wrap items-center justify-end/);
});

test('renders social category in balanced dual columns (md:grid-cols-2) without overlapping or full-width wrapping', () => {
  const links = JSON.parse(fs.readFileSync(new URL('../data/bento-links.json', import.meta.url), 'utf8'));
  const profileCardSource = fs.readFileSync(new URL('../components/ProfileCard.tsx', import.meta.url), 'utf8');

  // Verify LinkedIn is permanently anchored in the ProfileCard hero header and no longer duplicated in bento-links.json
  assert.match(profileCardSource, /href="https:\/\/www\.linkedin\.com\/in\/david11111\/"/);
  const redundantLinkedIn = links.find((item) => item.tag === 'social' && item.title === 'LinkedIn');
  assert.equal(redundantLinkedIn, undefined, 'Redundant LinkedIn card must be removed from bento-links.json since LinkedIn is permanently anchored in the ProfileCard hero header');

  // Verify linkedin-under-podcast, stacked-social, and special-case helpers are eliminated
  assert.doesNotMatch(bentoGridSource, /linkedin-under-podcast/);
  assert.doesNotMatch(bentoGridSource, /stacked-social/);
  assert.doesNotMatch(bentoGridSource, /isLinkedInItem/);
  assert.doesNotMatch(bentoGridSource, /isStackedSocialItem/);
  assert.doesNotMatch(bentoGridSource, /stackedSocialTitles/);

  // Verify podcast, blog, and github cards are individual 1-column cells without md:col-span-2
  assert.match(
    bentoGridSource,
    /<div className="min-w-0 h-full">\s*<PodcastFeedCard locale=\{locale\} \/>\s*<\/div>/,
  );
  assert.match(
    bentoGridSource,
    /<div className="min-w-0 h-full">\s*<BlogFeedCard locale=\{locale\} \/>\s*<\/div>/,
  );
  assert.match(
    bentoGridSource,
    /<div className="min-w-0 h-full">\s*<GithubActivityCard locale=\{locale\} \/>\s*<\/div>/,
  );
});




