import React from 'react';
import { ProfileCard } from './ProfileCard';
import { BentoLinkCard } from './cards/BentoLinkCard';
import { GithubCard } from './cards/GithubCard';
import { TwitterCard } from './cards/TwitterCard';
import { ExperienceCard } from './cards/ExperienceCard';
import { ProjectCard } from './cards/ProjectCard';
import { TechStackCard } from './cards/TechStackCard';
import { DesignSystemCard } from './cards/DesignSystemCard';
import profileData from '../data/bento-profile.json';
import linksData from '../data/bento-links.json';
import { BentoItem } from '../types';

export const BentoGrid: React.FC = () => {
  const items = linksData as unknown as BentoItem[];

  // Helper to categorize items
  const categorize = (item: BentoItem): string => {
    return item.tag || 'others';
  };

  const categories = [
    { id: 'social', title: '社交與內容 Social & Content' },
    { id: 'line', title: 'LINE 機器人家族 LINE Bots' },
    { id: 'telegram', title: 'Telegram 機器人家族 Telegram Bots' },
    { id: 'ai', title: 'AI 應用與研究 AI Applications' },
    { id: 'tools', title: '實用工具與服務 Handy Tools' },
    { id: 'extensions', title: '瀏覽器外掛 Extensions' },
    { id: 'skills', title: '專業開發技能 Dev Skills' },
    { id: 'others', title: '其他作品 Others' },
  ];

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const cat = categorize(item);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, BentoItem[]>);

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-8 items-start mb-20">
      <div className="lg:sticky lg:top-8">
        <ProfileCard />
      </div>
      
      <div className="space-y-16">
        {categories.map(category => {
          const catItems = groupedItems[category.id];
          if (!catItems || catItems.length === 0) return null;

          return (
            <section key={category.id} className="space-y-6">
              <div className="flex items-center space-x-4 px-2">
                <h2 className="text-lg font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {category.title}
                </h2>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800/50"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {catItems.map((item, index) => {
                  const colSpanClass = item.colSpan === 2 ? 'sm:col-span-2' : '';

                  return (
                    <div key={`${category.id}-${index}`} className={colSpanClass}>
                      {item.type === 'github' && <GithubCard data={item} />}
                      {item.type === 'twitter' && <TwitterCard data={item} />}
                      {item.type === 'experience' && <ExperienceCard data={item} />}
                      {item.type === 'project' && <ProjectCard data={item} />}
                      {item.type === 'techstack' && <TechStackCard data={item} />}
                      {item.type === 'design-system' && <DesignSystemCard data={item} />}
                      {(!item.type || item.type === 'link') && <BentoLinkCard link={item as any} />}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
};
