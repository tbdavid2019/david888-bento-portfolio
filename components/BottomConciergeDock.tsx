import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ChevronDown,
  ChevronUp,
  ConciergeBell,
  ExternalLink,
  Mail,
  Rss,
  Search,
  Send,
  Sparkles,
  Terminal,
  Trash2,
} from 'lucide-react';
import type { Locale } from '../types';
import {
  SLASH_COMMANDS,
  createInitialGreetingMessage,
  filterSlashCommands,
  isSafeLinkTarget,
  parseSlashCommand,
  type DockChatMessage,
} from '../lib/concierge-session';
import type { useConciergeSession } from '../lib/useConciergeSession';

export interface BottomConciergeDockHandle {
  focusInput: (prefill?: string) => void;
  expandDrawer: () => void;
  collapseDrawer: (restoreFocus?: boolean) => void;
  isExpanded: () => boolean;
}

type SessionApi = ReturnType<typeof useConciergeSession>;

export interface BottomConciergeDockProps {
  locale: Locale;
  session: SessionApi;
  onNavigateCategory: (categoryId: string) => void;
  onOpenContact: (tab?: 'chat' | 'form') => void;
  isContactModalOpen: boolean;
}

const SOURCE_BADGE_MAP: Record<string, { zh: string; en: string }> = {
  portfolio: { zh: '作品', en: 'Work' },
  products: { zh: '產品', en: 'Product' },
  opensource: { zh: '開源', en: 'OSS' },
  architecture: { zh: '架構', en: 'Arch' },
  capability: { zh: '領域', en: 'Capability' },
  github: { zh: 'GitHub', en: 'GitHub' },
  blog: { zh: 'Blog', en: 'Blog' },
  podcast: { zh: 'Podcast', en: 'Podcast' },
  threads: { zh: 'Threads', en: 'Threads' },
};

export const BottomConciergeDock = forwardRef<BottomConciergeDockHandle, BottomConciergeDockProps>(
  ({ locale, session, onNavigateCategory, onOpenContact, isContactModalOpen }, ref) => {
    const isZh = locale !== 'en';
    const [input, setInput] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [activeCmdIdx, setActiveCmdIdx] = useState(0);
    const [slashDismissed, setSlashDismissed] = useState(false);
    const [keyboardInset, setKeyboardInset] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isComposingRef = useRef(false);

    const filteredCommands = filterSlashCommands(input);
    const showSlashMenu = filteredCommands.length > 0 && !slashDismissed && !isContactModalOpen;

    useEffect(() => {
      if (activeCmdIdx >= filteredCommands.length) {
        setActiveCmdIdx(0);
      }
    }, [filteredCommands.length, activeCmdIdx]);

    // Mobile virtual keyboard visualViewport offset tracking
    useEffect(() => {
      if (typeof window === 'undefined' || !window.visualViewport) return;
      const vv = window.visualViewport;
      const updateInset = () => {
        const diff = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
        setKeyboardInset(diff > 40 ? diff : 0);
      };
      vv.addEventListener('resize', updateInset);
      vv.addEventListener('scroll', updateInset);
      return () => {
        vv.removeEventListener('resize', updateInset);
        vv.removeEventListener('scroll', updateInset);
      };
    }, []);

    // Scroll message drawer smoothly when messages update
    useEffect(() => {
      if (expanded && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, [expanded, session.messages, session.busy]);

    const adjustHeight = (el: HTMLTextAreaElement | null) => {
      if (!el) return;
      el.style.height = 'auto';
      const next = Math.min(Math.max(el.scrollHeight, 38), 112);
      el.style.height = `${next}px`;
    };

    useImperativeHandle(ref, () => ({
      focusInput: (prefill?: string) => {
        if (typeof prefill === 'string') {
          setInput(prefill);
        }
        window.requestAnimationFrame(() => {
          textareaRef.current?.focus();
          adjustHeight(textareaRef.current);
        });
      },
      expandDrawer: () => setExpanded(true),
      collapseDrawer: (restoreFocus = false) => {
        setExpanded(false);
        if (restoreFocus) {
          window.requestAnimationFrame(() => textareaRef.current?.focus());
        }
      },
      isExpanded: () => expanded,
    }));

    const executeParsedCommand = async (rawValue: string): Promise<boolean> => {
      const parsed = parseSlashCommand(rawValue);
      if (!parsed) return false;

      if (parsed.type === 'clear') {
        session.clearMessages();
        setInput('');
        adjustHeight(textareaRef.current);
        return true;
      }

      if (parsed.type === 'contact') {
        setInput('');
        adjustHeight(textareaRef.current);
        setExpanded(false);
        onOpenContact('chat');
        return true;
      }

      if (parsed.type === 'form') {
        setInput('');
        adjustHeight(textareaRef.current);
        setExpanded(false);
        onOpenContact('form');
        return true;
      }

      if (parsed.type === 'route') {
        setInput('');
        adjustHeight(textareaRef.current);
        setExpanded(false);
        onNavigateCategory(parsed.categoryId);
        return true;
      }

      setExpanded(true);
      setInput('');
      adjustHeight(textareaRef.current);

      if (parsed.type === 'help') {
        session.appendMessage({
          role: 'user',
          content: '/help',
          kind: 'command',
        });
        session.appendMessage({
          role: 'assistant',
          kind: 'help',
          content: isZh
            ? '可使用下列 `/` 指令操作瀏覽與搜尋，或直接用自然語言詢問關於 David 的專案與文章：'
            : 'Use these `/` commands to navigate or search, or ask any natural-language question about David’s work:',
        });
        return true;
      }

      if (parsed.type === 'rss') {
        session.appendMessage({
          role: 'user',
          content: '/rss',
          kind: 'command',
        });
        const feed = session.feedSummary || (await session.loadFeedSummary());
        const latest = Array.isArray(feed?.items) ? feed.items.slice(0, 6) : [];
        session.appendMessage({
          role: 'assistant',
          kind: 'rss',
          content: isZh
            ? '已統整 Blog、Podcast、GitHub 與原創 Threads 動態至站內 RSS 2.0 訂閱源 `/rss.xml`：'
            : 'Unified RSS 2.0 feed (`/rss.xml`) aggregates Blog, Podcast, GitHub, and original Threads notes:',
          searchResults: latest
            .filter((item) => item && item.title && item.url && isSafeLinkTarget(item.url))
            .map((item, idx) => ({
              id: item.id || `rss-${idx}`,
              title: String(item.title),
              summary: String(item.summary || ''),
              url: String(item.url),
              source: item.source || 'feed',
              publishedAt: item.publishedAt,
              score: 1,
            })),
          references: [
            {
              title: isZh ? '開啟 /rss.xml 訂閱檔案' : 'Open /rss.xml feed',
              url: 'https://david888.com/rss.xml',
              source: 'rss',
            },
          ],
        });
        return true;
      }

      if (parsed.type === 'search') {
        const query = parsed.query.trim();
        if (!query) {
          session.appendMessage({
            role: 'assistant',
            kind: 'help',
            content: isZh
              ? '請在 `/search` 後方輸入關鍵字，例如：`/search FIDO2` 或 `/search AI`。'
              : 'Add a keyword after `/search`, for example `/search FIDO2` or `/search AI`.',
          });
          setInput('/search ');
          window.requestAnimationFrame(() => textareaRef.current?.focus());
          return true;
        }
        const feed = session.feedSummary || (await session.loadFeedSummary());
        const matches = session.runLocalSearch(query, 8, feed);
        session.appendMessage({
          role: 'user',
          content: `/search ${query}`,
          kind: 'command',
        });
        session.appendMessage({
          role: 'assistant',
          kind: 'search',
          content:
            matches.length > 0
              ? isZh
                ? `搜尋「${query}」共找到 ${matches.length} 筆站內與同步動態紀錄：`
                : `Found ${matches.length} matching records for "${query}":`
              : isZh
                ? `未在站內索引找到符合「${query}」的項目，您可直接按 Enter 詢問小秘書或切換關鍵字。`
                : `No exact local matches found for "${query}". You can ask as a natural-language question or try another keyword.`,
          searchResults: matches,
        });
        return true;
      }

      if (parsed.type === 'unknown') {
        session.appendMessage({
          role: 'user',
          content: parsed.command,
          kind: 'command',
        });
        session.appendMessage({
          role: 'assistant',
          kind: 'help',
          content: isZh
            ? `不認識指令 \`${parsed.command}\`。請從下方選擇有效指令，或輸入 \`/help\` 查看完整列表。`
            : `Unknown command \`${parsed.command}\`. Type \`/help\` to see supported commands.`,
        });
        return true;
      }

      return false;
    };

    const handleSubmit = async (explicitText?: string) => {
      const value = (explicitText ?? input).trim();
      if (!value || session.busy) return;

      if (value.startsWith('/')) {
        await executeParsedCommand(value);
        return;
      }

      setExpanded(true);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '38px';
      }

      await session.sendMessage(value, { mode: 'qa' });
    };

    const handleSelectAutocomplete = async (command: string) => {
      if (command === '/search') {
        setInput('/search ');
        window.requestAnimationFrame(() => {
          textareaRef.current?.focus();
          adjustHeight(textareaRef.current);
        });
        return;
      }
      await executeParsedCommand(command);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const composing = isComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229;
      if (composing) return;

      if (showSlashMenu) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveCmdIdx((prev) => (prev + 1) % filteredCommands.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveCmdIdx((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          return;
        }
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          const chosen = filteredCommands[activeCmdIdx];
          if (chosen) {
            setInput(chosen.takesArg ? `${chosen.command} ` : chosen.command);
          }
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const chosen = filteredCommands[activeCmdIdx];
          if (chosen) {
            void handleSelectAutocomplete(chosen.command);
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          e.nativeEvent.stopImmediatePropagation?.();
          setSlashDismissed(true);
          return;
        }
      }

      if (e.key === 'Escape' && expanded && !isContactModalOpen) {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation?.();
        setExpanded(false);
        window.requestAnimationFrame(() => textareaRef.current?.focus());
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    };

    const greeting = createInitialGreetingMessage(locale, 'qa');
    const displayMessages: DockChatMessage[] =
      session.messages.length > 0 ? session.messages : [greeting];

    const quickPrompts = isZh
      ? [
          { label: '近期 GitHub 與 Threads 動態？', query: '請問 David 最近在 GitHub 或 Threads 上分享了什麼主題？' },
          { label: 'CTO 顧問與資安架構專長', query: '請介紹 David 的 CTO 顧問與資安架構背景。' },
          { label: '/search AI', query: '/search AI' },
        ]
      : [
          { label: 'Recent GitHub & Threads notes?', query: 'What has David shared recently on GitHub and Threads?' },
          { label: 'CTO Advisory & Security background', query: "What are David's core capabilities in CTO advisory and security?" },
          { label: '/search AI', query: '/search AI' },
        ];

    const activeCommand = showSlashMenu ? filteredCommands[activeCmdIdx] : undefined;

    return (
      <div
        aria-hidden={isContactModalOpen}
        className={`fixed inset-x-0 z-50 pointer-events-none ${isContactModalOpen ? 'hidden' : ''}`}
        style={{
          bottom: `${keyboardInset}px`,
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="dossier-shell pointer-events-none flex flex-col items-stretch">
          {/* Expandable Context Q&A + Search Drawer */}
          {expanded && (
            <section
              aria-label={isZh ? '小秘書對話與站內查詢視窗' : 'Concierge Q&A and Search Drawer'}
              style={
                keyboardInset > 0
                  ? { maxHeight: `max(12rem, calc(100dvh - ${keyboardInset + 112}px))` }
                  : undefined
              }
              className="pointer-events-auto mb-2 flex max-h-[60dvh] flex-col overflow-hidden rounded-2xl border-2 border-[#17324d] bg-[#fffefa] text-[#2b251a] shadow-[0_-12px_36px_rgba(23,50,77,0.2)] dark:border-[#ffb010] dark:bg-[#152332] dark:text-[#fff9e8]"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between gap-2 border-b border-[#d6bc7c]/60 bg-[#fff9e8] px-3.5 py-2.5 dark:border-[#2a4563] dark:bg-[#17324d]">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#17324d] text-[#ffb010] border border-[#d6bc7c]/60 dark:bg-[#0f2337]">
                    <ConciergeBell size={16} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-extrabold text-[#17324d] dark:text-[#fff9e8]">
                      {isZh ? 'David 的小秘書 · 站內問答與搜尋' : "David's Concierge · Context Q&A & Search"}
                    </h2>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void executeParsedCommand('/rss')}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#17324d]/30 bg-[#fffefa] px-2.5 text-xs font-bold text-[#17324d] transition-colors hover:bg-[#fff0cc] dark:border-[#d8cfbc]/30 dark:bg-[#0f2337] dark:text-[#fff9e8] dark:hover:bg-[#1d3955]"
                    title={isZh ? '最新動態 & RSS' : 'Latest updates & RSS'}
                  >
                    <Rss size={13} aria-hidden="true" />
                    <span className="hidden sm:inline">RSS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(false);
                      onOpenContact('chat');
                    }}
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#17324d] px-2.5 text-xs font-bold text-[#fff9e8] transition-colors hover:bg-[#0f2337] dark:bg-[#ffb010] dark:text-[#2b251a] dark:hover:bg-[#f2a600]"
                  >
                    <Mail size={13} aria-hidden="true" />
                    <span>{isZh ? '聯絡 David' : 'Contact'}</span>
                  </button>
                  {session.messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => session.clearMessages()}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#17324d]/25 text-[#594e36] transition-colors hover:bg-[#fff0cc] hover:text-[#2b251a] dark:border-[#d8cfbc]/25 dark:text-[#d8cfbc] dark:hover:bg-[#0f2337]"
                      aria-label={isZh ? '清空對話' : 'Clear conversation'}
                      title="/clear"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#17324d]/25 text-[#17324d] transition-colors hover:bg-[#fff0cc] dark:border-[#d8cfbc]/25 dark:text-[#fff9e8] dark:hover:bg-[#0f2337]"
                    aria-label={isZh ? '收合對話視窗 (Esc)' : 'Collapse drawer (Esc)'}
                    title="Esc"
                  >
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Drawer Transcript Body */}
              <div
                ref={scrollContainerRef}
                className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3 text-sm leading-relaxed"
              >
                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={
                        msg.role === 'user'
                          ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-[#17324d] px-3.5 py-2 text-[#fff9e8] font-medium shadow-xs dark:bg-[#ffb010] dark:text-[#2b251a]'
                          : 'max-w-[94%] rounded-2xl rounded-bl-sm border border-[#d6bc7c]/70 bg-[#fff9e8] px-3.5 py-2.5 text-[#2b251a] shadow-xs dark:border-[#2a4563] dark:bg-[#0f2337] dark:text-[#fff9e8]'
                      }
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* /help table */}
                      {msg.kind === 'help' && (
                        <ul className="mt-2.5 space-y-1.5 border-t border-[#d6bc7c]/50 pt-2 dark:border-[#2a4563]">
                          {SLASH_COMMANDS.map((cmd) => (
                            <li key={cmd.command}>
                              <button
                                type="button"
                                onClick={() => void handleSelectAutocomplete(cmd.command)}
                                className="flex w-full items-baseline gap-2.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-[#fff0cc] dark:hover:bg-[#17324d]"
                              >
                                <span className="shrink-0 font-mono text-xs font-bold text-[#a9471d] dark:text-[#ffb010]">
                                  {cmd.usage}
                                </span>
                                <span className="text-xs text-[#594e36] dark:text-[#d8cfbc]">
                                  {isZh ? cmd.descZh : cmd.descEn}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Search / RSS compact result cards */}
                      {(msg.kind === 'search' || msg.kind === 'rss') &&
                        msg.searchResults &&
                        msg.searchResults.length > 0 && (
                          <div className="mt-2.5 grid gap-1.5 border-t border-[#d6bc7c]/50 pt-2 dark:border-[#2a4563]">
                            {msg.searchResults.map((item) => {
                              const badge = SOURCE_BADGE_MAP[item.source] || {
                                zh: item.source,
                                en: item.source,
                              };
                              const isInternal = item.url.startsWith('/');
                              if (isInternal) {
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setExpanded(false);
                                      onNavigateCategory(item.url.slice(1) || 'executive');
                                    }}
                                    className="flex items-start justify-between gap-2 rounded-xl border border-[#d6bc7c]/60 bg-[#fffefa] p-2 text-left transition-colors hover:border-[#17324d] dark:border-[#2a4563] dark:bg-[#152332] dark:hover:border-[#ffb010]"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="rounded bg-[#17324d] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#fff9e8] dark:bg-[#ffb010] dark:text-[#2b251a]">
                                          {isZh ? badge.zh : badge.en}
                                        </span>
                                        <span className="truncate text-xs font-bold text-[#17324d] dark:text-[#fff9e8]">
                                          {item.title}
                                        </span>
                                      </div>
                                      {item.summary && (
                                        <p className="mt-0.5 line-clamp-1 text-[11px] text-[#594e36] dark:text-[#d8cfbc]">
                                          {item.summary}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                );
                              }
                              return (
                                <a
                                  key={item.id}
                                  href={isSafeLinkTarget(item.url) ? item.url : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start justify-between gap-2 rounded-xl border border-[#d6bc7c]/60 bg-[#fffefa] p-2 no-underline transition-colors hover:border-[#17324d] dark:border-[#2a4563] dark:bg-[#152332] dark:hover:border-[#ffb010]"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="rounded bg-[#17324d] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#fff9e8] dark:bg-[#ffb010] dark:text-[#2b251a]">
                                        {isZh ? badge.zh : badge.en}
                                      </span>
                                      <span className="truncate text-xs font-bold text-[#17324d] dark:text-[#fff9e8]">
                                        {item.title}
                                      </span>
                                    </div>
                                    {item.summary && (
                                      <p className="mt-0.5 line-clamp-1 text-[11px] text-[#594e36] dark:text-[#d8cfbc]">
                                        {item.summary}
                                      </p>
                                    )}
                                  </div>
                                  <ExternalLink
                                    size={13}
                                    className="mt-0.5 shrink-0 text-[#594e36] dark:text-[#d8cfbc]"
                                    aria-hidden="true"
                                  />
                                </a>
                              );
                            })}
                          </div>
                        )}

                      {/* Grounded server-validated reference pills */}
                      {msg.references && msg.references.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[#d6bc7c]/50 pt-2 dark:border-[#2a4563]">
                          {msg.references
                            .filter((refItem) => isSafeLinkTarget(refItem.url))
                            .map((refItem) => (
                              <a
                                key={`${msg.id}-${refItem.url}`}
                                href={refItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#17324d]/30 bg-[#fffefa] px-2.5 py-1 text-[11px] font-bold text-[#17324d] no-underline transition-colors hover:bg-[#17324d] hover:text-[#fff9e8] dark:border-[#ffb010]/45 dark:bg-[#152332] dark:text-[#ffb010] dark:hover:bg-[#ffb010] dark:hover:text-[#2b251a]"
                              >
                                <span className="font-mono text-[10px] uppercase opacity-80">
                                  {refItem.source}
                                </span>
                                <span className="truncate max-w-[180px]">{refItem.title}</span>
                                <ExternalLink size={11} className="shrink-0" aria-hidden="true" />
                              </a>
                            ))}
                        </div>
                      )}

                      {/* Direct Commercial / Contact Handoff Pill */}
                      {msg.role === 'assistant' && msg.suggestedAction === 'contact' && (
                        <div className="mt-2.5 border-t border-[#d6bc7c]/50 pt-2 dark:border-[#2a4563]">
                          <button
                            type="button"
                            onClick={() => {
                              setExpanded(false);
                              onOpenContact('chat');
                            }}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#17324d] px-3 py-1.5 text-xs font-extrabold text-[#fff9e8] shadow-xs transition-colors hover:bg-[#0f2337] dark:bg-[#ffb010] dark:text-[#2b251a] dark:hover:bg-[#ffc64d]"
                          >
                            <Mail size={13} aria-hidden="true" />
                            <span>
                              {isZh
                                ? '直接由小秘書轉達聯繫 David (/contact) →'
                                : 'Connect with David via Concierge (/contact) →'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {session.messages.length === 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {quickPrompts.map((item) => (
                      <button
                        key={item.query}
                        type="button"
                        onClick={() => void handleSubmit(item.query)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#17324d]/30 bg-[#fff9e8] px-3 py-1.5 text-xs font-bold text-[#17324d] transition-colors hover:bg-[#fff0cc] dark:border-[#ffb010]/40 dark:bg-[#0f2337] dark:text-[#ffb010] dark:hover:bg-[#17324d]"
                      >
                        <Sparkles size={12} aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {session.busy && (
                  <div className="flex items-center gap-2 text-xs font-bold text-[#594e36] dark:text-[#d8cfbc]">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#17324d] animate-pulse dark:bg-[#ffb010]" />
                    <span>{isZh ? '小秘書正在比對站內索引並回覆中…' : 'Concierge is checking site index…'}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Relative Anchor for Slash Autocomplete Popover + Sticky Bottom Command Input */}
          <div className="pointer-events-auto relative">
            {showSlashMenu && (
              <div
                id="concierge-slash-listbox"
                role="listbox"
                aria-label={isZh ? '快捷指令選單' : 'Slash command autocomplete'}
                className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border-2 border-[#17324d] bg-[#fffefa] shadow-[0_-10px_28px_rgba(23,50,77,0.2)] dark:border-[#ffb010] dark:bg-[#152332]"
              >
                <div className="flex items-center justify-between border-b border-[#d6bc7c]/50 bg-[#fff9e8] px-3 py-1.5 text-[11px] font-bold text-[#594e36] dark:border-[#2a4563] dark:bg-[#17324d] dark:text-[#d8cfbc]">
                  <span className="inline-flex items-center gap-1.5">
                    <Terminal size={12} aria-hidden="true" />
                    <span>{isZh ? '快捷指令（↑/↓ 選擇 · Enter 執行 · Esc 關閉）' : 'Commands (↑/↓ select · Enter run · Esc close)'}</span>
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {filteredCommands.map((cmd, index) => {
                    const isActive = index === activeCmdIdx;
                    return (
                      <button
                        key={cmd.command}
                        id={`concierge-cmd-${cmd.command.slice(1)}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActiveCmdIdx(index)}
                        onClick={() => void handleSelectAutocomplete(cmd.command)}
                        className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors ${
                          isActive
                            ? 'bg-[#17324d] text-[#fff9e8] dark:bg-[#ffb010] dark:text-[#2b251a]'
                            : 'text-[#2b251a] hover:bg-[#fff0cc] dark:text-[#fff9e8] dark:hover:bg-[#17324d]/60'
                        }`}
                      >
                        <span
                          className={`font-mono text-xs font-extrabold ${
                            isActive
                              ? 'text-[#ffb010] dark:text-[#2b251a]'
                              : 'text-[#a9471d] dark:text-[#ffb010]'
                          }`}
                        >
                          {cmd.usage}
                        </span>
                        <span
                          className={`truncate text-xs font-medium ${
                            isActive
                              ? 'text-[#fff9e8]/95 dark:text-[#2b251a]/90'
                              : 'text-[#594e36] dark:text-[#d8cfbc]'
                          }`}
                        >
                          {isZh ? cmd.descZh : cmd.descEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Sticky Command Dock Container */}
            <div className="flex items-end gap-2 rounded-2xl border-2 border-[#17324d] bg-[#fff9e8]/95 p-2 shadow-[0_-8px_30px_rgba(23,50,77,0.16)] backdrop-blur-md transition-colors motion-reduce:transition-none dark:border-[#ffb010] dark:bg-[#152332]/95">
              {/* Toggle Drawer / Concierge Badge */}
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                aria-label={expanded ? (isZh ? '收合小秘書視窗' : 'Collapse concierge drawer') : (isZh ? '展開小秘書對話與指令' : 'Expand concierge drawer')}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#17324d] px-3 text-xs font-extrabold text-[#fff9e8] shadow-xs transition-colors hover:bg-[#0f2337] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17324d] dark:bg-[#ffb010] dark:text-[#2b251a] dark:hover:bg-[#f2a600] dark:focus-visible:outline-[#ffb010]"
              >
                <ConciergeBell size={16} strokeWidth={2.2} className="text-[#ffb010] dark:text-[#2b251a]" aria-hidden="true" />
                <span className="hidden sm:inline">{isZh ? '小秘書' : 'Concierge'}</span>
                {expanded ? (
                  <ChevronDown size={14} aria-hidden="true" />
                ) : (
                  <ChevronUp size={14} aria-hidden="true" />
                )}
              </button>

              {/* Input Wrapper */}
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#d6bc7c] bg-[#fffefa] px-3 py-1 focus-within:border-[#17324d] dark:border-[#2a4563] dark:bg-[#0f2337] dark:focus-within:border-[#ffb010]">
                <span
                  className="select-none font-mono text-sm font-extrabold text-[#a9471d] dark:text-[#ffb010]"
                  aria-hidden="true"
                >
                  &gt;
                </span>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setSlashDismissed(false);
                    adjustHeight(e.target);
                  }}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showSlashMenu}
                  aria-controls="concierge-slash-listbox"
                  aria-activedescendant={
                    activeCommand ? `concierge-cmd-${activeCommand.command.slice(1)}` : undefined
                  }
                  aria-label={isZh ? '詢問關於 David 的作品或輸入 / 指令' : 'Ask about David or type / for commands'}
                  placeholder={
                    isZh
                      ? '問 David 近況、技術背景，或輸入 / 使用搜尋與指令…'
                      : 'Ask about David’s projects, or type / for commands…'
                  }
                  className="max-h-28 min-h-[36px] w-full resize-none bg-transparent py-1.5 text-sm font-medium text-[#2b251a] placeholder:text-[#594e36] outline-none dark:text-[#fff9e8] dark:placeholder:text-[#d8cfbc]/75"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                <a
                  href="/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={isZh ? '站內 RSS 訂閱 (/rss.xml)' : 'Site RSS Feed (/rss.xml)'}
                  title="RSS 2.0 (/rss.xml)"
                  className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#17324d]/30 bg-[#fffefa] text-[#17324d] transition-colors hover:bg-[#fff0cc] dark:border-[#d8cfbc]/30 dark:bg-[#0f2337] dark:text-[#fff9e8] dark:hover:bg-[#17324d]"
                >
                  <Rss size={16} aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => void executeParsedCommand('/search')}
                  aria-label={isZh ? '快速搜尋作品與文章' : 'Quick search works and posts'}
                  title="/search"
                  className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#17324d]/30 bg-[#fffefa] text-[#17324d] transition-colors hover:bg-[#fff0cc] dark:border-[#d8cfbc]/30 dark:bg-[#0f2337] dark:text-[#fff9e8] dark:hover:bg-[#17324d]"
                >
                  <Search size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!input.trim() || session.busy}
                  aria-label={isZh ? '送出問題或指令' : 'Send query or command'}
                  className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#ffb010] text-[#2b251a] shadow-xs transition-colors hover:bg-[#f2a600] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17324d] dark:focus-visible:outline-[#ffb010]"
                >
                  <Send size={16} strokeWidth={2.3} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

BottomConciergeDock.displayName = 'BottomConciergeDock';
