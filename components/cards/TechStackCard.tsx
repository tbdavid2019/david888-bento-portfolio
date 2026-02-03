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
        <h3 className="font-bold text-xl mb-2 text-slate-900 dark:text-white">{data.title || 'Tech Stack'}</h3>
        <p className="text-slate-500 text-sm mb-8">{data.subtitle || 'Tools I use to bring ideas to life'}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-300"
            >
              <div className="text-primary/80 group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                {tool.icon}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Decorative Blur */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
    </CardWrapper>
  );
};