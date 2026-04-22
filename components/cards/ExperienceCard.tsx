import React from 'react';
import { CardWrapper } from './CardWrapper';
import { Briefcase } from 'lucide-react';
import { ExperienceCardData } from '../../types';

export const ExperienceCard: React.FC<{ data: ExperienceCardData }> = ({ data }) => {
  return (
    <CardWrapper className="justify-center">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 rounded-lg bg-primary/20 text-primary-dark">
          <Briefcase className="text-slate-700 dark:text-slate-300" size={16} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Experience</span>
      </div>

      <div className="text-4xl font-black mb-3 tracking-tighter text-slate-900 dark:text-white">{data.yearRange}</div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        {data.description}
      </p>

      <div className="space-y-3">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Previous Experience</div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {data.history.map((item, index) => (
            <React.Fragment key={index}>
              <span className="hover:text-primary transition-colors cursor-default">{item.name}</span>
              {item.hasSeparator && (
                <span className="w-1 h-1 rounded-full bg-primary/40"></span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </CardWrapper>
  );
};