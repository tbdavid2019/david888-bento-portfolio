import linksData from '../data/bento-links.json';
import profileData from '../data/bento-profile.json';
import { profileContent } from '../data/profile-content';
import type { BentoItem, LinkCardData, Locale } from '../types';

export type CategoryMeta = {
  id: string;
  label: string;
  labelEn: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
};

export const defaultCategoryId = 'social';

export const categories: CategoryMeta[] = [
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

export const siteItems = linksData as BentoItem[];

export function getVisibleCategories(items: BentoItem[] = siteItems): CategoryMeta[] {
  const tags = new Set(items.map((item) => item.tag || 'others'));
  return categories.filter((category) => tags.has(category.id));
}

export function getCategoryById(categoryId: string): CategoryMeta | undefined {
  return categories.find((category) => category.id === categoryId);
}

export function getLocalizedCategoryLabel(category: CategoryMeta, locale: Locale): string {
  return locale === 'en' ? category.labelEn : category.label;
}

export function getLocalizedCategoryTitle(category: CategoryMeta, locale: Locale): string {
  return locale === 'en' ? category.titleEn : category.title;
}

export function getLocalizedCategorySummary(category: CategoryMeta, locale: Locale): string {
  return locale === 'en' ? category.summaryEn : category.summary;
}

export function getLocalizedItemTitle(item: BentoItem, locale: Locale): string {
  if ('titleEn' in item && locale === 'en' && item.titleEn) {
    return item.titleEn;
  }

  if ('title' in item && item.title) {
    return item.title;
  }

  if (item.type === 'github') {
    return item.title || item.username;
  }

  if (item.type === 'twitter') {
    return item.title || item.username;
  }

  if (item.type === 'techstack') {
    return item.title || 'Tech Stack';
  }

  return item.type;
}

export function getLocalizedItemDescription(item: BentoItem, locale: Locale): string | null {
  if ('descriptionEn' in item && locale === 'en' && item.descriptionEn) {
    return item.descriptionEn;
  }

  if ('description' in item && item.description) {
    return item.description;
  }

  if (item.type === 'github') {
    return `GitHub profile for ${item.username}`;
  }

  if (item.type === 'twitter') {
    return `Social profile for ${item.username}`;
  }

  if (item.type === 'project') {
    return item.description;
  }

  if (item.type === 'design-system') {
    return item.subtitle;
  }

  return null;
}

export function getLocalizedItemSection(item: BentoItem, locale: Locale): string {
  return locale === 'en' ? item.sectionEn || item.section || '' : item.section || '';
}

export function getItemUrl(item: BentoItem): string | null {
  if ('url' in item && typeof item.url === 'string' && item.url.length > 0) {
    return item.url;
  }

  return null;
}

export function listItemsByCategory(categoryId: string): BentoItem[] {
  return siteItems.filter((item) => (item.tag || 'others') === categoryId);
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function findItemByTitle(query: string, locale: Locale): BentoItem | null {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return null;
  }

  const exactMatch = siteItems.find((item) => normalizeQuery(getLocalizedItemTitle(item, locale)) === normalizedQuery);
  if (exactMatch) {
    return exactMatch;
  }

  const looseMatch = siteItems.find((item) => normalizeQuery(getLocalizedItemTitle(item, locale)).includes(normalizedQuery));
  return looseMatch ?? null;
}

export function getProfileSummary(locale: Locale) {
  const content = profileContent[locale];
  const visibleCategories = getVisibleCategories();
  return {
    name: profileData.name,
    email: profileData.email,
    contactLine: locale === 'en' ? profileData.contactLineEn || profileData.contactLine : profileData.contactLine,
    headline: content.headline,
    subHeadline: content.subHeadline,
    body: content.body.map((block) => block.text),
    categories: visibleCategories.map((category) => ({
      id: category.id,
      label: getLocalizedCategoryLabel(category, locale),
      itemCount: listItemsByCategory(category.id).length,
    })),
  };
}

export function toItemPreview(item: BentoItem, locale: Locale) {
  return {
    title: getLocalizedItemTitle(item, locale),
    description: getLocalizedItemDescription(item, locale),
    section: getLocalizedItemSection(item, locale) || null,
    categoryId: item.tag || 'others',
    type: item.type,
    url: getItemUrl(item),
  };
}

export function isLinkLikeItem(item: BentoItem): item is LinkCardData {
  return item.type === 'link';
}
