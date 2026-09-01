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
  assert.deepEqual(categoryIds, ['social', 'finance', 'products', 'agent-skills', 'experiments', 'metaphysics']);

  const validTags = new Set(categoryIds);
  for (const item of links) {
    assert.ok(validTags.has(item.tag), `${item.title} has unsupported tag: ${item.tag}`);
  }
});

test('groups finance and investment projects together under finance category', () => {
  const financeTitles = [
    '台灣公司關係網路可視化',
    '888 StockBot 2.0 | 機構級金融智能體',
    '888 Stock Quant | 專業量化決策平台',
    '選出潛力股 | 投資新聞濃縮包 | 333',
    'Telegram: 股靈精怪 Stock',
    'Telegram: 投資新聞濃縮包',
    'HF: 股神 AI 投資公司',
    '台股預測 (HF Space)',
    'HF: Stock Top Wick',
    '股市K線判別',
  ];

  for (const title of financeTitles) {
    assert.equal(links.find((item) => item.title === title)?.tag, 'finance', title);
  }
  assert.equal(categoryConfig.categories.find((category) => category.id === 'finance')?.label, '財經投資');
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
  assert.equal(skillItems.length, 9);
  assert.ok(skillItems.every((item) => /Skill|技能|API|Agent/.test(item.title)));
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

test('removes the inaccessible Pdf2quiz entry', () => {
  assert.equal(links.some((item) => item.url === 'https://huggingface.co/spaces/tbdavid2019/pdf2quiz'), false);
});

test('records runtime state for paused and sleeping Hugging Face Spaces', () => {
  const pausedTitles = [
    '台灣標案檢索工具',
    '台股預測 (HF Space)',
    'HF: 病歷格式 Outpatient Records',
    'HF: Stock Top Wick',
    'HF: 換臉 SwapFace',
  ];

  for (const title of pausedTitles) {
    assert.equal(links.find((item) => item.title === title)?.runtimeStatus, 'paused', title);
  }

  assert.equal(links.find((item) => item.title === 'HF: 股神 AI 投資公司')?.runtimeStatus, 'sleeping');
});

test('provides a local clone source for Taiwan Tender', () => {
  const tender = links.find((item) => item.title === '台灣標案檢索工具');
  assert.equal(tender?.repoUrl, 'https://huggingface.co/spaces/tbdavid2019/taiwan-tender/tree/main');
  assert.equal(tender?.cloneCommand, 'git clone https://huggingface.co/spaces/tbdavid2019/taiwan-tender');
});
