import {
  defaultCategoryId,
  findItemByTitle,
  getCapabilityDetails,
  getCategoryById,
  getLocalizedCategoryLabel,
  getLocalizedItemTitle,
  getProfileSummary,
  getVisibleCategories,
  listItemsByCategory,
  searchSiteCapabilities,
  siteItems,
  toItemPreview,
} from './siteCatalog';
import type { BentoItem, Locale } from '../types';

type WebMcpContext = {
  getLocale: () => Locale;
  getActiveCategoryId: () => string;
  setActiveCategoryId: (categoryId: string) => void;
  openContactForm: () => void;
};

type WebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input?: unknown) => unknown | Promise<unknown>;
};

function normalizeLocale(input: unknown, fallback: Locale): Locale {
  return input === 'en' ? 'en' : fallback;
}

function normalizeLimit(input: unknown, fallback = 8): number {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return fallback;
  }

  return Math.max(1, Math.min(20, Math.trunc(input)));
}

function getCategoryOrDefault(categoryId: unknown): string {
  if (typeof categoryId !== 'string' || !getCategoryById(categoryId)) {
    return defaultCategoryId;
  }

  return categoryId;
}

function openItemUrl(item: BentoItem) {
  if (!('url' in item) || !item.url) {
    return {
      ok: false,
      reason: 'The selected item does not have a public URL.',
    };
  }

  const openedWindow = window.open(item.url, '_blank', 'noopener,noreferrer');
  return {
    ok: true,
    title: getLocalizedItemTitle(item, 'en'),
    url: item.url,
    openedInNewTab: Boolean(openedWindow),
  };
}

function createTools(context: WebMcpContext): WebMcpTool[] {
  return [
    {
      name: 'get_site_profile',
      title: 'Get Site Profile',
      description: 'Return the public profile summary, contact info, and high-level categories shown on this portfolio site.',
      inputSchema: {
        type: 'object',
        properties: {
          locale: {
            type: 'string',
            enum: ['zh', 'en'],
            description: 'Preferred response language.',
          },
        },
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: (input) => {
        const args = (input && typeof input === 'object' ? input : {}) as { locale?: Locale };
        const locale = normalizeLocale(args.locale, context.getLocale());
        return getProfileSummary(locale);
      },
    },
    {
      name: 'search_my_capabilities',
      title: 'Search David’s Capabilities',
      description: 'Search David’s professional capabilities and related public projects for a user goal or technical problem.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            minLength: 2,
            description: 'A capability, business problem, or technical topic to search for.',
          },
          locale: {
            type: 'string',
            enum: ['zh', 'en'],
            description: 'Preferred response language.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            description: 'Maximum number of capability and project matches to return.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: (input) => {
        const args = (input && typeof input === 'object' ? input : {}) as {
          query?: string;
          locale?: Locale;
          limit?: number;
        };
        const locale = normalizeLocale(args.locale, context.getLocale());
        if (typeof args.query !== 'string' || args.query.trim().length < 2) {
          return {
            ok: false,
            reason: locale === 'en' ? 'Please provide a search query with at least two characters.' : '請提供至少兩個字元的搜尋需求。',
          };
        }

        return {
          ok: true,
          ...searchSiteCapabilities(args.query, locale, normalizeLimit(args.limit)),
        };
      },
    },
    {
      name: 'recommend_capabilities',
      title: 'Recommend Capabilities',
      description: 'Recommend the most relevant consulting capabilities and public projects for a stated business or engineering goal.',
      inputSchema: {
        type: 'object',
        properties: {
          goal: {
            type: 'string',
            minLength: 2,
            description: 'The business or engineering outcome the user wants to achieve.',
          },
          locale: {
            type: 'string',
            enum: ['zh', 'en'],
            description: 'Preferred response language.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            description: 'Maximum number of recommendations to return.',
          },
        },
        required: ['goal'],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: (input) => {
        const args = (input && typeof input === 'object' ? input : {}) as {
          goal?: string;
          locale?: Locale;
          limit?: number;
        };
        const locale = normalizeLocale(args.locale, context.getLocale());
        if (typeof args.goal !== 'string' || args.goal.trim().length < 2) {
          return {
            ok: false,
            reason: locale === 'en' ? 'Please describe the goal with at least two characters.' : '請提供至少兩個字元的目標描述。',
          };
        }

        return {
          ok: true,
          goal: args.goal,
          ...searchSiteCapabilities(args.goal, locale, Math.min(normalizeLimit(args.limit, 5), 10)),
        };
      },
    },
    {
      name: 'get_capability_details',
      title: 'Get Capability Details',
      description: 'Return detailed information about one of David’s capabilities or public projects by name.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            minLength: 2,
            description: 'A capability or project name. Partial matches are allowed.',
          },
          locale: {
            type: 'string',
            enum: ['zh', 'en'],
            description: 'Preferred response language.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: (input) => {
        const args = (input && typeof input === 'object' ? input : {}) as { query?: string; locale?: Locale };
        const locale = normalizeLocale(args.locale, context.getLocale());
        if (typeof args.query !== 'string' || args.query.trim().length < 2) {
          return {
            ok: false,
            reason: locale === 'en' ? 'A capability or project name is required.' : '請提供能力或作品名稱。',
          };
        }

        const details = getCapabilityDetails(args.query, locale);
        return details
          ? { ok: true, ...details }
          : { ok: false, reason: locale === 'en' ? 'No matching capability or project was found.' : '找不到符合的能力或作品。' };
      },
    },
    {
      name: 'list_site_categories',
      title: 'List Site Categories',
      description: 'List the visible portfolio categories and their item counts.',
      inputSchema: {
        type: 'object',
        properties: {
          locale: {
            type: 'string',
            enum: ['zh', 'en'],
            description: 'Preferred response language.',
          },
        },
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: (input) => {
        const args = (input && typeof input === 'object' ? input : {}) as { locale?: Locale };
        const locale = normalizeLocale(args.locale, context.getLocale());
        return getVisibleCategories().map((category) => ({
          id: category.id,
          label: getLocalizedCategoryLabel(category, locale),
          itemCount: listItemsByCategory(category.id).length,
          isActive: category.id === context.getActiveCategoryId(),
        }));
      },
    },
    {
      name: 'list_site_items',
      title: 'List Site Items',
      description: 'List portfolio items, optionally filtered by category, for browsing and agent planning.',
      inputSchema: {
        type: 'object',
        properties: {
          categoryId: {
            type: 'string',
            description: 'Category ID such as social, finance, products, agent-skills, experiments, or metaphysics.',
          },
          locale: {
            type: 'string',
            enum: ['zh', 'en'],
            description: 'Preferred response language.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            description: 'Maximum number of items to return.',
          },
        },
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: (input) => {
        const args = (input && typeof input === 'object' ? input : {}) as {
          categoryId?: string;
          locale?: Locale;
          limit?: number;
        };
        const locale = normalizeLocale(args.locale, context.getLocale());
        const categoryId = typeof args.categoryId === 'string' ? args.categoryId : context.getActiveCategoryId();
        const limit = normalizeLimit(args.limit);
        const items = (getCategoryById(categoryId) ? listItemsByCategory(categoryId) : siteItems).slice(0, limit);
        return {
          categoryId: getCategoryById(categoryId) ? categoryId : null,
          total: items.length,
          items: items.map((item) => toItemPreview(item, locale)),
        };
      },
    },
    {
      name: 'activate_site_category',
      title: 'Activate Site Category',
      description: 'Switch the portfolio UI to a specific category so the user and agent see the same section.',
      inputSchema: {
        type: 'object',
        properties: {
          categoryId: {
            type: 'string',
            description: 'Target category ID.',
          },
        },
        required: ['categoryId'],
        additionalProperties: false,
      },
      execute: (input) => {
        const args = (input && typeof input === 'object' ? input : {}) as { categoryId?: string };
        const categoryId = getCategoryOrDefault(args.categoryId);
        context.setActiveCategoryId(categoryId);
        return {
          ok: true,
          activeCategoryId: categoryId,
        };
      },
    },
    {
      name: 'open_contact_form',
      title: 'Open Contact Form',
      description: 'Open the visible contact form so the user can review and submit a collaboration request.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: () => {
        context.openContactForm();
        return {
          ok: true,
          message: 'The contact form is now open for the user to review and complete.',
        };
      },
    },
    {
      name: 'open_site_item',
      title: 'Open Site Item',
      description: 'Open a portfolio item by title in a new tab.',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The item title to open. Partial matches are allowed.',
          },
          locale: {
            type: 'string',
            enum: ['zh', 'en'],
            description: 'Preferred language for title matching.',
          },
        },
        required: ['title'],
        additionalProperties: false,
      },
      execute: (input) => {
        const args = (input && typeof input === 'object' ? input : {}) as { title?: string; locale?: Locale };
        if (typeof args.title !== 'string' || !args.title.trim()) {
          return {
            ok: false,
            reason: 'A non-empty title is required.',
          };
        }

        const locale = normalizeLocale(args.locale, context.getLocale());
        const item = findItemByTitle(args.title, locale);
        if (!item) {
          return {
            ok: false,
            reason: 'No matching site item was found.',
          };
        }

        return openItemUrl(item);
      },
    },
  ];
}

export function registerPortfolioWebMcp(context: WebMcpContext): () => void {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    return () => undefined;
  }

  const tools = createTools(context);
  const modelContext = document.modelContext;
  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    return () => undefined;
  }

  const abortController = new AbortController();
  for (const tool of tools) {
    modelContext.registerTool(tool, { signal: abortController.signal }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.warn(`Failed to register WebMCP tool "${tool.name}"`, error);
    });
  }

  return () => abortController.abort();
}
