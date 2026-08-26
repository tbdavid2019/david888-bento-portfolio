import linksData from '../data/bento-links.json';
import categoryConfig from '../data/bento-categories.json';
import profileData from '../data/bento-profile.json';
import capabilitiesData from '../data/capabilities.json';
import { profileContent } from '../data/profile-content';
import { rankCapabilities } from './webmcpSearch.mjs';
import type { BentoItem, CapabilityArea, LinkCardData, Locale } from '../types';

export type CategoryMeta = {
  id: string;
  label: string;
  labelEn: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
};

export const defaultCategoryId = categoryConfig.defaultCategoryId;
export const categories = categoryConfig.categories as CategoryMeta[];

export const siteItems = linksData as BentoItem[];
export const capabilityAreas = capabilitiesData as CapabilityArea[];

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

export function getLocalizedCapabilityTitle(capability: CapabilityArea, locale: Locale): string {
  return locale === 'en' ? capability.titleEn : capability.title;
}

export function getLocalizedCapabilityDescription(capability: CapabilityArea, locale: Locale): string {
  return locale === 'en' ? capability.descriptionEn : capability.description;
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

export function toCapabilityPreview(capability: CapabilityArea, locale: Locale) {
  return {
    id: capability.id,
    title: getLocalizedCapabilityTitle(capability, locale),
    description: getLocalizedCapabilityDescription(capability, locale),
    keywords: capability.keywords,
  };
}

function toSearchableItem(item: BentoItem, locale: Locale, index: number) {
  const category = getCategoryById(item.tag || 'others');
  return {
    id: `item:${index}`,
    title: getLocalizedItemTitle(item, 'zh'),
    titleEn: getLocalizedItemTitle(item, 'en'),
    description: getLocalizedItemDescription(item, 'zh'),
    descriptionEn: getLocalizedItemDescription(item, 'en'),
    section: getLocalizedItemSection(item, 'zh'),
    sectionEn: getLocalizedItemSection(item, 'en'),
    categoryLabel: category ? getLocalizedCategoryLabel(category, locale) : item.tag,
    keywords: [item.type, item.tag].filter(Boolean),
    preview: toItemPreview(item, locale),
  };
}

export function searchSiteCapabilities(query: string, locale: Locale, limit = 8) {
  const capabilityMatches = rankCapabilities(query, capabilityAreas, limit);
  const itemCandidates = siteItems.map((item, index) => toSearchableItem(item, locale, index));
  const itemMatches = rankCapabilities(query, itemCandidates, limit);

  return {
    query,
    capabilities: capabilityMatches.map(({ capability, score, matchedFields }) => ({
      ...toCapabilityPreview(capability, locale),
      matchScore: score,
      matchedFields,
    })),
    projects: itemMatches.map(({ capability, score, matchedFields }) => ({
      ...capability.preview,
      matchScore: score,
      matchedFields,
    })),
  };
}

export function getCapabilityDetails(query: string, locale: Locale) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  const capability = capabilityAreas.find((item) => [item.title, item.titleEn, item.id]
    .some((value) => value.toLowerCase() === normalizedQuery || value.toLowerCase().includes(normalizedQuery)));
  if (capability) {
    return {
      kind: 'capability' as const,
      ...toCapabilityPreview(capability, locale),
    };
  }

  const item = findItemByTitle(query, locale);
  if (!item) {
    return null;
  }

  const category = getCategoryById(item.tag || 'others');
  return {
    kind: 'project' as const,
    ...toItemPreview(item, locale),
    categoryTitle: category ? getLocalizedCategoryTitle(category, locale) : null,
    categorySummary: category ? getLocalizedCategorySummary(category, locale) : null,
    featured: Boolean(item.featured),
  };
}

export function isLinkLikeItem(item: BentoItem): item is LinkCardData {
  return item.type === 'link';
}
