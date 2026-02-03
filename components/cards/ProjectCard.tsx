import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import { ProjectCardData } from '../../types';

export const ProjectCard: React.FC<{ data: ProjectCardData }> = ({ data }) => {
  return (
    <CardWrapper noPadding onClick={() => data.url && window.open(data.url, '_blank')} className="group cursor-pointer">
      <div className="p-6 md:p-8 flex flex-col h-full">
        <div className="mb-auto">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 block">
            {data.label || 'Featured Project'}
          </span>
          <h3 className="font-bold text-2xl mb-3 text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            {data.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {data.description}
          </p>
          <div className="flex items-center text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            {data.linkText || 'View Case Study'}
            <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {data.previewImage && (
        <div className="h-48 bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-700/50 flex items-end justify-center overflow-hidden">
          <div className="w-full h-full relative transform translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
            <img
              src={data.previewImage}
              alt={`${data.title} Preview`}
              className="w-full h-full object-cover object-top rounded-t-lg shadow-xl"
            />
          </div>
        </div>
      )}
    </CardWrapper>
  );
};