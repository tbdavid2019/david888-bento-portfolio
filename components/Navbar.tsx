import React from 'react';
import { Mail, Moon, Sun } from 'lucide-react';
import type { Locale } from '../App';

interface NavbarProps {
  darkMode: boolean;
  toggleTheme: () => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleTheme, locale, onLocaleChange }) => {
  return (
    <div className="fixed inset-x-0 top-3 z-50 px-4 md:top-4 md:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/60 bg-[rgba(247,241,230,0.82)] px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(15,23,42,0.78)]">
        <div className="min-w-0">
          <div className="truncate font-mono text-xl font-black text-slate-950 dark:text-white md:text-2xl">David888</div>
          <div className="mt-1 hidden truncate text-sm font-semibold text-slate-500 dark:text-slate-400 sm:block">
            {locale === 'en'
              ? 'CTO / CIO / AI / ML / Games / AR / VR / Product Builder'
              : 'CTO / CIO / AI ML / 遊戲 / AR VR / 各種應用'}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 overflow-hidden rounded-full border border-black/[0.06] bg-white/90 text-xs font-black shadow-sm dark:border-white/[0.08] dark:bg-slate-900/90">
            <button
              type="button"
              onClick={() => onLocaleChange('zh')}
              className={`px-3 transition-colors ${locale === 'zh' ? 'bg-slate-950 text-white dark:bg-primary dark:text-slate-950' : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'}`}
              aria-pressed={locale === 'zh'}
            >
              繁
            </button>
            <button
              type="button"
              onClick={() => onLocaleChange('en')}
              className={`px-3 transition-colors ${locale === 'en' ? 'bg-slate-950 text-white dark:bg-primary dark:text-slate-950' : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'}`}
              aria-pressed={locale === 'en'}
            >
              EN
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] bg-white/90 text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={18} className="text-primary" />
            ) : (
              <Moon size={18} className="text-slate-700" />
            )}
          </button>
          <a
            href="mailto:104@david888.com"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition-all duration-300 hover:bg-slate-800 dark:bg-primary dark:text-slate-950 dark:hover:bg-[#ffd9c8]"
          >
            <Mail size={16} />
            <span className="hidden sm:inline">104@david888.com</span>
          </a>
        </div>
      </nav>
    </div>
  );
};
