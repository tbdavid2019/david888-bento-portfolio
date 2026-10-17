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

  return (
    <header className="w-full border-b-2 border-[#2b251a] bg-[#ffb010] text-[#2b251a] transition-colors">
      <nav className="dossier-shell flex flex-wrap items-center justify-between gap-3 py-3.5 sm:py-4">
        <a
          href="/"
          className="group flex min-w-0 items-center gap-3 text-left text-[#2b251a] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17324d]"
        >
          <div className="flex min-h-[54px] min-w-[74px] shrink-0 flex-col items-center justify-center rounded-[10px] border-2 border-[#2b251a] bg-[#fff9e8] px-2.5 py-1.5 leading-none text-[#2b251a] shadow-[0_2px_6px_rgba(43,37,26,0.16)] transition-transform group-hover:-translate-y-0.5">
            <span className="font-mono text-2xl font-extrabold tracking-tight">888</span>
            <span className="mt-0.5 text-[10px] font-extrabold tracking-wider">DAVID</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-extrabold tracking-tight text-[#2b251a] sm:text-xl md:text-2xl">
              David Chiang
            </div>
            <div className="mt-0.5 truncate text-xs font-bold text-[#2b251a]/85 sm:text-sm">
              {locale === 'en'
                ? 'Hands-On CTO & Principal Advisor · 300+ Org Leadership & Production AI'
                : '實戰派 CTO & 企業首席顧問 ｜ 百人研發治理 × AI 原生系統'}
            </div>
          </div>
        </a>

        <div className="flex shrink-0 items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center gap-1.5">
              <div className="flex h-10 w-44 items-center gap-2 rounded-full border-2 border-[#17324d] bg-[#fffefa] px-3 text-[#2b251a] shadow-xs transition-all duration-200 focus-within:ring-2 focus-within:ring-[#17324d]/30 sm:w-56 md:w-64">
                <Search size={16} className="shrink-0 text-[#594e36]" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
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
