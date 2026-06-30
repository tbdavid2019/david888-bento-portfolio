import React from 'react';
import { Mail, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleTheme }) => {
  return (
    <nav className="mb-6 flex items-center justify-between gap-4 px-1 md:mb-8">
      <div>
        <div className="font-mono text-2xl font-black text-slate-950 dark:text-white">David888</div>
        <div className="mt-1 hidden text-sm font-semibold text-slate-500 dark:text-slate-400 sm:block">
          CTO / CIO / AI ML / 遊戲 / AR VR / 各種應用
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.06] bg-white text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
          className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition-all duration-300 hover:bg-slate-800 dark:bg-primary dark:text-slate-950 dark:hover:bg-[#ffd9c8]"
        >
          <Mail size={16} />
          <span className="hidden sm:inline">104@david888.com</span>
        </a>
      </div>
    </nav >
  );
};
