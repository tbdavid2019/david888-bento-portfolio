import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const navbarSource = fs.readFileSync(new URL('../components/Navbar.tsx', import.meta.url), 'utf8');

test('collapses the contact action to an icon on narrow screens', () => {
  assert.match(navbarSource, /h-10 w-10[^"\n]*sm:w-auto/);
  assert.match(navbarSource, /px-0[^"\n]*sm:px-4/);
  assert.match(navbarSource, /<span className="hidden sm:inline">/);
  assert.match(navbarSource, /aria-label=\{locale === 'zh' \? '聯絡我' : 'Contact me'\}/);
});
