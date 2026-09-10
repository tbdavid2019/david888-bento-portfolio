import React, { useEffect, useRef } from 'react';
import { Mail, Moon, Search, Sun, X } from 'lucide-react';
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

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (e.key === 'Escape' && isSearchOpen) {
        e.preventDefault();
        onToggleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, onToggleSearch]);

  return (
    <div className="fixed inset-x-0 top-3 z-50 px-4 md:top-4 md:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[28px] border border-border bg-bg-surface px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="min-w-0">
          <div className="truncate font-mono text-xl font-black text-text-main md:text-2xl">David888</div>
          <div className="mt-1 hidden truncate text-sm font-semibold text-text-muted sm:block">
            {locale === 'en'
              ? 'CTO / CIO / AI / ML / Games / AR / VR / Product Builder'
              : 'CTO / CIO / AI ML / 遊戲 / AR VR / 各種應用'}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center gap-1.5">
              <div className="flex h-10 w-44 items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 shadow-sm transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 xs:w-52 sm:w-60 md:w-72">
                <Search size={16} className="shrink-0 text-text-muted" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={locale === 'en' ? 'Search portfolio...' : '搜尋作品、主題…'}
                  className="w-full bg-transparent text-xs font-bold text-text-main placeholder:text-text-muted/60 outline-none sm:text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="shrink-0 rounded-full p-0.5 text-text-muted transition-colors hover:text-text-main"
                    aria-label={locale === 'en' ? 'Clear search' : '清除搜尋'}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onToggleSearch}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-muted shadow-sm transition-colors hover:text-text-main"
                aria-label={locale === 'en' ? 'Close search (Esc)' : '關閉搜尋 (Esc)'}
                title="Esc"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleSearch}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-main shadow-sm transition-all duration-300 hover:opacity-90"
              aria-label={locale === 'en' ? 'Search (Press /)' : '搜尋（按 /）'}
              title={locale === 'en' ? 'Search (Press /)' : '搜尋（按 / 快捷鍵）'}
            >
              <Search size={18} />
            </button>
          )}

          <div className={`flex h-10 overflow-hidden rounded-full border border-border bg-bg-elevated text-xs font-black shadow-sm ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
            <button
              type="button"
              onClick={() => onLocaleChange('zh')}
              className={`px-3 transition-colors ${locale === 'zh' ? 'bg-primary text-white dark:text-bg-base' : 'text-text-muted hover:text-text-main'}`}
              aria-pressed={locale === 'zh'}
            >
              繁
            </button>
            <button
              type="button"
              onClick={() => onLocaleChange('en')}
              className={`px-3 transition-colors ${locale === 'en' ? 'bg-primary text-white dark:text-bg-base' : 'text-text-muted hover:text-text-main'}`}
              aria-pressed={locale === 'en'}
            >
              EN
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className={`h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-main shadow-sm transition-all duration-300 hover:opacity-90 ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={18} className="text-primary" />
            ) : (
              <Moon size={18} className="text-text-main" />
            )}
          </button>
          <button
            type="button"
            onClick={onContact}
            className={`h-10 w-10 items-center justify-center gap-0 rounded-full bg-primary px-0 text-sm font-black text-white transition-all duration-300 hover:opacity-90 dark:text-bg-base sm:w-auto sm:gap-2 sm:px-4 ${isSearchOpen ? 'hidden xs:inline-flex' : 'inline-flex'}`}
            aria-label={locale === 'zh' ? '聯絡我' : 'Contact me'}
          >
            <Mail size={16} />
            <span className="hidden sm:inline">{locale === 'zh' ? '聯絡我' : 'Contact me'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
