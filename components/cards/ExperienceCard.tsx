import React from 'react';
import { CardWrapper } from './CardWrapper';
import { Briefcase } from 'lucide-react';
import { ExperienceCardData } from '../../types';

export const ExperienceCard: React.FC<{ data: ExperienceCardData }> = ({ data }) => {
  return (
    <CardWrapper className="justify-center">
      <div className="flex items-center space-x-2 mb-4">
        <Briefcase className="text-slate-400" size={18} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience</span>
      </div>

      <div className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">{data.yearRange}</div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-sm">
        {data.description}
      </p>

      <div className="space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previously</div>
        <div className="flex items-center space-x-6 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          {data.history.map((item, index) => (
            <React.Fragment key={index}>
              <span>{item.name}</span>
              {item.hasSeparator && (
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </CardWrapper>
  );
};