import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProfileMarkdown } from '../scripts/profile-content.mjs';

test('parses headline, sub-headline, sections, bullets, paragraphs, and notes', () => {
  const result = parseProfileMarkdown(`# Hello **world**

> A clear sub-headline

Opening paragraph with [a link](https://example.com).

## Outcomes

- First outcome
- Second outcome

> A note for the reader`);

  assert.deepEqual(result, {
    headline: 'Hello world',
    subHeadline: 'A clear sub-headline',
    body: [
      { kind: 'paragraph', text: 'Opening paragraph with a link.' },
      { kind: 'sectionTitle', text: 'Outcomes' },
      { kind: 'bullet', text: 'First outcome' },
      { kind: 'bullet', text: 'Second outcome' },
      { kind: 'note', text: 'A note for the reader' },
    ],
  });
});

test('rejects Markdown without a headline or sub-headline', () => {
  assert.throws(() => parseProfileMarkdown('Plain text only'), /sub-headline/);
  assert.throws(() => parseProfileMarkdown('# Headline only'), /sub-headline/);
});
