import React from 'react';
import { CardWrapper } from './CardWrapper';
import { ArrowUpRight, FolderOpen } from 'lucide-react';
import { DesignSystemCardData } from '../../types';

export const DesignSystemCard: React.FC<{ data: DesignSystemCardData }> = ({ data }) => {
  return (
    <CardWrapper onClick={() => data.url && window.open(data.url, '_blank')} className="justify-between min-h-[160px]">
      <div className="flex justify-between items-start">
        <FolderOpen className="text-text-muted group-hover:text-primary transition-colors" size={28} />
        <ArrowUpRight className="text-text-muted opacity-60 group-hover:text-text-main transition-colors" size={20} />
      </div>
      <div>
        <div className="text-sm font-bold text-text-main mb-1">{data.title}</div>
        <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{data.subtitle}</div>
      </div>
    </CardWrapper>
  );
};