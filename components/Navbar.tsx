import React from 'react';
import { Mail, Moon, Sun } from 'lucide-react';
import type { Locale } from '../types';

interface NavbarProps {
  darkMode: boolean;
  toggleTheme: () => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleTheme, locale, onLocaleChange }) => {
  return (
    <div className="fixed inset-x-0 top-3 z-50 px-4 md:top-4 md:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-border bg-bg-surface px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="min-w-0">
          <div className="truncate font-mono text-xl font-black text-text-main md:text-2xl">David888</div>
          <div className="mt-1 hidden truncate text-sm font-semibold text-text-muted sm:block">
            {locale === 'en'
              ? 'CTO / CIO / AI / ML / Games / AR / VR / Product Builder'
              : 'CTO / CIO / AI ML / 遊戲 / AR VR / 各種應用'}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 overflow-hidden rounded-full border border-border bg-bg-elevated text-xs font-black shadow-sm">
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-main shadow-sm transition-all duration-300 hover:opacity-90"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={18} className="text-primary" />
            ) : (
              <Moon size={18} className="text-text-main" />
            )}
          </button>
          <a
            href="mailto:104@david888.com"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-white dark:text-bg-base transition-all duration-300 hover:opacity-90"
          >
            <Mail size={16} />
            <span className="hidden sm:inline">104@david888.com</span>
          </a>
        </div>
      </nav>
    </div>
  );
};
