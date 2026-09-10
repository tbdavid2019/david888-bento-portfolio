import React from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
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
import {
  categories,
  getCategoryById,
  getLocalizedCategoryLabel,
  getLocalizedItemDescription,
  getLocalizedItemSection,
  getLocalizedItemTitle,
  siteItems,
} from '../lib/siteCatalog';
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
const getSectionAnchorId = (categoryId: string, _section: string, index: number) => `section-${categoryId}-${index}`;
const getSectionLabel = (section: string) => section.replace(/\s+\([^)]*\)$/, '');
const getSearchText = (item: BentoItem) => {
  const category = getCategoryById(item.tag || 'others');
  return [
    getLocalizedItemTitle(item, 'zh'),
    getLocalizedItemTitle(item, 'en'),
    getLocalizedItemDescription(item, 'zh'),
    getLocalizedItemDescription(item, 'en'),
    getLocalizedItemSection(item, 'zh'),
    getLocalizedItemSection(item, 'en'),
    category?.label,
    category?.labelEn,
    category?.title,
    category?.titleEn,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

interface BentoGridProps {
  locale: Locale;
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  searchQuery: string;
  onClearSearch: () => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  locale,
  activeCategoryId,
  onCategoryChange,
  searchQuery,
  onClearSearch,
}) => {
  const contentSectionRef = React.useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
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

  const handleCategorySelect = (categoryId: string) => {
    if (isSearching) {
      onClearSearch();
    }
    onCategoryChange(categoryId);

    if (window.innerWidth < 1024 && contentSectionRef.current) {
      setTimeout(() => {
        contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const activeCategory =
    visibleCategories.find((category) => category.id === activeCategoryId) ?? visibleCategories[0];
  const activeItems = activeCategory ? groupedItems[activeCategory.id] ?? [] : [];
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearchQuery.length > 0;
  const searchMatches = React.useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return items.filter((item) => getSearchText(item).includes(normalizedSearchQuery));
  }, [items, normalizedSearchQuery]);
  const searchSections: Array<[string, BentoItem[]]> = React.useMemo(() => {
    const grouped = new Map<string, BentoItem[]>();
    for (const item of searchMatches) {
      const category = getCategoryById(item.tag || 'others');
      const categoryLabel = category ? getLocalizedCategoryLabel(category, locale) : item.tag || 'Other';
      const section = getLocalizedItemSection(item, locale);
      const label = section ? `${categoryLabel} / ${getSectionLabel(section)}` : categoryLabel;
      grouped.set(label, [...(grouped.get(label) ?? []), item]);
    }
    return [...grouped.entries()];
  }, [locale, searchMatches]);
  const shouldShowPodcastFeed = activeCategory?.id === 'social' && !isSearching;
  const featuredItem = !isSearching ? activeItems.find((item) => item.featured || item.colSpan === 2) : null;
  const groupedActiveSections = activeItems.reduce((acc, item) => {
    const section = locale === 'en' ? item.sectionEn || item.section || '' : item.section || '';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, BentoItem[]>);
  const activeSections: Array<[string, BentoItem[]]> = Object.entries(groupedActiveSections);
  const sectionsToRender = isSearching ? searchSections : activeSections;
  const tocSections = sectionsToRender.filter(([section]) => section);
  const navigationCategoryId = isSearching ? 'search' : activeCategory?.id ?? activeCategoryId;

  React.useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
                onClick={() => handleCategorySelect(category.id)}
                className={cn(
                  "relative flex min-h-10 items-center gap-2 rounded-xl px-5 text-base font-bold transition-colors",
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

        <section ref={contentSectionRef} className="min-w-0 space-y-6 scroll-mt-28 md:scroll-mt-36">
          <AnnouncementBar />

          {isSearching ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-bg-surface px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  {locale === 'en' ? 'Search results' : '搜尋結果'}
                </div>
                <h3 className="mt-1 text-2xl font-black text-text-main md:text-3xl">
                  {locale === 'en' ? `${searchMatches.length} works found` : `找到 ${searchMatches.length} 個作品`}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-text-main px-4 text-sm font-black text-text-main transition-colors hover:bg-text-main hover:text-bg-base"
              >
                {locale === 'en' ? 'Clear search' : '清除搜尋'}
              </button>
            </div>
          ) : activeCategory && (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-surface px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-text-muted opacity-80">
                  {locale === 'en' ? activeCategory.labelEn : activeCategory.label}
                </div>
                <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
                  <h3 className="shrink-0 text-2xl font-black text-text-main md:text-3xl">
                    {locale === 'en' ? activeCategory.titleEn : activeCategory.title}
                  </h3>
                  <p className="max-w-2xl text-base leading-relaxed text-text-muted">
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

          {tocSections.length > 1 && (
            <nav
              aria-label={locale === 'en' ? 'Section navigation' : '子分類目錄'}
              className="rounded-2xl border border-border bg-bg-surface px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-x-auto pb-1 md:flex-wrap md:overflow-x-visible">
                <span className="shrink-0 text-sm font-black text-text-muted">
                  {locale === 'en' ? 'Sections' : '子分類'}
                </span>
                <div className="flex min-w-max items-center gap-2 md:min-w-0 md:flex-wrap">
                  {tocSections.map(([section], sectionIndex) => (
                    <a
                      key={section}
                      href={`#${getSectionAnchorId(navigationCategoryId, section, sectionIndex)}`}
                      className="rounded-full border border-border px-3 py-1.5 text-sm font-bold text-text-muted transition-colors hover:border-primary hover:text-primary"
                    >
                      {getSectionLabel(section)}
                    </a>
                  ))}
                </div>
              </div>
            </nav>
          )}

        {isSearching && searchMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-bg-surface p-8 text-center text-base font-bold text-text-muted">
            {locale === 'en' ? 'No matching works found.' : '找不到符合的作品。'}
          </div>
        ) : <AnimatePresence mode="popLayout">
          <motion.div 
            key={isSearching ? `search-${normalizedSearchQuery}` : activeCategoryId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            className="space-y-8"
          >
            {sectionsToRender.map(([section, sectionItems], sectionIndex) => (
              <div
                key={section || 'default'}
                id={section ? getSectionAnchorId(navigationCategoryId, section, sectionIndex) : undefined}
                className="scroll-mt-32 space-y-4"
              >
                {section && (
                  <div className="flex items-center gap-3">
                    <h4 className="shrink-0 text-base font-black text-text-muted md:text-lg">
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
        </AnimatePresence>}
      </section>
    </main>

    {showScrollTop && (
      <button
        type="button"
        onClick={() => window.scrollTo({
          top: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        })}
        aria-label={locale === 'en' ? 'Back to top' : '回到頂端'}
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-surface text-text-main shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary hover:text-primary"
      >
        <ArrowUp size={19} />
      </button>
    )}
    </div>
  );
};
