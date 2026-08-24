import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCapabilities } from '../lib/webmcpSearch.mjs';

const capabilities = [
  {
    id: 'architecture',
    title: '技術架構顧問',
    titleEn: 'Architecture Advisory',
    description: '評估技術路線與技術債。',
    keywords: ['architecture', 'technical debt'],
  },
  {
    id: 'integration',
    title: '跨系統整合',
    titleEn: 'System Integration',
    description: '重整資料流與服務邊界，也能協助檢查整體 architecture。',
    keywords: ['CRM', 'data flow'],
  },
];

test('ranks exact title matches ahead of description matches', () => {
  const results = rankCapabilities('architecture', capabilities);

  assert.equal(results[0].capability.id, 'architecture');
  assert.ok(results[0].score > results[1]?.score);
  assert.deepEqual(results[0].matchedFields, ['title']);
});

test('supports multilingual and keyword matching with a result limit', () => {
  const results = rankCapabilities('data flow', capabilities, 1);

  assert.equal(results.length, 1);
  assert.equal(results[0].capability.id, 'integration');
  assert.ok(results[0].matchedFields.includes('keywords'));
});

test('returns no results for an empty query', () => {
  assert.deepEqual(rankCapabilities('   ', capabilities), []);
});
