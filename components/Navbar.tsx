import React, { useEffect, useMemo, useRef } from 'react';
import { ExternalLink, Mail, Moon, Search, Sun, X } from 'lucide-react';
import {
  getCategoryById,
  getItemUrl,
  getLocalizedCategoryLabel,
  getLocalizedItemDescription,
  getLocalizedItemTitle,
  searchSiteItems,
} from '../lib/siteCatalog';
import type { Locale } from '../types';

interface NavbarProps {
  darkMode: boolean;
  toggleTheme: () => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onContact: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  toggleTheme,
  locale,
  onLocaleChange,
  onContact,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        if (isSearchOpen && !searchQuery) {
          onToggleSearch();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, searchQuery, onToggleSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          e.preventDefault();
          onToggleSearch();
          return;
        }
      }

      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        if (!isSearchOpen) {
          onToggleSearch();
        } else {
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, onToggleSearch]);

  const previewMatches = useMemo(() => {
    return searchQuery.trim() ? searchSiteItems(searchQuery) : [];
  }, [searchQuery]);

  const handleJumpToResults = () => {
    const el = document.getElementById('search-results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="w-full border-b-2 border-[#2b251a] bg-[#ffb010] text-[#2b251a] transition-colors">
      <nav className="dossier-shell flex items-center justify-between gap-3 py-3.5 sm:py-4">
        <a
          href="/"
          className="group flex min-w-0 flex-1 items-center gap-3 text-left text-[#2b251a] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17324d]"
        >
          <div className="flex min-h-[54px] min-w-[74px] shrink-0 flex-col items-center justify-center rounded-[10px] border-2 border-[#2b251a] bg-[#fff9e8] px-2.5 py-1.5 leading-none text-[#2b251a] shadow-[0_2px_6px_rgba(43,37,26,0.16)] transition-transform group-hover:-translate-y-0.5">
            <span className="font-mono text-2xl font-extrabold tracking-tight">888</span>
            <span className="mt-0.5 text-[10px] font-extrabold tracking-wider">DAVID</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-extrabold tracking-tight text-[#2b251a] sm:text-xl md:text-2xl">
              David Chiang
            </div>
            <div className="mt-0.5 truncate text-xs font-bold text-[#2b251a]/85 sm:text-sm">
              {locale === 'en'
                ? 'CTO & Technical Advisor · Enterprise Architecture & Leadership'
                : 'CTO & 技術顧問 ｜ 大型電商架構 · 企業系統整合 · 工程團隊帶領'}
            </div>
          </div>
        </a>

        <div className="flex shrink-0 items-center gap-2">
          {isSearchOpen ? (
            <div ref={searchContainerRef} className="relative flex items-center gap-1.5">
              <div className="flex h-10 w-44 items-center gap-2 rounded-full border-2 border-[#17324d] bg-[#fffefa] px-3 text-[#2b251a] shadow-xs transition-all duration-200 focus-within:ring-2 focus-within:ring-[#17324d]/30 sm:w-56 md:w-64">
                <Search size={16} className="shrink-0 text-[#594e36]" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleJumpToResults();
                    }
                  }}
                  aria-expanded={searchQuery.trim().length > 0}
                  placeholder={locale === 'en' ? 'Search portfolio...' : '搜尋作品、主題…'}
                  className="w-full bg-transparent text-xs font-bold text-[#2b251a] placeholder:text-[#594e36] outline-none sm:text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="shrink-0 rounded-full p-0.5 text-[#594e36] transition-colors hover:text-[#2b251a]"
                    aria-label={locale === 'en' ? 'Clear search' : '清除搜尋'}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onToggleSearch}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#17324d] bg-[#fff9e8] text-[#2b251a] shadow-xs transition-colors hover:bg-[#fff0cc]"
                aria-label={locale === 'en' ? 'Close search (Esc)' : '關閉搜尋 (Esc)'}
                title="Esc"
              >
                <X size={16} />
              </button>

              {searchQuery.trim().length > 0 && (
                <div
                  className="absolute right-0 top-full mt-2.5 z-50 w-[310px] sm:w-[400px] md:w-[460px] rounded-xl border-2 border-[#17324d] bg-[#fffefa] text-[#2b251a] shadow-[0_16px_36px_rgba(23,50,77,0.28)] overflow-hidden dark:bg-[#152332] dark:border-[#ffb010] dark:text-[#fff9e8]"
                >
                  <div className="flex items-center justify-between border-b border-border/60 bg-[#fff9e8] px-3.5 py-2 text-xs font-bold dark:bg-[#17324d]/60">
                    <div className="flex items-center gap-1.5 text-text-main">
                      <Search size={13} className="text-[#a9471d] dark:text-[#ffb010]" />
                      <span>
                        {locale === 'en'
                          ? `Found ${previewMatches.length} works`
                          : `即時搜尋：找到 ${previewMatches.length} 個作品`}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-text-muted">
                      {locale === 'en' ? 'Enter ↵ to jump' : '按 Enter 直達下方'}
                    </span>
                  </div>

                  {previewMatches.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm font-bold text-text-muted">
                        {locale === 'en'
                          ? `No works found for "${searchQuery}"`
                          : `找不到符合「${searchQuery}」的作品`}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                        <span className="text-xs text-text-muted">
                          {locale === 'en' ? 'Try:' : '建議搜尋：'}
                        </span>
                        {['Store Pulse', 'StockBot', '2MD', '888news', 'TTS', '奇門遁甲'].map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => onSearchChange(term)}
                            className="rounded-md border border-border bg-bg-surface px-2 py-0.5 text-xs font-bold text-[#17324d] hover:bg-[#ffb010]/20 dark:text-[#ffb010]"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[300px] overflow-y-auto divide-y divide-border/40">
                        {previewMatches.slice(0, 5).map((item) => {
                          const title = getLocalizedItemTitle(item, locale);
                          const category = getCategoryById(item.tag || 'others');
                          const catLabel = category ? getLocalizedCategoryLabel(category, locale) : item.tag;
                          const desc = getLocalizedItemDescription(item, locale);
                          const url = getItemUrl(item);
                          const itemKey = url || ('id' in item && item.id) || title;

                          if (!url) {
                            return (
                              <button
                                key={itemKey}
                                type="button"
                                onClick={handleJumpToResults}
                                className="group flex w-full items-start justify-between gap-3 p-3 text-left transition-colors hover:bg-[#fff9e8] dark:hover:bg-[#1a2b3d]"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded bg-[#17324d]/10 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#17324d] dark:bg-[#ffb010]/20 dark:text-[#ffb010]">
                                      {catLabel}
                                    </span>
                                    <span className="truncate text-xs font-extrabold text-text-main group-hover:text-[#a9471d] dark:group-hover:text-[#ffb010] sm:text-sm">
                                      {title}
                                    </span>
                                  </div>
                                  {desc && (
                                    <p className="mt-1 line-clamp-1 text-[11px] text-text-muted">
                                      {desc}
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          }

                          return (
                            <a
                              key={itemKey}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-start justify-between gap-3 p-3 transition-colors hover:bg-[#fff9e8] dark:hover:bg-[#1a2b3d] no-underline"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-[#17324d]/10 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#17324d] dark:bg-[#ffb010]/20 dark:text-[#ffb010]">
                                    {catLabel}
                                  </span>
                                  <span className="truncate text-xs font-extrabold text-text-main group-hover:text-[#a9471d] dark:group-hover:text-[#ffb010] sm:text-sm">
                                    {title}
                                  </span>
                                </div>
                                {desc && (
                                  <p className="mt-1 line-clamp-1 text-[11px] text-text-muted">
                                    {desc}
                                  </p>
                                )}
                              </div>
                              <ExternalLink size={14} className="mt-1 shrink-0 text-text-muted group-hover:text-text-main" />
                            </a>
                          );
                        })}
                      </div>

                      <div className="border-t border-border/60 bg-[#fff9e8]/70 p-2 dark:bg-[#17324d]/30">
                        <button
                          type="button"
                          onClick={handleJumpToResults}
                          className="btn-saffron flex w-full items-center justify-center gap-1.5 py-2 text-xs font-bold"
                        >
                          <span>
                            {locale === 'en'
                              ? `View all ${previewMatches.length} results in page ⇣`
                              : `在頁面中檢視全部 ${previewMatches.length} 個作品 ⇣`}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleSearch}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2b251a] bg-[#fff9e8] text-[#2b251a] shadow-xs transition-colors hover:bg-[#fff0cc]"
              aria-label={locale === 'en' ? 'Search (Press /)' : '搜尋（按 /）'}
              title={locale === 'en' ? 'Search (Press /)' : '搜尋（按 / 快捷鍵）'}
            >
              <Search size={17} />
            </button>
          )}

          <div className={`flex h-10 overflow-hidden rounded-full border border-[#2b251a] bg-[#fff9e8] text-xs font-extrabold shadow-xs ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
            <button
              type="button"
              onClick={() => onLocaleChange('zh')}
              className={`px-3 transition-colors ${locale === 'zh' ? 'bg-[#17324d] text-[#fff9e8]' : 'text-[#2b251a] hover:bg-[#fff0cc]'}`}
              aria-pressed={locale === 'zh'}
            >
              繁
            </button>
            <button
              type="button"
              onClick={() => onLocaleChange('en')}
              className={`px-3 transition-colors ${locale === 'en' ? 'bg-[#17324d] text-[#fff9e8]' : 'text-[#2b251a] hover:bg-[#fff0cc]'}`}
              aria-pressed={locale === 'en'}
            >
              EN
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className={`h-10 w-10 items-center justify-center rounded-full border border-[#2b251a] bg-[#fff9e8] text-[#2b251a] shadow-xs transition-colors hover:bg-[#fff0cc] ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={17} className="text-[#a9471d]" />
            ) : (
              <Moon size={17} className="text-[#17324d]" />
            )}
          </button>

          <button
            type="button"
            onClick={onContact}
            className={`h-10 w-10 items-center justify-center gap-0 rounded-full border-2 border-[#17324d] bg-[#17324d] px-0 text-sm font-extrabold text-[#fff9e8] shadow-xs transition-all duration-200 hover:bg-[#0f2337] sm:w-auto sm:gap-2 sm:px-4 ${isSearchOpen ? 'hidden md:inline-flex' : 'inline-flex'}`}
            aria-label={locale === 'zh' ? '聯絡我' : 'Contact me'}
          >
            <Mail size={16} />
            <span className="hidden sm:inline">{locale === 'zh' ? '聯絡我' : 'Contact me'}</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
