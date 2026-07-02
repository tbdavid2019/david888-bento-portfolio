import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import { ProjectCardData } from '../../types';

export const ProjectCard: React.FC<{ data: ProjectCardData }> = ({ data }) => {
  return (
    <CardWrapper noPadding onClick={() => data.url && window.open(data.url, '_blank')} className="group cursor-pointer">
      <div className="p-6 md:p-8 flex flex-col h-full">
        <div className="mb-auto">
          <span className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-3 block">
            {data.label || 'Featured Project'}
          </span>
          <h3 className="font-bold text-2xl mb-3 text-text-main group-hover:text-primary transition-colors">
            {data.title}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            {data.description}
          </p>
          <div className="flex items-center text-sm font-bold text-text-main group-hover:text-primary transition-colors">
            {data.linkText || 'View Case Study'}
            <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {data.previewImage && (
        <div className="h-48 bg-bg-elevated p-6 border-t border-border flex items-end justify-center overflow-hidden">
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