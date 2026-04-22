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
        <h3 className="font-bold text-2xl mb-2 tracking-tight text-slate-900 dark:text-white">{data.title || 'Tech Stack'}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 font-medium">{data.subtitle || 'Tools I use to bring ideas to life'}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="aspect-square bg-slate-50 dark:bg-slate-800/40 rounded-3xl flex items-center justify-center group hover:bg-primary/20 transition-all duration-500 shadow-sm border border-black/[0.03] dark:border-white/[0.03]"
            >
              <div className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-125 transition-all duration-500 ease-out">
                {tool.icon}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Decorative Blur */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
    </CardWrapper>
  );
};