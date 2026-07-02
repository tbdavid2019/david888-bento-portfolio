import React from 'react';
import { CardWrapper } from './CardWrapper';
import {
  FileJson,
  Code2,
  Database,
  Terminal,
  Palette,
  Layers,
  Globe,
  LayoutGrid
} from 'lucide-react';
import { TechStackCardData } from '../../types';

export const TechStackCard: React.FC<{ data: TechStackCardData }> = ({ data }) => {
  const tools = [
    { icon: <FileJson className="w-6 h-6" />, label: "JavaScript" },
    { icon: <Code2 className="w-6 h-6" />, label: "React" },
    { icon: <Database className="w-6 h-6" />, label: "Storage" },
    { icon: <Terminal className="w-6 h-6" />, label: "Terminal" },
    { icon: <Palette className="w-6 h-6" />, label: "Design" },
    { icon: <Layers className="w-6 h-6" />, label: "Stack" },
    { icon: <Globe className="w-6 h-6" />, label: "Web" },
    { icon: <LayoutGrid className="w-6 h-6" />, label: "UI" },
  ];

  return (
    <CardWrapper className="relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="font-bold text-2xl mb-2 tracking-tight text-text-main">{data.title || 'Tech Stack'}</h3>
        <p className="text-text-muted text-sm mb-10 font-medium">{data.subtitle || 'Tools I use to bring ideas to life'}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="aspect-square bg-bg-elevated rounded-3xl flex items-center justify-center group hover:bg-[var(--primary-glow)] transition-all duration-500 shadow-sm border border-border"
            >
              <div className="text-text-muted group-hover:text-text-main group-hover:scale-125 transition-all duration-500 ease-out">
                {tool.icon}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Decorative Blur */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[var(--primary-glow)] rounded-full blur-[100px] pointer-events-none"></div>
    </CardWrapper>
  );
};