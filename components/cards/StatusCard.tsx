import React from 'react';
import { CardWrapper } from './CardWrapper';

export const StatusCard: React.FC = () => {
  return (
    <CardWrapper className="flex flex-col justify-center">
      <div className="flex items-center space-x-3 mb-4">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</span>
      </div>
      <div className="text-base font-bold text-slate-900 dark:text-white mb-2">Available for Freelance</div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Open to new remote opportunities starting Q3.
      </p>
    </CardWrapper>
  );
};