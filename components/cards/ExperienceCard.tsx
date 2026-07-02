import React from 'react';
import { CardWrapper } from './CardWrapper';
import { Briefcase } from 'lucide-react';
import { ExperienceCardData } from '../../types';

export const ExperienceCard: React.FC<{ data: ExperienceCardData }> = ({ data }) => {
  return (
    <CardWrapper className="justify-center">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 rounded-lg bg-[var(--primary-glow)]">
          <Briefcase className="text-primary" size={16} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Experience</span>
      </div>

      <div className="text-4xl font-black mb-3 tracking-tighter text-text-main">{data.yearRange}</div>
      <p className="text-sm font-medium text-text-muted mb-8 leading-relaxed">
        {data.description}
      </p>

      <div className="space-y-3">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Previous Experience</div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-text-main">
          {data.history.map((item, index) => (
            <React.Fragment key={index}>
              <span className="hover:text-primary transition-colors cursor-default">{item.name}</span>
              {item.hasSeparator && (
                <span className="w-1 h-1 rounded-full bg-[var(--primary)]/40"></span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </CardWrapper>
  );
};