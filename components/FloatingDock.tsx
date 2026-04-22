import React from 'react';
import { Navigation, Hand, Search } from 'lucide-react';

export const FloatingDock: React.FC = () => {
  return (
    <div className="fixed bottom-12 right-1/2 translate-x-1/2 md:right-12 md:translate-x-0 z-50">
      <div className="flex items-center space-x-3 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl p-3 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        
        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-110 active:scale-90 transition-all duration-300 shadow-md">
            <Navigation size={20} className="transform -rotate-45" />
        </button>

        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary text-slate-900 shadow-lg shadow-primary/30 hover:scale-110 active:scale-90 transition-all duration-300">
            <Hand size={20} />
        </button>

        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20 dark:bg-slate-800/40 hover:bg-white/40 dark:hover:bg-slate-700/60 transition-all duration-300 text-slate-700 dark:text-slate-200">
            <Search size={20} />
        </button>

      </div>
    </div>
  );
};