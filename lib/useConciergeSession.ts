import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Locale } from '../types';
import {
  siteItems,
  capabilityAreas,
  getLocalizedItemTitle,
  getLocalizedItemDescription,
  getItemUrl,
} from './siteCatalog';
import { sendConciergeMessage, type ConciergeChatDraft } from './crm';
import {
  searchCombinedCatalog,
  type CatalogSearchInputItem,
  type ConciergeMode,
  type DockChatMessage,
  type SafeContextReference,
} from './concierge-session';
import type { SiteContextItem } from './context-retrieval';

export interface FeedSummaryPayload {
  syncStatus?: string;
  lastSyncedAt?: string | null;
  feedUrl?: string;
  items?: Array<{
    id?: string;
    source?: string;
    title?: string;
    summary?: string;
    url?: string;
    publishedAt?: string;
    tags?: string[];
  }>;
}

const makeId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function normalizeFeedSearchItems(feed: FeedSummaryPayload | null): CatalogSearchInputItem[] {
  if (!feed?.items) return [];
  return feed.items
    .filter((item) => item && item.title && item.url)
    .map((item) => ({
      id: item.id || item.url,
      title: String(item.title),
      summary: String(item.summary || ''),
      url: String(item.url),
      source: item.source || 'feed',
      publishedAt: item.publishedAt,
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));
}

export function useConciergeSession(locale: Locale, defaultSubject = '') {
  const isZh = locale !== 'en';
  const [mode, setMode] = useState<ConciergeMode>('qa');
  const [messages, setMessages] = useState<DockChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [revealEmail, setRevealEmail] = useState(false);
  const [readyToConfirm, setReadyToConfirm] = useState(false);
  const [autoDispatched, setAutoDispatched] = useState(false);
  const [dispatchedTo, setDispatchedTo] = useState<string | undefined>(undefined);
  const [references, setReferences] = useState<SafeContextReference[]>([]);
  const [draft, setDraft] = useState<ConciergeChatDraft>({
    name: '',
    email: '',
    company: '',
    subject: defaultSubject,
    message: '',
  });
  const [feedSummary, setFeedSummary] = useState<FeedSummaryPayload | null>(null);
  const feedInFlightRef = useRef<Promise<FeedSummaryPayload | null> | null>(null);
  const sessionEpochRef = useRef(0);

  const loadFeedSummary = useCallback(async (): Promise<FeedSummaryPayload | null> => {
    if (feedSummary) return feedSummary;
    if (feedInFlightRef.current) return feedInFlightRef.current;

    const promise = (async () => {
      try {
        const res = await fetch('/feed-summary.json', { headers: { Accept: 'application/json' } });
        if (!res.ok) return null;
        const data = (await res.json()) as FeedSummaryPayload;
        if (data && Array.isArray(data.items)) {
          setFeedSummary(data);
          return data;
        }
      } catch {
        // Graceful catalog-only fallback when feed-summary.json is unavailable; allows retry on next call
      } finally {
        feedInFlightRef.current = null;
      }
      return null;
    })();

    feedInFlightRef.current = promise;
    return promise;
  }, [feedSummary]);

  // Idle background prefetch so /search and /rss respond instantaneously
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const win = window as any;
    const trigger = () => {
      if (!cancelled) void loadFeedSummary();
    };
    if (typeof win.requestIdleCallback === 'function') {
      const handle = win.requestIdleCallback(trigger, { timeout: 2500 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(handle);
      };
    }
    const timer = window.setTimeout(trigger, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadFeedSummary]);

  const catalogSearchItems: CatalogSearchInputItem[] = useMemo(() => {
    const caps = capabilityAreas.map((cap) => ({
      id: `cap:${cap.id}`,
      title: isZh ? cap.title : cap.titleEn,
      summary: isZh ? cap.description : cap.descriptionEn,
      url: '/executive',
      source: 'capability',
      featured: true,
      tags: cap.keywords,
    }));

    const works = siteItems
      .filter((item) => !item.hidden)
      .map((item, idx) => {
        const title = getLocalizedItemTitle(item, locale);
        return {
          id: `work:${idx}:${title}`,
          title,
          summary: getLocalizedItemDescription(item, locale) || '',
          url: getItemUrl(item) || `/${item.tag || 'flagships'}`,
          source: item.tag || 'portfolio',
          featured: Boolean('flagship' in item && item.flagship),
          tags: [...(item.techStack || []), item.section, item.tag].filter((t): t is string => Boolean(t)),
        };
      });

    return [...caps, ...works];
  }, [isZh, locale]);

  const feedSearchItems = useMemo(() => normalizeFeedSearchItems(feedSummary), [feedSummary]);

  const fallbackContextItems: SiteContextItem[] = useMemo(
    () =>
      [...catalogSearchItems, ...feedSearchItems].map((item) => ({
        id: item.id,
        source: item.source,
        featured: item.featured,
        title: item.title,
        summary: item.summary,
        url: item.url.startsWith('/') ? `https://david888.com${item.url}` : item.url,
        publishedAt: item.publishedAt,
        tags: item.tags,
      })),
    [catalogSearchItems, feedSearchItems],
  );

  const appendMessage = useCallback((msg: Omit<DockChatMessage, 'id'>) => {
    const full: DockChatMessage = { id: makeId(), ...msg };
    setMessages((prev) => [...prev, full]);
    return full;
  }, []);

  const clearMessages = useCallback(() => {
    sessionEpochRef.current += 1;
    setMessages([]);
    setBusy(false);
    setReferences([]);
    setRevealEmail(false);
    setReadyToConfirm(false);
    setAutoDispatched(false);
    setDispatchedTo(undefined);
    setDraft({
      name: '',
      email: '',
      company: '',
      subject: defaultSubject,
      message: '',
    });
  }, [defaultSubject]);

  const runLocalSearch = useCallback(
    (query: string, limit = 8, feedOverride?: FeedSummaryPayload | null) => {
      const feedPool = feedOverride !== undefined ? normalizeFeedSearchItems(feedOverride) : feedSearchItems;
      return searchCombinedCatalog(query, catalogSearchItems, feedPool, limit);
    },
    [catalogSearchItems, feedSearchItems],
  );

  const sendMessage = useCallback(
    async (
      rawText: string,
      options?: { mode?: ConciergeMode; defaultSubject?: string },
    ) => {
      const content = rawText.trim();
      if (!content || busy) return null;

      const epochAtStart = sessionEpochRef.current;
      const targetMode: ConciergeMode = options?.mode || mode;
      const userMsg: DockChatMessage = {
        id: makeId(),
        role: 'user',
        content,
        mode: targetMode,
        kind: 'text',
      };

      // Strictly isolate Q&A vs Contact history so private contact emails/messages never mix into Q&A (or vice versa)
      const historyForApi = [...messages, userMsg]
        .filter((m) => m.kind === 'text' && (m.mode || 'qa') === targetMode)
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      setMessages((prev) => [...prev, userMsg]);
      setBusy(true);

      try {
        const res = await sendConciergeMessage({
          messages: historyForApi,
          locale,
          defaultSubject: options?.defaultSubject ?? (draft.subject || defaultSubject),
          mode: targetMode,
          fallbackContextItems,
        });

        if (sessionEpochRef.current !== epochAtStart) {
          return null;
        }

        const refs = Array.isArray(res.references) ? res.references : [];
        if (targetMode === 'contact') {
          if (res.revealEmail) setRevealEmail(true);
          if (res.draft) {
            setDraft((prev) => ({
              name: res.draft.name || prev.name,
              email: res.draft.email || prev.email,
              company: res.draft.company || prev.company,
              subject: res.draft.subject || prev.subject,
              message: res.draft.message || prev.message,
            }));
          }
          setReadyToConfirm(Boolean(res.readyToConfirm));
          setAutoDispatched(Boolean(res.autoDispatched));
          if (res.dispatchedTo) setDispatchedTo(res.dispatchedTo);
        }

        setReferences(refs);
        const replyMsg: DockChatMessage = {
          id: makeId(),
          role: 'assistant',
          content: res.reply,
          mode: targetMode,
          references: refs,
          kind: 'text',
        };
        setMessages((prev) => [...prev, replyMsg]);
        return res;
      } catch {
        if (sessionEpochRef.current !== epochAtStart) {
          return null;
        }
        const errMsg: DockChatMessage = {
          id: makeId(),
          role: 'assistant',
          mode: targetMode,
          kind: 'error',
          content: isZh
            ? '暫時無法連線至雲端服務，請稍後再試，或輸入 `/form` 直接填表聯繫。'
            : 'Unable to reach the concierge service right now. Please retry shortly or type `/form` to send a message directly.',
        };
        setMessages((prev) => [...prev, errMsg]);
        return null;
      } finally {
        if (sessionEpochRef.current === epochAtStart) {
          setBusy(false);
        }
      }
    },
    [busy, mode, messages, locale, draft.subject, defaultSubject, fallbackContextItems, isZh],
  );

  return {
    mode,
    setMode,
    messages,
    busy,
    draft,
    setDraft,
    revealEmail,
    setRevealEmail,
    readyToConfirm,
    setReadyToConfirm,
    autoDispatched,
    setAutoDispatched,
    dispatchedTo,
    references,
    feedSummary,
    loadFeedSummary,
    appendMessage,
    clearMessages,
    runLocalSearch,
    sendMessage,
  };
}
