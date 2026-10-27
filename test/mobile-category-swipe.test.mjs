import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CATEGORY_SEQUENCE,
  determineSwipeAction,
  normalizeCategoryForSequence,
} from '../lib/useSwipeCategory.ts';

const bentoGridSource = fs.readFileSync(new URL('../components/BentoGrid.tsx', import.meta.url), 'utf8');
const nextCategoryGuideSource = fs.readFileSync(new URL('../components/NextCategoryGuide.tsx', import.meta.url), 'utf8');
const useSwipeCategorySource = fs.readFileSync(new URL('../lib/useSwipeCategory.ts', import.meta.url), 'utf8');

test('CATEGORY_SEQUENCE defines standard 5 canonical routes in exact order', () => {
  assert.deepEqual(CATEGORY_SEQUENCE, [
    'social',
    'executive',
    'finance',
    'agent-skills',
    'products',
  ]);
});

test('normalizeCategoryForSequence correctly maps aliases to canonical sequence keys', () => {
  assert.equal(normalizeCategoryForSequence('social'), 'social');
  assert.equal(normalizeCategoryForSequence('/social/'), 'social');
  assert.equal(normalizeCategoryForSequence('executive'), 'executive');
  assert.equal(normalizeCategoryForSequence('commitments'), 'executive');
  assert.equal(normalizeCategoryForSequence('promises'), 'executive');
  assert.equal(normalizeCategoryForSequence('advisory'), 'executive');
  assert.equal(normalizeCategoryForSequence('finance'), 'finance');
  assert.equal(normalizeCategoryForSequence('metaphysics'), 'finance');
  assert.equal(normalizeCategoryForSequence('agent-skills'), 'agent-skills');
  assert.equal(normalizeCategoryForSequence('products'), 'products');
  assert.equal(normalizeCategoryForSequence('experiments'), 'products');
  assert.equal(normalizeCategoryForSequence('unknown-route'), 'social');
});

test('determineSwipeAction correctly identifies valid left and right swipes', () => {
  // Valid left swipe (next category)
  const leftSwipe = determineSwipeAction({
    dx: -80,
    dy: 10,
    duration: 200,
    startX: 150,
    screenWidth: 390,
    isIgnoredTarget: false,
  });
  assert.equal(leftSwipe, 'next');

  // Valid right swipe (prev category)
  const rightSwipe = determineSwipeAction({
    dx: 80,
    dy: -15,
    duration: 220,
    startX: 200,
    screenWidth: 390,
    isIgnoredTarget: false,
  });
  assert.equal(rightSwipe, 'prev');
});

test('determineSwipeAction rejects edge swipes to protect iOS system back gestures', () => {
  // Starting inside left 24px zone (iOS back swipe)
  const leftEdgeSwipe = determineSwipeAction({
    dx: 100,
    dy: 5,
    duration: 180,
    startX: 12,
    screenWidth: 390,
    isIgnoredTarget: false,
  });
  assert.equal(leftEdgeSwipe, null);

  // Starting inside right 24px zone
  const rightEdgeSwipe = determineSwipeAction({
    dx: -100,
    dy: 5,
    duration: 180,
    startX: 380,
    screenWidth: 390,
    isIgnoredTarget: false,
  });
  assert.equal(rightEdgeSwipe, null);
});

test('determineSwipeAction rejects vertical scrolling or ambiguous angles', () => {
  // Vertical scroll dominant (|dy| > |dx|)
  const verticalScroll = determineSwipeAction({
    dx: -30,
    dy: 80,
    duration: 200,
    startX: 150,
    screenWidth: 390,
    isIgnoredTarget: false,
  });
  assert.equal(verticalScroll, null);

  // Diagonal movement (angle not steep enough: absDx <= absDy * 1.6)
  const diagonalGesture = determineSwipeAction({
    dx: 60,
    dy: 50,
    duration: 200,
    startX: 150,
    screenWidth: 390,
    isIgnoredTarget: false,
  });
  assert.equal(diagonalGesture, null);
});

test('determineSwipeAction rejects slow drags, small movements, or ignored interactive targets', () => {
  // Too slow (> 500ms)
  const slowDrag = determineSwipeAction({
    dx: -90,
    dy: 10,
    duration: 650,
    startX: 150,
    screenWidth: 390,
    isIgnoredTarget: false,
  });
  assert.equal(slowDrag, null);

  // Too short (< 48px)
  const shortFlick = determineSwipeAction({
    dx: -35,
    dy: 5,
    duration: 150,
    startX: 150,
    screenWidth: 390,
    isIgnoredTarget: false,
  });
  assert.equal(shortFlick, null);

  // Ignored target (e.g. inside navbar or button)
  const interactiveTarget = determineSwipeAction({
    dx: -90,
    dy: 10,
    duration: 200,
    startX: 150,
    screenWidth: 390,
    isIgnoredTarget: true,
  });
  assert.equal(interactiveTarget, null);
});

test('NextCategoryGuide provides explicit chapter advancement and mobile tip', () => {
  assert.match(nextCategoryGuideSource, /下一章節 · 接續探索/);
  assert.match(nextCategoryGuideSource, /Next Chapter · Continue Reading/);
  assert.match(nextCategoryGuideSource, /提示：在手機上亦可向左滑動隨時切換至下一分類/);
  assert.match(nextCategoryGuideSource, /Tip: Swipe left anytime to advance to the next category/);
  assert.match(nextCategoryGuideSource, /已探索完 5 大專題分類/);
  assert.match(nextCategoryGuideSource, /All 5 Categories Explored/);
  assert.match(nextCategoryGuideSource, /onContact/);
});

test('BentoGrid cleanly wires useSwipeCategory and NextCategoryGuide', () => {
  assert.match(bentoGridSource, /useSwipeCategory/);
  assert.match(bentoGridSource, /NextCategoryGuide/);
  assert.match(bentoGridSource, /targetRef: contentSectionRef/);
  assert.match(bentoGridSource, /<NextCategoryGuide/);
});
