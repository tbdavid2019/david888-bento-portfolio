import {
  isValidHttpUrl,
  extractSearchTerms,
  type ConciergeMode,
  type SafeContextReference,
  type SiteContextItem,
} from './context-retrieval.ts';

export type { ConciergeMode, SafeContextReference, SiteContextItem };

export interface ConciergeDraft {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

export interface DockChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: ConciergeMode;
  references?: SafeContextReference[];
  kind?: 'text' | 'command' | 'search' | 'help' | 'rss' | 'error';
  searchResults?: CombinedSearchResult[];
}

export interface SlashCommandDefinition {
  command: string;
  usage: string;
  descZh: string;
  descEn: string;
  takesArg?: boolean;
}

export type ParsedSlashCommand =
  | { type: 'help' }
  | { type: 'clear' }
  | { type: 'contact' }
  | { type: 'form' }
  | { type: 'rss' }
  | { type: 'route'; categoryId: 'commitments' | 'executive' | 'flagships'; path: string }
  | { type: 'search'; query: string }
  | { type: 'unknown'; command: string };

export interface CatalogSearchInputItem {
  id?: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  featured?: boolean;
  publishedAt?: string;
  tags?: string[];
}

export interface CombinedSearchResult {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  featured?: boolean;
  publishedAt?: string;
  score: number;
}

export const SLASH_COMMANDS: SlashCommandDefinition[] = [
  {
    command: '/help',
    usage: '/help',
    descZh: '顯示可用快捷指令與對話使用說明',
    descEn: 'Show available commands and usage guide',
  },
  {
    command: '/search',
    usage: '/search <關鍵字>',
    descZh: '即時搜尋站內作品、GitHub、Blog、Podcast 與 Threads',
    descEn: 'Search portfolio, GitHub, Blog, Podcast & Threads',
    takesArg: true,
  },
  {
    command: '/rss',
    usage: '/rss',
    descZh: '查看最新同步動態摘要並開啟 /rss.xml 訂閱來源',
    descEn: 'View latest updates and open /rss.xml feed',
  },
  {
    command: '/contact',
    usage: '/contact',
    descZh: '開啟聯絡小秘書視窗，安排顧問諮詢或轉達訊息',
    descEn: 'Open Contact Concierge modal to reach David',
  },
  {
    command: '/form',
    usage: '/form',
    descZh: '直接開啟快速表單送出正式聯繫需求',
    descEn: 'Open Direct Contact Form',
  },
  {
    command: '/executive',
    usage: '/executive',
    descZh: '切換至核心領域與 CTO 技術顧問簡報視圖',
    descEn: 'Switch to Core Capabilities & Executive view',
  },
  {
    command: '/commitments',
    usage: '/commitments',
    descZh: '檢視技術承諾與合作治理原則',
    descEn: 'View technical commitments & governance principles',
  },
  {
    command: '/flagships',
    usage: '/flagships',
    descZh: '瀏覽重點旗艦作品與精選案例',
    descEn: 'Browse flagship works & featured case studies',
  },
  {
    command: '/clear',
    usage: '/clear',
    descZh: '清空目前對話紀錄與暫存問答視圖',
    descEn: 'Clear current conversation thread',
  },
];

export function parseSlashCommand(rawInput: string): ParsedSlashCommand | null {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed.startsWith('/')) return null;

  const spaceIdx = trimmed.search(/\s/);
  const cmd = (spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)).toLowerCase();
  const arg = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx).trim();

  switch (cmd) {
    case '/help':
    case '/?':
      return { type: 'help' };
    case '/clear':
      return { type: 'clear' };
    case '/contact':
      return { type: 'contact' };
    case '/form':
      return { type: 'form' };
    case '/rss':
      return { type: 'rss' };
    case '/commitments':
      return { type: 'route', categoryId: 'commitments', path: '/commitments' };
    case '/executive':
      return { type: 'route', categoryId: 'executive', path: '/executive' };
    case '/flagships':
      return { type: 'route', categoryId: 'flagships', path: '/flagships' };
    case '/search':
      return { type: 'search', query: arg };
    default:
      return { type: 'unknown', command: cmd };
  }
}

export function filterSlashCommands(rawInput: string): SlashCommandDefinition[] {
  const text = String(rawInput || '').trimStart();
  if (!text.startsWith('/')) return [];
  // Only show slash menu before user adds space for command arguments
  if (/\s/.test(text)) return [];
  const lower = text.toLowerCase();
  return SLASH_COMMANDS.filter((c) => c.command.startsWith(lower));
}

function normalizeUrlForDedup(rawUrl: string): string {
  return String(rawUrl || '').trim().replace(/\/+$/, '').toLowerCase();
}

export function isSafeLinkTarget(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  return isValidHttpUrl(url);
}

export function searchCombinedCatalog(
  rawQuery: string,
  catalogItems: CatalogSearchInputItem[],
  feedItems: CatalogSearchInputItem[] = [],
  limit = 8,
): CombinedSearchResult[] {
  const query = String(rawQuery || '').trim();
  if (!query) return [];

  const tokens = extractSearchTerms(query);
  const queryLower = query.toLowerCase();
  const byUrl = new Map<string, CatalogSearchInputItem>();

  const makeDedupKey = (item: CatalogSearchInputItem) => {
    const normUrl = normalizeUrlForDedup(item.url);
    const isSharedContainer =
      normUrl === '/executive' ||
      normUrl === 'https://www.threads.com/@david888.chiang' ||
      normUrl === 'https://github.com/tbdavid2019';
    return isSharedContainer
      ? `${normUrl}::${item.title.trim().toLowerCase()}`
      : normUrl;
  };

  // Catalog items take priority over duplicate feed items while keeping distinct items on shared container URLs
  for (const item of catalogItems || []) {
    if (!item || !item.title || !isSafeLinkTarget(item.url)) continue;
    const key = makeDedupKey(item);
    if (!byUrl.has(key)) byUrl.set(key, item);
  }
  for (const item of feedItems || []) {
    if (!item || !item.title || !isSafeLinkTarget(item.url)) continue;
    const key = makeDedupKey(item);
    if (!byUrl.has(key)) byUrl.set(key, item);
  }

  const scored: CombinedSearchResult[] = [];

  for (const [key, item] of byUrl.entries()) {
    const titleLower = item.title.toLowerCase();
    const summaryLower = (item.summary || '').toLowerCase();
    const tagsLower = (item.tags || []).join(' ').toLowerCase();
    const sourceLower = (item.source || '').toLowerCase();

    let score = 0;
    if (titleLower === queryLower) score += 60;
    else if (titleLower.includes(queryLower)) score += 35;

    if (summaryLower.includes(queryLower)) score += 16;
    if (tagsLower.includes(queryLower)) score += 20;

    for (const phrase of tokens.rawPhrases) {
      if (titleLower.includes(phrase)) score += 16;
      if (tagsLower.includes(phrase)) score += 12;
      if (summaryLower.includes(phrase)) score += 8;
    }

    for (const tok of tokens.asciiTokens) {
      if (titleLower.includes(tok)) score += 12;
      if (tagsLower.includes(tok)) score += 9;
      if (sourceLower === tok) score += 10;
      if (summaryLower.includes(tok)) score += 5;
    }

    for (const ngram of tokens.cjkNgrams) {
      if (titleLower.includes(ngram)) score += 6;
      if (tagsLower.includes(ngram)) score += 4;
      if (summaryLower.includes(ngram)) score += 2;
    }

    if (score <= 0) continue;
    if (item.featured) score += 3;

    scored.push({
      id: item.id || key,
      title: item.title,
      summary: item.summary || '',
      url: item.url,
      source: item.source || 'portfolio',
      featured: Boolean(item.featured),
      publishedAt: item.publishedAt,
      score,
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const bTs = b.publishedAt ? Date.parse(b.publishedAt) || 0 : 0;
    const aTs = a.publishedAt ? Date.parse(a.publishedAt) || 0 : 0;
    return bTs - aTs;
  });

  return scored.slice(0, Math.max(1, limit));
}

export function createInitialGreetingMessage(
  locale: 'zh' | 'en',
  mode: ConciergeMode = 'qa',
): DockChatMessage {
  const isZh = locale !== 'en';
  if (mode === 'contact') {
    return {
      id: `greeting-contact-${locale}`,
      role: 'assistant',
      mode: 'contact',
      kind: 'text',
      content: isZh
        ? '您好！我是 David 的小秘書，很高興為您服務！David 具備百人工程研發組織管理實戰經驗，專長於技術戰略判斷、跨系統整合、雲端成本與 ROI 控管，以及架構落地。請問今天想了解 David 哪方面的合作事宜？或是希望我如何為您協助轉達呢？'
        : "Hello! I am David's Concierge. David brings extensive experience leading 100+ engineer R&D organizations as a CTO, specializing in technology strategy, cross-system integration, cloud cost & ROI optimization, and architecture delivery. How may I assist you today?",
    };
  }

  return {
    id: `greeting-qa-${locale}`,
    role: 'assistant',
    mode: 'qa',
    kind: 'text',
    content: isZh
      ? '你好！可輸入任何問題查詢 David 的作品、GitHub、Blog、Podcast 與 Threads 近期動態，或輸入 `/` 使用快速指令（如 `/search`、`/rss`、`/contact`）。'
      : 'Hi! Ask anything about David’s portfolio, GitHub, Blog, Podcast, or Threads notes, or type `/` for quick commands (`/search`, `/rss`, `/contact`).',
  };
}
