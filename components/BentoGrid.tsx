import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { BentoLinkCard } from './cards/BentoLinkCard';
import { GithubCard } from './cards/GithubCard';
import { TwitterCard } from './cards/TwitterCard';
import { ProjectCard } from './cards/ProjectCard';
import { TechStackCard } from './cards/TechStackCard';
import { DesignSystemCard } from './cards/DesignSystemCard';
import linksData from '../data/bento-links.json';
import { BentoItem } from '../types';
import type { Locale } from '../App';

type CategoryMeta = {
  id: string;
  label: string;
  labelEn: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
};

const categories: CategoryMeta[] = [
  {
    id: 'social',
    label: '個人入口',
    labelEn: 'Profile',
    title: '社交與內容',
    titleEn: 'Profile & Content',
    summary: '個人公開入口、內容輸出、GitHub、LinkedIn 與創業經歷。',
    summaryEn: 'Public profiles, content channels, GitHub, LinkedIn, and founder experience.',
  },
  {
    id: 'extensions',
    label: '瀏覽器外掛',
    labelEn: 'Extensions',
    title: '瀏覽器外掛',
    titleEn: 'Chrome Extensions',
    summary: 'Chrome 外掛：摘要、聊天、分頁整理、學單字、改字體，讓日常瀏覽和資料整理更省力。',
    summaryEn: 'Chrome extensions for summarizing pages, chatting on websites, organizing tabs, learning vocabulary, and improving reading.',
  },
  {
    id: 'tools',
    label: '實用工具',
    labelEn: 'Tools',
    title: '實用工具與服務',
    titleEn: 'Tools & Services',
    summary: '這裡收的是高頻實用入口：內部工具、團隊知識庫、URL 轉 Markdown、決策輔助與各種真的有人每天在用的效率服務。',
    summaryEn: 'A collection of high-frequency practical tools: internal utilities, team wiki workflows, URL-to-Markdown helpers, decision aids, and daily-use productivity services.',
  },
  {
    id: 'skills',
    label: '開發技能',
    labelEn: 'Dev Skills',
    title: '專業開發技能',
    titleEn: 'Developer Skills',
    summary: '給 LLM、Agent 與工程團隊使用的技能文件、API 與開發知識。',
    summaryEn: 'Skills, APIs, and documentation packs for LLMs, agents, and engineering teams.',
  },
  {
    id: 'ai',
    label: 'AI 應用',
    labelEn: 'AI Apps',
    title: 'AI 應用與研究',
    titleEn: 'AI Apps & Research',
    summary: 'Hugging Face spaces、命理可視化、文件處理、投資研究與各種 AI prototype。',
    summaryEn: 'AI prototypes across Hugging Face Spaces, document workflows, investment research, and experimental tools.',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    labelEn: 'Telegram',
    title: 'Telegram 機器人',
    titleEn: 'Telegram Bots',
    summary: '資訊整理、投資新聞、截圖、摘要與日常工作流機器人。',
    summaryEn: 'Bots for summaries, investment news, screenshots, and daily information workflows.',
  },
  {
    id: 'line',
    label: 'LINE',
    labelEn: 'LINE',
    title: 'LINE 機器人',
    titleEn: 'LINE Bots',
    summary: '面向台灣使用情境的 LINE OA / LINE Bot 服務入口。',
    summaryEn: 'LINE OA and LINE Bot services designed around Taiwan-first usage patterns.',
  },
  {
    id: 'others',
    label: '其他',
    labelEn: 'Other',
    title: '其他作品',
    titleEn: 'Other Work',
    summary: '暫時不歸類但仍可瀏覽的作品。',
    summaryEn: 'Additional work that does not fit into the main categories.',
  },
];

const renderItem = (item: BentoItem, locale: Locale) => {
  if (item.type === 'github') return <GithubCard data={item} />;
  if (item.type === 'twitter') return <TwitterCard data={item} />;
  if (item.type === 'project') return <ProjectCard data={item} />;
  if (item.type === 'techstack') return <TechStackCard data={item} />;
  if (item.type === 'design-system') return <DesignSystemCard data={item} />;
  return <BentoLinkCard link={item as any} locale={locale} />;
};

interface BentoGridProps {
  locale: Locale;
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ locale, activeCategoryId, onCategoryChange }) => {
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
  React.useEffect(() => {
    if (!visibleCategories.some((category) => category.id === activeCategoryId)) {
      onCategoryChange(visibleCategories[0]?.id ?? 'social');
    }
  }, [activeCategoryId, onCategoryChange, visibleCategories]);

  const activeCategory =
    visibleCategories.find((category) => category.id === activeCategoryId) ?? visibleCategories[0];
  const activeItems = activeCategory ? groupedItems[activeCategory.id] ?? [] : [];
  const featuredItem = activeItems.find((item) => item.colSpan === 2) ?? activeItems[0];
  const groupedActiveSections = activeItems.reduce((acc, item) => {
    const section = locale === 'en' ? item.sectionEn || item.section || '' : item.section || '';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, BentoItem[]>);
  const activeSections = Object.entries(groupedActiveSections);

  return (
    <main className="grid gap-6 pb-16 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <ProfileCard locale={locale} />
      </aside>

      <section className="min-w-0 space-y-6">
        <div className="rounded-2xl border border-border bg-bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-text-muted">
              {locale === 'en' ? 'Categories' : '分類'}
            </div>
            <div className="shrink-0 text-xs font-bold text-text-muted">
              {locale === 'en'
                ? `${items.length} links / ${visibleCategories.length} groups`
                : `${items.length} 個連結 / ${visibleCategories.length} 類`}
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
                  onClick={() => onCategoryChange(category.id)}
                  className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'border-primary bg-primary text-white dark:text-bg-base'
                      : 'border-border bg-bg-elevated text-text-muted hover:border-border-hover hover:text-text-main'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{locale === 'en' ? category.labelEn : category.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/15' : 'bg-bg-surface text-text-muted'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeCategory && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-surface px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-text-muted opacity-80">
                {locale === 'en' ? activeCategory.labelEn : activeCategory.label}
              </div>
              <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
                <h3 className="text-xl font-black text-text-main md:text-2xl">
                  {locale === 'en' ? activeCategory.titleEn : activeCategory.title}
                </h3>
                <p className="max-w-2xl text-sm text-text-muted">
                  {locale === 'en' ? activeCategory.summaryEn : activeCategory.summary}
                </p>
              </div>
            </div>

            {featuredItem && 'url' in featuredItem && featuredItem.url && (
              <a
                href={featuredItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-text-main px-4 text-sm font-black text-text-main transition-colors hover:bg-text-main hover:text-bg-base"
              >
                {locale === 'en' ? 'Featured' : '代表作品'}
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        )}

        <div className="space-y-8">
          {activeSections.map(([section, sectionItems]) => (
            <div key={section || 'default'} className="space-y-4">
              {section && (
                <div className="flex items-center gap-3">
                  <h4 className="shrink-0 text-sm font-black text-text-muted">
                    {section}
                  </h4>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {sectionItems.map((item, index) => {
                  const colSpanClass = item.colSpan === 2 ? 'sm:col-span-2' : '';

                  return (
                    <div key={`${activeCategory?.id}-${section}-${index}`} className={colSpanClass}>
                      {renderItem(item, locale)}
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
