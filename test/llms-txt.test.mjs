import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLlmsTxt, buildLlmsFullTxt } from '../scripts/llms-txt.mjs';
import categoryConfig from '../data/bento-categories.json' with { type: 'json' };

const mockProfile = {
  name: 'David Chiang',
  contactLine: '104@david888.com',
};

const mockContent = {
  zh: {
    headline: '把複雜的技術債，轉化為看得見的商業價值',
    subHeadline: '系統越長越大，資料卻四分五裂？',
    body: [
      { kind: 'paragraph', text: '我是具備跨國企業實戰經驗的 CTO 與技術顧問。' },
      { kind: 'sectionTitle', text: '我專注幫你做到三件事' },
      { kind: 'bullet', text: '看清技術路線的真實風險與機會' },
      { kind: 'note', text: '合作方式：正職｜兼職｜顧問' },
    ],
  },
  en: {
    headline: 'Transforming complexity into execution and business value',
    subHeadline: 'Growing systems with fragmented data?',
    body: [
      { kind: 'paragraph', text: 'A CTO & Technical Advisor specializing in tech debt refactoring.' },
    ],
  },
};

const mockLinks = [
  {
    type: 'link',
    title: 'David888 Blog',
    titleEn: 'David888 Blog',
    description: '技術文章與系統架構思考',
    descriptionEn: 'Technical articles and system architecture insights',
    url: 'https://blog.david888.com/',
    tag: 'social',
  },
  {
    type: 'link',
    title: '小濃縮 Quick Summary',
    description: '網頁 AI 摘要外掛',
    url: 'https://chromewebstore.google.com/detail/example',
    tag: 'products',
  },
  {
    type: 'link',
    title: '奇門遁甲系統',
    description: '命理與易數計算',
    url: 'https://qi.david888.com/',
    tag: 'metaphysics',
  },
];

test('buildLlmsTxt strictly conforms to llmstxt.org spec structure', () => {
  const result = buildLlmsTxt({
    profile: mockProfile,
    links: mockLinks,
    content: mockContent,
    siteOrigin: 'https://david888.com',
    categories: categoryConfig.categories,
  });

  // Spec check 1: Starts with an H1 heading for the site/person
  assert.match(result, /^# David Chiang \(David888\)/);

  // Spec check 2: Has blockquote for short summary
  assert.match(result, /> 把複雜的技術債，轉化為看得見的商業價值/);

  // Spec check 3: Contains H2 sections for category file lists
  assert.match(result, /## Latest Updates/);
  assert.match(result, /## Products & Work/);
  assert.match(result, /## Qi & Life Products/);

  // Spec check 4: Contains list links in standard [name](url): description format
  assert.match(
    result,
    /- \[David888 Blog \(David888 Blog\)\]\(https:\/\/blog\.david888\.com\/\): 技術文章與系統架構思考/,
  );
});

test('buildLlmsFullTxt appends full profile and item catalog details', () => {
  const fullResult = buildLlmsFullTxt({
    profile: mockProfile,
    links: mockLinks,
    content: mockContent,
    siteOrigin: 'https://david888.com',
    categories: categoryConfig.categories,
  });

  assert.match(fullResult, /# Full Profile & Background Context/);
  assert.match(fullResult, /## About David Chiang \(Traditional Chinese\)/);
  assert.match(fullResult, /## About David Chiang \(English\)/);
  assert.match(fullResult, /## Detailed Item Catalog/);
  assert.match(fullResult, /### David888 Blog \/ David888 Blog/);
});
