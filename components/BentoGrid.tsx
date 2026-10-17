import React from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  Compass,
  Cpu,
  FlaskConical,
  Layers,
  LineChart,
  Radio,
  Rocket,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ProfileCard } from './ProfileCard';
import { ExecutiveBriefing } from './ExecutiveBriefing';
import { FlagshipShowcase } from './FlagshipShowcase';
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

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  social: Radio,
  finance: LineChart,
  products: Layers,
  'agent-skills': Cpu,
  experiments: FlaskConical,
  metaphysics: Compass,
};

const isLinkedInItem = (item: BentoItem) => 'title' in item && item.title === 'LinkedIn';
const getSectionAnchorId = (categoryId: string, _section: string, index: number) =>
  `section-${categoryId}-${index}`;
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
    ...(item.techStack || []),
    ...(item.highlights || []),
    ...(item.highlightsEn || []),
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
  onContact?: () => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  locale,
  activeCategoryId,
  onCategoryChange,
  searchQuery,
  onClearSearch,
  onContact,
}) => {
  const contentSectionRef = React.useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const items = siteItems;

  const groupedItems = React.useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const tag = item.tag || 'others';
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(item);
        return acc;
      },
      {} as Record<string, BentoItem[]>,
    );
  }, [items]);

  const visibleCategories = categories.filter((category) => groupedItems[category.id]?.length);

  React.useEffect(() => {
    if (
      activeCategoryId !== 'executive' &&
      activeCategoryId !== 'flagships' &&
      !visibleCategories.some((category) => category.id === activeCategoryId)
    ) {
      onCategoryChange(visibleCategories[0]?.id ?? 'social');
    }
  }, [activeCategoryId, onCategoryChange, visibleCategories]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearchQuery.length > 0;
  const isExecutiveView = activeCategoryId === 'executive' && !isSearching;
  const isFlagshipsView = activeCategoryId === 'flagships' && !isSearching;

  const handleCategorySelect = (categoryId: string) => {
    if (isSearching) {
      onClearSearch();
    }
    onCategoryChange(categoryId);

    setTimeout(() => {
      contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});
  const toggleSectionExpanded = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeCategory =
    visibleCategories.find((category) => category.id === activeCategoryId) ?? visibleCategories[0];
  const activeItems = activeCategory ? groupedItems[activeCategory.id] ?? [] : [];

  const searchMatches = React.useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return items.filter((item) => getSearchText(item).includes(normalizedSearchQuery));
  }, [items, normalizedSearchQuery]);

  const searchSections: Array<[string, BentoItem[]]> = React.useMemo(() => {
    const grouped = new Map<string, BentoItem[]>();
    for (const item of searchMatches) {
      const category = getCategoryById(item.tag || 'others');
      const categoryLabel = category
        ? getLocalizedCategoryLabel(category, locale)
        : item.tag || 'Other';
      const section = getLocalizedItemSection(item, locale);
      const label = section ? `${categoryLabel} / ${getSectionLabel(section)}` : categoryLabel;
      grouped.set(label, [...(grouped.get(label) ?? []), item]);
    }
    return [...grouped.entries()];
  }, [locale, searchMatches]);

  const shouldShowPodcastFeed = activeCategory?.id === 'social' && !isSearching && !isFlagshipsView;
  const featuredItem = !isSearching
    ? activeItems.find((item) => item.featured || item.colSpan === 2)
    : null;

  const groupedActiveSections = activeItems.reduce(
    (acc, item) => {
      const section = locale === 'en' ? item.sectionEn || item.section || '' : item.section || '';
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, BentoItem[]>,
  );
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
    <main className="dossier-shell space-y-6 pb-16 pt-6">
      {/* 1. Single-Axis Executive Hero Dossier */}
      <ProfileCard
        locale={locale}
        onContact={onContact}
        onSelectRoute={(routeId) => handleCategorySelect(routeId)}
      />

      {/* 2. 2md.aiurl.tw Sticky Deep-Blue Canonical Route Navigation Bar */}
      <nav
        aria-label={locale === 'en' ? 'Primary portfolio routes' : '主要路由導覽'}
        className="section-nav-bar"
      >
        <a
          href="/executive"
          onClick={(e) => {
            e.preventDefault();
            handleCategorySelect('executive');
          }}
          aria-current={isExecutiveView ? 'location' : undefined}
          className={cn(
            'flex min-h-[44px] flex-1 items-center justify-start gap-2 rounded-[9px] px-3 py-2 text-base font-bold transition-colors no-underline md:justify-center',
            isExecutiveView
              ? 'bg-[#ffb010] text-[#2b251a] shadow-xs'
              : 'text-[#fff9e8] hover:bg-[#ffb010]/20 hover:text-[#ffb010]',
          )}
        >
          <Briefcase size={16} className="shrink-0" />
          <span className="truncate">
            {locale === 'en' ? 'CTO & Advisory' : '顧問與經歷'}
          </span>
          <span
            className={cn(
              'ml-auto inline-flex h-5 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-extrabold leading-none md:ml-0',
              isExecutiveView
                ? 'bg-[#17324d] text-[#fff9e8]'
                : 'bg-[#ffb010] text-[#2b251a]',
            )}
          >
            CTO
          </span>
        </a>

        <a
          href="/flagships"
          onClick={(e) => {
            e.preventDefault();
            handleCategorySelect('flagships');
          }}
          aria-current={isFlagshipsView ? 'location' : undefined}
          className={cn(
            'flex min-h-[44px] flex-1 items-center justify-start gap-2 rounded-[9px] px-3 py-2 text-base font-bold transition-colors no-underline md:justify-center',
            isFlagshipsView
              ? 'bg-[#ffb010] text-[#2b251a] shadow-xs'
              : 'text-[#fff9e8] hover:bg-[#ffb010]/20 hover:text-[#ffb010]',
          )}
        >
          <Rocket size={16} className="shrink-0" />
          <span className="truncate">
            {locale === 'en' ? '5 Flagship Systems' : '5 大主力系統'}
          </span>
          <span
            className={cn(
              'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-extrabold leading-none md:ml-0',
              isFlagshipsView
                ? 'bg-[#17324d] text-[#fff9e8]'
                : 'bg-white/15 text-[#fff9e8]',
            )}
          >
            5
          </span>
        </a>

        {visibleCategories.map((category) => {
          const isActive =
            !isExecutiveView && !isFlagshipsView && category.id === activeCategory?.id;
          const count = groupedItems[category.id]?.length ?? 0;
          const Icon = categoryIcons[category.id] || Layers;

          return (
            <a
              key={category.id}
              href={`/${category.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleCategorySelect(category.id);
              }}
              aria-current={isActive ? 'location' : undefined}
              className={cn(
                'flex min-h-[44px] flex-1 items-center justify-start gap-2 rounded-[9px] px-3 py-2 text-base font-bold transition-colors no-underline md:justify-center',
                isActive
                  ? 'bg-[#ffb010] text-[#2b251a] shadow-xs'
                  : 'text-[#fff9e8] hover:bg-[#ffb010]/20 hover:text-[#ffb010]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">
                {locale === 'en' ? category.labelEn : category.label}
              </span>
              <span
                className={cn(
                  'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-extrabold leading-none md:ml-0',
                  isActive
                    ? 'bg-[#17324d] text-[#fff9e8]'
                    : 'bg-white/15 text-[#fff9e8]',
                )}
              >
                {count}
              </span>
            </a>
          );
        })}
      </nav>

      {/* 3. Main Content Surface */}
      <section ref={contentSectionRef} className="min-w-0 scroll-mt-24 space-y-6">
        <AnnouncementBar />

        {isExecutiveView ? (
          <ExecutiveBriefing
            locale={locale}
            onContact={onContact || (() => {})}
            onSwitchToCatalog={() => handleCategorySelect('finance')}
          />
        ) : isFlagshipsView ? (
          <FlagshipShowcase locale={locale} />
        ) : (
          <>
            {/* Always surface the 5 Flagship High-Difficulty Systems at the top of the default landing flow so employers never miss them */}
            {!isSearching && activeCategory?.id === 'social' && (
              <FlagshipShowcase locale={locale} />
            )}

            {isSearching ? (
              <div className="dossier-card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-text-main md:text-3xl">
                    {locale === 'en'
                      ? `Search results: ${searchMatches.length} works found`
                      : `搜尋結果：找到 ${searchMatches.length} 個作品`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#17324d] bg-bg-elevated px-4 text-sm font-extrabold text-text-main transition-colors hover:bg-[#17324d] hover:text-[#fff9e8]"
                >
                  {locale === 'en' ? 'Clear search' : '清除搜尋'}
                </button>
              </div>
            ) : (
              activeCategory && (
                <div className="dossier-card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-col gap-1.5 md:flex-row md:items-baseline md:gap-4">
                      <h2 className="shrink-0 text-2xl font-extrabold text-text-main md:text-3xl">
                        {locale === 'en' ? activeCategory.titleEn : activeCategory.title}
                      </h2>
                      <span className="font-mono text-xs font-bold text-[#a9471d] dark:text-[#ffb010]">
                        /{activeCategory.id}
                      </span>
                    </div>
                    <p className="mt-1 max-w-3xl text-base leading-relaxed text-text-muted">
                      {locale === 'en' ? activeCategory.summaryEn : activeCategory.summary}
                    </p>
                  </div>

                  {featuredItem && 'url' in featuredItem && featuredItem.url && (
                    <a
                      href={featuredItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-saffron inline-flex h-11 shrink-0 items-center gap-2 px-4 text-sm no-underline"
                    >
                      <span>{locale === 'en' ? 'Featured System' : '代表作品'}</span>
                      <ArrowUpRight size={16} />
                    </a>
                  )}
                </div>
              )
            )}

            {tocSections.length > 1 && (
              <nav
                aria-label={locale === 'en' ? 'Section navigation' : '子分類目錄'}
                className="dossier-card px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="shrink-0 text-sm font-extrabold text-text-muted">
                    {locale === 'en' ? 'Sections:' : '子分類：'}
                  </span>
                  {tocSections.map(([section], sectionIndex) => (
                    <a
                      key={section}
                      href={`#${getSectionAnchorId(navigationCategoryId, section, sectionIndex)}`}
                      className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm font-bold text-text-main no-underline transition-colors hover:border-[#17324d] hover:bg-[#fff0cc] dark:hover:border-[#ffb010] dark:hover:bg-[#17324d]"
                    >
                      {getSectionLabel(section)}
                    </a>
                  ))}
                </div>
              </nav>
            )}

            {isSearching && searchMatches.length === 0 ? (
              <div className="dossier-card p-8 text-center text-base font-bold text-text-muted">
                {locale === 'en' ? 'No matching works found.' : '找不到符合的作品。'}
              </div>
            ) : (
              <div className="space-y-8">
                {sectionsToRender.map(([section, sectionItems], sectionIndex) => (
                  <div
                    key={section || 'default'}
                    id={section ? getSectionAnchorId(navigationCategoryId, section, sectionIndex) : undefined}
                    className="scroll-mt-28 space-y-4"
                  >
                    {section && (
                      <div className="flex items-center gap-3">
                        <h3 className="shrink-0 text-lg font-extrabold text-text-main md:text-xl">
                          {section}
                        </h3>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {shouldShowPodcastFeed && !section && (
                        <div className="md:col-span-2">
                          <PodcastFeedCard locale={locale} />
                          {sectionItems.filter(isLinkedInItem).map((item) => (
                            <div key="linkedin-under-podcast" className="mt-4">
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
                        <div>
                          <GithubActivityCard locale={locale} />
                        </div>
                      )}

                      {shouldShowPodcastFeed && !section && (
                        <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {sectionItems
                            .filter(
                              (item) => 'title' in item && stackedSocialTitles.has(item.title),
                            )
                            .map((item, index) => (
                              <div key={`stacked-social-${index}`}>
                                {renderItem(item, locale)}
                              </div>
                            ))}
                        </div>
                      )}

                      {(() => {
                        const filteredItems = sectionItems.filter(
                          (item) =>
                            !shouldShowPodcastFeed ||
                            section ||
                            (!isLinkedInItem(item) &&
                              (!('title' in item) || !stackedSocialTitles.has(item.title))),
                        );
                        const sectionKey = `${activeCategory?.id}-${section || 'main'}`;
                        const isExpanded = !!expandedSections[sectionKey];
                        const shouldLimit =
                          filteredItems.length > 8 && !isSearching && !shouldShowPodcastFeed;
                        const displayedItems =
                          shouldLimit && !isExpanded ? filteredItems.slice(0, 8) : filteredItems;

                        return (
                          <>
                            {displayedItems.map((item, index) => {
                              const colSpanClass = item.colSpan === 2 ? 'md:col-span-2' : '';

                              return (
                                <div
                                  key={`${activeCategory?.id}-${section}-${index}`}
                                  className={colSpanClass}
                                >
                                  {renderItem(item, locale)}
                                </div>
                              );
                            })}

                            {shouldLimit && (
                              <div className="col-span-full flex justify-center pt-2">
                                <button
                                  type="button"
                                  onClick={() => toggleSectionExpanded(sectionKey)}
                                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-[#17324d] bg-bg-surface px-6 py-2.5 text-sm font-extrabold text-text-main shadow-xs transition-colors hover:bg-[#17324d] hover:text-[#fff9e8] dark:border-[#ffb010] dark:hover:bg-[#ffb010] dark:hover:text-[#2b251a]"
                                >
                                  <span>
                                    {isExpanded
                                      ? locale === 'en'
                                        ? 'Show Less'
                                        : '收起部分作品'
                                      : locale === 'en'
                                        ? `Show all ${filteredItems.length} works (+${filteredItems.length - 8})`
                                        : `展開全部 ${filteredItems.length} 個作品 (+${filteredItems.length - 8})`}
                                  </span>
                                  <ChevronDown
                                    size={16}
                                    className={cn(
                                      'transition-transform duration-200',
                                      isExpanded && 'rotate-180',
                                    )}
                                  />
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {showScrollTop && (
        <button
          type="button"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
            })
          }
          aria-label={locale === 'en' ? 'Back to top' : '回到頂端'}
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#17324d] bg-[#ffb010] text-[#2b251a] shadow-lg transition-transform hover:-translate-y-1"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </main>
  );
};
