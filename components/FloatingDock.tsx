import React from 'react';
import { Navigation, Hand, Search } from 'lucide-react';

export const FloatingDock: React.FC = () => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="flex items-center space-x-2 bg-white/20 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/20 dark:border-slate-700 shadow-2xl">
        
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-lg">
            <Navigation size={18} className="transform -rotate-45 ml-0.5 mt-0.5" />
        </button>

        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors">
            <Hand size={18} />
        </button>

        <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-200">
            <Search size={18} />
        </button>

      </div>
    </div>
  );
};