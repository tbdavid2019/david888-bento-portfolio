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
    label: 'Profile',
    title: '社交與內容',
    summary: '個人公開入口、內容輸出、GitHub、LinkedIn 與創業經歷。',
  },
  {
    id: 'ai',
    label: 'AI Apps',
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
    label: 'Tools',
    title: '實用工具與服務',
    summary: '資產管理、轉址追蹤、地圖、查詢工具與個人服務集合。',
  },
  {
    id: 'extensions',
    label: 'Extensions',
    title: '瀏覽器外掛',
    summary: 'Chrome extension、生產力、學習、聊天與網址處理工具。',
  },
  {
    id: 'skills',
    label: 'Dev Skills',
    title: '專業開發技能',
    summary: '給 LLM / Agent 使用的開發文件技能與維護能力。',
  },
  {
    id: 'others',
    label: 'Others',
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

  return (
    <main className="grid gap-6 pb-16 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <ProfileCard />
      </aside>

      <section className="min-w-0 space-y-6">
        <div className="rounded-3xl border border-black/[0.05] bg-white/85 p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.38)] backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/85 md:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white md:text-3xl">
                作品分類索引
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                這裡不是履歷頁，是 David888 的產品與工具目錄。選一個分類，看對應的 AI、機器人、外掛、工具或內容入口。
              </p>
            </div>
            <div className="shrink-0 text-sm font-bold text-slate-500 dark:text-slate-400">
              {items.length} links / {visibleCategories.length} groups
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
            {visibleCategories.map((category) => {
              const isActive = category.id === activeCategory?.id;
              const count = groupedItems[category.id]?.length ?? 0;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`min-h-[76px] rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-slate-950 bg-slate-950 text-white dark:border-primary dark:bg-primary dark:text-slate-950'
                      : 'border-black/[0.05] bg-slate-50 text-slate-700 hover:bg-white dark:border-white/[0.08] dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="truncate text-sm font-black">{category.label}</div>
                  <div className="mt-2 text-xs font-semibold opacity-70">{count} items</div>
                </button>
              );
            })}
          </div>
        </div>

        {activeCategory && (
          <div className="rounded-3xl border border-black/[0.05] bg-white/70 p-5 dark:border-white/[0.08] dark:bg-slate-900/70 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="text-sm font-black text-slate-500 dark:text-slate-400">
                  {activeCategory.label}
                </div>
                <h3 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {activeItems.map((item, index) => {
            const colSpanClass = item.colSpan === 2 ? 'sm:col-span-2' : '';

            return (
              <div key={`${activeCategory?.id}-${index}`} className={colSpanClass}>
                {renderItem(item)}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
