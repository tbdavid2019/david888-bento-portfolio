import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { BentoLinkCard } from './cards/BentoLinkCard';
import { GithubCard } from './cards/GithubCard';
import { TwitterCard } from './cards/TwitterCard';
import { ExperienceCard } from './cards/ExperienceCard';
import { ProjectCard } from './cards/ProjectCard';
import { TechStackCard } from './cards/TechStackCard';
import { DesignSystemCard } from './cards/DesignSystemCard';
import linksData from '../data/bento-links.json';
import { BentoItem } from '../types';

type CategoryMeta = {
  id: string;
  label: string;
  title: string;
  summary: string;
};

const categories: CategoryMeta[] = [
  {
    id: 'social',
    label: '個人入口',
    title: '社交與內容',
    summary: '個人公開入口、內容輸出、GitHub、LinkedIn 與創業經歷。',
  },
  {
    id: 'ai',
    label: 'AI 應用',
    title: 'AI 應用與研究',
    summary: 'Hugging Face spaces、命理可視化、文件處理、投資研究與各種 AI prototype。',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    title: 'Telegram 機器人',
    summary: '資訊整理、投資新聞、截圖、摘要與日常工作流機器人。',
  },
  {
    id: 'line',
    label: 'LINE',
    title: 'LINE 機器人',
    summary: '面向台灣使用情境的 LINE OA / LINE Bot 服務入口。',
  },
  {
    id: 'tools',
    label: '實用工具',
    title: '實用工具與服務',
    summary: '資產管理、轉址追蹤、地圖、查詢工具與個人服務集合。',
  },
  {
    id: 'extensions',
    label: '瀏覽器外掛',
    title: '瀏覽器外掛',
    summary: 'Chrome 外掛：摘要、聊天、分頁整理、學單字、改字體，讓日常瀏覽和資料整理更省力。',
  },
  {
    id: 'skills',
    label: '開發技能',
    title: '專業開發技能',
    summary: '給 LLM / Agent 使用的開發文件技能與維護能力。',
  },
  {
    id: 'others',
    label: '其他',
    title: '其他作品',
    summary: '暫時不歸類但仍可瀏覽的作品。',
  },
];

const renderItem = (item: BentoItem) => {
  if (item.type === 'github') return <GithubCard data={item} />;
  if (item.type === 'twitter') return <TwitterCard data={item} />;
  if (item.type === 'experience') return <ExperienceCard data={item} />;
  if (item.type === 'project') return <ProjectCard data={item} />;
  if (item.type === 'techstack') return <TechStackCard data={item} />;
  if (item.type === 'design-system') return <DesignSystemCard data={item} />;
  return <BentoLinkCard link={item as any} />;
};

export const BentoGrid: React.FC = () => {
  const items = linksData as unknown as BentoItem[];
  const groupedItems = React.useMemo(() => {
    return items.reduce((acc, item) => {
      const tag = item.tag || 'others';
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(item);
      return acc;
    }, {} as Record<string, BentoItem[]>);
  }, [items]);

  const visibleCategories = categories.filter((category) => groupedItems[category.id]?.length);
  const [activeCategoryId, setActiveCategoryId] = React.useState(visibleCategories[0]?.id ?? 'social');

  React.useEffect(() => {
    if (!visibleCategories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(visibleCategories[0]?.id ?? 'social');
    }
  }, [activeCategoryId, visibleCategories]);

  const activeCategory =
    visibleCategories.find((category) => category.id === activeCategoryId) ?? visibleCategories[0];
  const activeItems = activeCategory ? groupedItems[activeCategory.id] ?? [] : [];
  const featuredItem = activeItems.find((item) => item.colSpan === 2) ?? activeItems[0];
  const groupedActiveSections = activeItems.reduce((acc, item) => {
    const section = item.section || '';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, BentoItem[]>);
  const activeSections = Object.entries(groupedActiveSections);

  return (
    <main className="grid gap-6 pb-16 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <ProfileCard />
      </aside>

      <section className="min-w-0 space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/85 md:p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white md:text-2xl">
                作品分類索引
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                選一個分類，看對應的 AI、機器人、外掛、工具或內容入口。
              </p>
            </div>
            <div className="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">
              {items.length} 個連結 / {visibleCategories.length} 類
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((category) => {
              const isActive = category.id === activeCategory?.id;
              const count = groupedItems[category.id]?.length ?? 0;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'border-slate-950 bg-slate-950 text-white dark:border-primary dark:bg-primary dark:text-slate-950'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{category.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/15' : 'bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeCategory && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900/70 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="text-sm font-black text-slate-500 dark:text-slate-400">
                  {activeCategory.label}
                </div>
                <h3 className="mt-1 text-2xl font-black text-slate-950 dark:text-white md:text-3xl">
                  {activeCategory.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {activeCategory.summary}
                </p>
              </div>

              {featuredItem && 'url' in featuredItem && featuredItem.url && (
                <a
                  href={featuredItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  代表作品
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {activeSections.map(([section, sectionItems]) => (
            <div key={section || 'default'} className="space-y-4">
              {section && (
                <div className="flex items-center gap-3">
                  <h4 className="shrink-0 text-sm font-black text-slate-500 dark:text-slate-400">
                    {section}
                  </h4>
                  <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {sectionItems.map((item, index) => {
                  const colSpanClass = item.colSpan === 2 ? 'sm:col-span-2' : '';

                  return (
                    <div key={`${activeCategory?.id}-${section}-${index}`} className={colSpanClass}>
                      {renderItem(item)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
