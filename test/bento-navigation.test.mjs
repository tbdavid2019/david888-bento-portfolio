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
});

test('provides direct canonical route /commitments, auto-expansion, and 1-click sharing', () => {
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


