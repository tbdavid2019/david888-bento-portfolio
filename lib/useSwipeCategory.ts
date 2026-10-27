import React, { useEffect, useRef } from 'react';

export const CATEGORY_SEQUENCE = [
  'social',
  'executive',
  'finance',
  'agent-skills',
  'products',
] as const;

export type CategorySequenceId = (typeof CATEGORY_SEQUENCE)[number];

export const normalizeCategoryForSequence = (categoryId: string): CategorySequenceId => {
  const cleaned = categoryId.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (cleaned === 'commitments' || cleaned === 'promises' || cleaned === 'advisory') {
    return 'executive';
  }
  if (cleaned === 'metaphysics') {
    return 'finance';
  }
  if (cleaned === 'experiments') {
    return 'products';
  }
  if ((CATEGORY_SEQUENCE as readonly string[]).includes(cleaned)) {
    return cleaned as CategorySequenceId;
  }
  return 'social';
};

export interface SwipeDecisionParams {
  dx: number;
  dy: number;
  duration: number;
  startX: number;
  screenWidth: number;
  isIgnoredTarget: boolean;
}

/**
 * Pure function to determine swipe action with rigorous gating:
 * 1. Ignores clicks on buttons, inputs, links, and horizontal scroll navbars
 * 2. Excludes edge zones (within 24px) to preserve iOS / Android browser swipe back
 * 3. Enforces horizontal dominance (|dx| > 1.6 * |dy|) and minimum distance
 * 4. Rejects slow dragging (duration > 500ms)
 */
export function determineSwipeAction(params: SwipeDecisionParams): 'next' | 'prev' | null {
  const { dx, dy, duration, startX, screenWidth, isIgnoredTarget } = params;

  if (isIgnoredTarget) {
    return null;
  }

  const edgeThreshold = 24;
  if (startX <= edgeThreshold || (screenWidth > 0 && startX >= screenWidth - edgeThreshold)) {
    return null;
  }

  if (duration > 500) {
    return null;
  }

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < 48 || absDx <= absDy * 1.6) {
    return null;
  }

  return dx < 0 ? 'next' : 'prev';
}

export function isIgnoredTouchTarget(element: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(element instanceof HTMLElement)) {
    return false;
  }

  // Interactive controls that need touch events for themselves
  if (
    element.closest('button') ||
    element.closest('a') ||
    element.closest('input') ||
    element.closest('textarea') ||
    element.closest('select') ||
    element.closest('[role="dialog"]')
  ) {
    return true;
  }

  // Horizontal scroll bars / containers that have internal horizontal touch gestures
  if (
    element.closest('.section-nav-bar') ||
    element.closest('[data-no-swipe]') ||
    element.closest('pre') ||
    element.closest('code')
  ) {
    return true;
  }

  return false;
}

export interface UseSwipeCategoryOptions<T extends HTMLElement = HTMLElement> {
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  isSearching?: boolean;
  enabled?: boolean;
  targetRef?: React.RefObject<T | null>;
}

export function useSwipeCategory<T extends HTMLElement = HTMLElement>({
  activeCategoryId,
  onCategoryChange,
  isSearching = false,
  enabled = true,
  targetRef,
}: UseSwipeCategoryOptions<T>) {
  const localRef = useRef<T | null>(null);
  const containerRef = targetRef ?? localRef;
  const activeCategoryIdRef = useRef(activeCategoryId);
  const isSearchingRef = useRef(isSearching);
  const onCategoryChangeRef = useRef(onCategoryChange);

  useEffect(() => {
    activeCategoryIdRef.current = activeCategoryId;
  }, [activeCategoryId]);

  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  useEffect(() => {
    onCategoryChangeRef.current = onCategoryChange;
  }, [onCategoryChange]);

  useEffect(() => {
    if (!enabled) return;

    const targetEl = containerRef.current;
    if (!targetEl) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isIgnored = false;
    let isLockedVertical = false;
    let isHorizontalGesture: boolean | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (isSearchingRef.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      isIgnored = isIgnoredTouchTarget(e.target);
      isLockedVertical = false;
      isHorizontalGesture = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isSearchingRef.current || isIgnored || isLockedVertical || e.touches.length !== 1) {
        return;
      }

      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      // Lock as vertical scroll if user has moved vertically first
      if (isHorizontalGesture === null) {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
          isLockedVertical = true;
          isHorizontalGesture = false;
          return;
        }
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          isHorizontalGesture = true;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (
        isSearchingRef.current ||
        isIgnored ||
        isLockedVertical ||
        isHorizontalGesture !== true ||
        !e.changedTouches.length
      ) {
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const duration = Date.now() - startTime;
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

      const action = determineSwipeAction({
        dx,
        dy,
        duration,
        startX,
        screenWidth,
        isIgnoredTarget: isIgnored,
      });

      if (!action) return;

      const currentNorm = normalizeCategoryForSequence(activeCategoryIdRef.current);
      const currentIndex = CATEGORY_SEQUENCE.indexOf(currentNorm);

      let nextIndex = currentIndex;
      if (action === 'next' && currentIndex < CATEGORY_SEQUENCE.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (action === 'prev' && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }

      if (nextIndex !== currentIndex) {
        const nextCategory = CATEGORY_SEQUENCE[nextIndex];
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(8);
          } catch {
            // Ignore haptic errors on unsupported platforms
          }
        }
        onCategoryChangeRef.current(nextCategory);
      }
    };

    targetEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    targetEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    targetEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      targetEl.removeEventListener('touchstart', handleTouchStart);
      targetEl.removeEventListener('touchmove', handleTouchMove);
      targetEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, containerRef]);

  return containerRef;
}
