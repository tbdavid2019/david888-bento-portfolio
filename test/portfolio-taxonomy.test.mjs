import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const categoryConfig = JSON.parse(fs.readFileSync(new URL('../data/bento-categories.json', import.meta.url), 'utf8'));
const links = JSON.parse(fs.readFileSync(new URL('../data/bento-links.json', import.meta.url), 'utf8'));
const bentoGridSource = fs.readFileSync(new URL('../components/BentoGrid.tsx', import.meta.url), 'utf8');

test('keeps the auto-updating content feed as the default homepage category', () => {
  assert.equal(categoryConfig.defaultCategoryId, 'social');
  assert.equal(categoryConfig.categories[0].id, 'social');
  assert.equal(categoryConfig.categories[0].label, '最新動態');
  assert.match(bentoGridSource, /activeCategory\?\.id === 'social'/);
  assert.match(bentoGridSource, /<PodcastFeedCard locale=\{locale\} \/>/);
  assert.match(bentoGridSource, /<BlogFeedCard locale=\{locale\} \/>/);
  assert.match(bentoGridSource, /<GithubActivityCard locale=\{locale\} \/>/);
});

test('uses audience-facing portfolio categories instead of technology or channel buckets', () => {
  const categoryIds = categoryConfig.categories.map((category) => category.id);
  assert.deepEqual(categoryIds, ['social', 'products', 'agent-skills', 'experiments', 'metaphysics']);

  const validTags = new Set(categoryIds);
  for (const item of links) {
    assert.ok(validTags.has(item.tag), `${item.title} has unsupported tag: ${item.tag}`);
  }
});

test('groups the divination product family together', () => {
  const expectedTitles = [
    '888 人生K線 | 八字命理可視化',
    '333 奇門遁甲',
    '塔羅占卜',
    '生辰八字2',
    '風水顧問',
    '月老姻緣',
    'ChatGPT - Oli家: 塔羅牌問事',
  ];

  for (const title of expectedTitles) {
    assert.equal(links.find((item) => item.title === title)?.tag, 'metaphysics', title);
  }
});

test('labels LLM resources as AI Agent Skills', () => {
  const skillItems = links.filter((item) => item.tag === 'agent-skills');
  assert.equal(skillItems.length, 8);
  assert.ok(skillItems.every((item) => /Skill|技能|API/.test(item.title)));
  assert.equal(links.find((item) => item.title === 'AnswerBook API')?.tag, 'products');
  assert.equal(categoryConfig.categories.find((category) => category.id === 'agent-skills')?.label, 'AI Agent Skills');
});

test('keeps the TTS project family together in research and experiments', () => {
  const ttsItems = links.filter((item) => item.sectionEn === 'Speech & Language');
  assert.deepEqual(ttsItems.map((item) => item.title), ['333 Taiwanese TTS Hub', 'HF: 台語 TTS']);
  assert.ok(ttsItems.every((item) => item.tag === 'experiments'));
});

test('keeps lifestyle side projects with the Qi and Life category', () => {
  const lifestyleTitles = [
    '台灣道路施工地圖',
    '台灣寵物認養地圖',
    'Lofi Music 輕音樂',
    '便利商店即期食品查詢',
  ];

  for (const title of lifestyleTitles) {
    assert.equal(links.find((item) => item.title === title)?.tag, 'metaphysics', title);
  }
});

test('removes the retired hg-markitdown entry', () => {
  assert.equal(links.some((item) => item.url === 'https://huggingface.co/spaces/tbdavid2019/hg-markitdown'), false);
});
