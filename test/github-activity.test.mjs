import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStaleGithubActivityPayload,
  parseGithubAtomFeed,
} from '../scripts/github-activity.mjs';

test('filters the portfolio repository from the GitHub activity feed', () => {
  const feed = `<feed>
    <entry>
      <title>tbdavid2019 pushed david888-bento-portfolio</title>
      <link rel="alternate" href="https://github.com/tbdavid2019/david888-bento-portfolio/compare/a...b" />
      <updated>2026-07-14T01:00:00Z</updated>
      <summary>Website update</summary>
    </entry>
    <entry>
      <title>tbdavid2019 pushed another-project</title>
      <link rel="alternate" href="https://github.com/tbdavid2019/another-project/compare/c...d" />
      <updated>2026-07-14T00:00:00Z</updated>
      <summary>Feature update</summary>
    </entry>
  </feed>`;

  const entries = parseGithubAtomFeed(feed);

  assert.equal(entries.length, 1);
  assert.equal(entries[0].title, 'tbdavid2019 pushed another-project');
});

test('preserves the last successful entries when a sync becomes stale', () => {
  const stale = createStaleGithubActivityPayload({
    entries: [{ title: 'Existing activity', url: 'https://github.com/example', updated: '2026-07-13' }],
    lastSyncedAt: '2026-07-13T01:00:00Z',
  });

  assert.equal(stale.syncStatus, 'stale');
  assert.equal(stale.lastSyncedAt, '2026-07-13T01:00:00Z');
  assert.equal(stale.entries[0].title, 'Existing activity');
});
