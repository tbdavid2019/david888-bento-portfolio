import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleTheme }) => {
  return (
    <nav className="flex justify-between items-center mb-12 px-2">
      <div className="font-bold text-xl tracking-tight select-none">David888</div>

      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 focus:outline-none"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <Sun size={20} className="text-slate-100" />
          ) : (
            <Moon size={20} className="text-slate-700" />
          )}
        </button>
        <a
          href="https://t.me/a7a8a9abc"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Let's Chat
        </a>
      </div>
    </nav >
  );
};