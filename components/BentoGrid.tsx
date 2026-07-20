import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ProfileCard } from './ProfileCard';
import { BentoLinkCard } from './cards/BentoLinkCard';
import { GithubCard } from './cards/GithubCard';
import { TwitterCard } from './cards/TwitterCard';
import { ProjectCard } from './cards/ProjectCard';
import { TechStackCard } from './cards/TechStackCard';
import { DesignSystemCard } from './cards/DesignSystemCard';
import { PodcastFeedCard } from './cards/PodcastFeedCard';
import { BlogFeedCard } from './cards/BlogFeedCard';
import { GithubActivityCard } from './cards/GithubActivityCard';
import { AnnouncementBar } from './AnnouncementBar';
import { categories, siteItems } from '../lib/siteCatalog';
import type { BentoItem, Locale } from '../types';

const renderItem = (item: BentoItem, locale: Locale) => {
  if (item.type === 'github') return <GithubCard data={item} />;
  if (item.type === 'twitter') return <TwitterCard data={item} />;
  if (item.type === 'project') return <ProjectCard data={item} />;
  if (item.type === 'techstack') return <TechStackCard data={item} />;
  if (item.type === 'design-system') return <DesignSystemCard data={item} />;
  return <BentoLinkCard link={item as any} locale={locale} />;
};

const stackedSocialTitles = new Set([
  'DAVID888 YouTube',
  'DAVID888 Daily 每日放送',
  'Threads: @david888.chiang',
  'Podcast: DAVID888商業報告[Oli家]',
]);

const isLinkedInItem = (item: BentoItem) => 'title' in item && item.title === 'LinkedIn';

interface BentoGridProps {
  locale: Locale;
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ locale, activeCategoryId, onCategoryChange }) => {
  const items = siteItems;
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
  const shouldShowPodcastFeed = activeCategory?.id === 'social';
  const featuredItem = activeItems.find((item) => item.colSpan === 2) ?? activeItems[0];
  const groupedActiveSections = activeItems.reduce((acc, item) => {
    const section = locale === 'en' ? item.sectionEn || item.section || '' : item.section || '';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, BentoItem[]>);
  const activeSections: Array<[string, BentoItem[]]> = Object.entries(groupedActiveSections);

  return (
    <div className="flex flex-col gap-6">
      {/* Category Tabs - Full Width at Top */}
      <div className="rounded-2xl border border-border bg-bg-surface p-1.5 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {visibleCategories.map((category) => {
            const isActive = category.id === activeCategory?.id;
            const count = groupedItems[category.id]?.length ?? 0;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "relative flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors",
                  isActive ? "text-white dark:text-bg-base" : "text-text-muted hover:text-text-main"
                )}
                aria-pressed={isActive}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {locale === 'en' ? category.labelEn : category.label}
                  <span className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black leading-none transition-colors",
                    isActive ? "bg-white/20 text-white dark:bg-black/20 dark:text-bg-base" : "bg-border text-text-muted group-hover:bg-border-hover"
                  )}>
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="grid gap-6 pb-16 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ProfileCard locale={locale} />
        </aside>

        <section className="min-w-0 space-y-6">
          <AnnouncementBar />

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

        <AnimatePresence mode="popLayout">
          <motion.div 
            key={activeCategoryId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            className="space-y-8"
          >
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
                  {shouldShowPodcastFeed && !section && (
                    <div className="sm:col-span-2">
                      <PodcastFeedCard locale={locale} />
                      {sectionItems.filter(isLinkedInItem).map((item) => (
                        <div key="linkedin-under-podcast" className="mt-5">
                          {renderItem(item, locale)}
                        </div>
                      ))}
                    </div>
                  )}

                  {shouldShowPodcastFeed && !section && (
                    <div>
                      <BlogFeedCard locale={locale} />
                    </div>
                  )}

                  {shouldShowPodcastFeed && !section && (
                    <div className="sm:col-span-2">
                      <GithubActivityCard locale={locale} />
                    </div>
                  )}

                  {shouldShowPodcastFeed && !section && (
                    <div className="flex flex-col gap-5">
                      {sectionItems
                        .filter((item) => 'title' in item && stackedSocialTitles.has(item.title))
                        .map((item, index) => (
                          <div key={`stacked-social-${index}`}>
                            {renderItem(item, locale)}
                          </div>
                        ))}
                    </div>
                  )}

                  {sectionItems
                    .filter((item) => !shouldShowPodcastFeed || section || (!isLinkedInItem(item) && (!('title' in item) || !stackedSocialTitles.has(item.title))))
                    .map((item, index) => {
                    const colSpanClass = item.colSpan === 2 ? 'sm:col-span-2' : '';

                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        key={`${activeCategory?.id}-${section}-${index}`} 
                        className={colSpanClass}
                      >
                        {renderItem(item, locale)}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
    </div>
  );
};
