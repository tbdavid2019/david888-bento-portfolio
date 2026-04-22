import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleTheme }) => {
  return (
    <nav className="flex justify-between items-center mb-16 px-2">
      <div className="font-black text-2xl tracking-tighter select-none text-slate-900 dark:text-white">David888</div>

      <div className="flex items-center space-x-6">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-black/[0.05] dark:border-white/[0.05] transition-all duration-300 focus:outline-none"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <Sun size={18} className="text-primary" />
          ) : (
            <Moon size={18} className="text-slate-700" />
          )}
        </button>
        <a
          href="https://t.me/a7a8a9abc"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-slate-900 px-8 py-3 rounded-full text-sm font-black tracking-wide hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-primary/20"
        >
          LET'S CHAT
        </a>
      </div>
    </nav >
  );
};