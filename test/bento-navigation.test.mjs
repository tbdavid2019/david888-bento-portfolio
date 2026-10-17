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
  assert.match(appSource, /window\.history\.pushState/);
  assert.match(flagshipSource, /https:\/\/bot\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/stockdata\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/news2\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/podcast\.david888\.com\//);
  assert.match(flagshipSource, /https:\/\/qi\.david888\.com\//);
});

