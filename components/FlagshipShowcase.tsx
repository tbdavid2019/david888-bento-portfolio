import React, { useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  ExternalLink,
  FileSearch,
  LineChart,
  Newspaper,
  Podcast,
  Store,
  type LucideIcon,
} from 'lucide-react';
import type { Locale } from '../types';

interface FlagshipSystem {
  id: string;
  domain: string;
  url: string;
  repoUrl?: string;
  docUrl?: string;
  docLabelZh?: string;
  docLabelEn?: string;
  icon: LucideIcon;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  breakthroughsZh: string[];
  breakthroughsEn: string[];
  techStack: string[];
  subLinks?: Array<{ labelZh: string; labelEn: string; url: string }>;
  mcpConfig?: {
    endpoint: string;
    descriptionZh: string;
    descriptionEn: string;
    configSnippet: string;
  };
}

const FLAGSHIP_SYSTEMS: FlagshipSystem[] = [
  {
    id: 'stockbot',
    domain: 'bot.david888.com',
    url: 'https://bot.david888.com/',
    repoUrl: 'https://github.com/tbdavid2019/stockbot',
    docUrl: 'https://wiki.david888.com/share/rzye4g',
    docLabelZh: '實戰題庫指南',
    docLabelEn: 'Prompt Guide',
    icon: Bot,
    titleZh: '888 StockBot 2.0 ｜ 台美股估值與籌碼分析系統',
    titleEn: '888 StockBot 2.0 — Equity Valuation & Chip Flow Analysis',
    subtitleZh:
      '以 TypeScript 實作財務估值與選擇權試算，整合台股三大法人買賣超資料與 TradingView 互動圖表。',
    subtitleEn:
      'TypeScript quantitative analysis tool combining DCF valuation, Minervini SEPA, options PnL calculation, TWSE/TPEx institutional flows, and interactive charts.',
    breakthroughsZh: [
      '財務與估值計算：實作 DCF 現金流折現、Minervini SEPA 趨勢條件、選擇權損益試算與流動性指標',
      '台股籌碼資料整合：串接證交所與櫃買中心三大法人買賣超、籌碼集中度與 TradingView K 線圖表',
      '即時搜尋與圖表卡片：連接 2MD 網頁搜尋與動態財報圖表呈現',
    ],
    breakthroughsEn: [
      'Financial & valuation calculators: DCF cash flow, Minervini SEPA trend criteria, options PnL & liquidity metrics',
      'Taiwan market chip data: integrates TWSE/TPEx foreign, trust, and dealer flows with TradingView charts',
      'Live web search & dynamic financial summary cards powered by 2MD',
    ],
    techStack: [
      'TypeScript',
      'DCF & SEPA',
      'Options PnL',
      'TWSE Chip Flow',
      'TradingView Charts',
      '2MD Search',
    ],
  },
  {
    id: 'stockquant',
    domain: 'stockdata.david888.com',
    url: 'https://stockdata.david888.com/',
    repoUrl: 'https://github.com/tbdavid2019/stock-underdog-ml',
    icon: LineChart,
    titleZh: '888 StockQuant ｜ 時間序列預測與籌碼分析平台',
    titleEn: '888 StockQuant — Time-Series Forecasting & Market Data Platform',
    subtitleZh:
      '結合 Google TimesFM、Timestral 與 LSTM 時間序列模型，整理台美股走勢區間與三大法人、券商分點買賣超資料。',
    subtitleEn:
      'Quantitative data workbench combining Google TimesFM, Timestral, and LSTM models for price forecasting alongside broker-branch chip tracking.',
    breakthroughsZh: [
      '時間序列預測模型：使用 TimesFM、Timestral 與 LSTM 模型計算台美股走勢區間供研究參考',
      '券商分點與法人籌碼：追蹤券商分點買賣超變化與三大法人資金流向',
      '技術指標整理：自動計算 MACD、RSI、波動率通道與量價指標，集中於單一介面檢視',
    ],
    breakthroughsEn: [
      'Time-series forecasting using TimesFM, Timestral, and LSTM models for Taiwan and US equities',
      'Broker-branch & institutional flow tracking across major market participants',
      'Automated technical indicator calculation (MACD, RSI, volatility bands, volume structure) in one dashboard',
    ],
    techStack: [
      'TimesFM & Timestral',
      'LSTM',
      'Broker Flow Tracking',
      'Technical Indicators',
      'TW/US Equities',
    ],
  },
  {
    id: '888news',
    domain: 'news2.david888.com',
    url: 'https://news2.david888.com/',
    repoUrl: 'https://github.com/tbdavid2019/888news',
    docUrl: 'https://news2.david888.com/agent',
    docLabelZh: 'Agent 串接指南',
    docLabelEn: 'Agent Guide',
    icon: Newspaper,
    titleZh: '888news ｜ 科技與 AI 新聞自動彙整系統',
    titleEn: '888news — Automated Tech & AI News Aggregator',
    subtitleZh:
      '自動收集超過 100 個科技媒體與 AI 實驗室公告，透過語意分類合併重複報導、過濾廣編稿，每日產出中英雙語新聞摘要。',
    subtitleEn:
      'Automated news pipeline tracking 100+ AI labs and tech feeds with semantic grouping, ad filtering, and daily bilingual summaries.',
    breakthroughsZh: [
      '多來源自動收集：定時抓取 OpenAI、Anthropic、Google、Meta 與主要科技媒體的最新發佈',
      '事件歸類與廣編過濾：自動將同一事件的多篇報導合併，並以 LLM 評分排除低相關性的公關稿',
      '每日重點摘要：每日整理中英雙語科技日報，並提供標準 MCP 介面供外部 Agent 查詢',
    ],
    breakthroughsEn: [
      'Automated feed collection across 100+ AI research labs, engineering blogs, and tech news sites',
      'Event clustering and ad filtering that groups duplicate stories and removes low-value PR posts',
      'Daily bilingual digest generation with a public Streamable HTTP MCP endpoint for AI agents',
    ],
    techStack: [
      '100+ Tech Feeds',
      'Event Clustering',
      'LLM Filtering',
      'Streamable HTTP MCP',
      'Cloudflare Workers',
    ],
    mcpConfig: {
      endpoint: 'https://news2.david888.com/api/mcp',
      descriptionZh:
        '支援遠端 MCP 的 Agent 與開發工具可直接連線呼叫 5 個工具。採用標準 Streamable HTTP，匿名只讀、免 Token，回傳文字與結構化資料。',
      descriptionEn:
        'Remote MCP endpoint exposing 5 tools for AI agents and dev tools. Standard Streamable HTTP, anonymous read-only, no token required.',
      configSnippet: JSON.stringify(
        {
          mcpServers: {
            news888: {
              type: 'http',
              url: 'https://news2.david888.com/api/mcp',
            },
          },
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'podcast',
    domain: 'podcast.david888.com',
    url: 'https://podcast.david888.com/',
    icon: Podcast,
    titleZh: 'DAVID888 Daily ｜ 自動化科技新聞 Podcast',
    titleEn: 'DAVID888 Daily — Automated Tech News Podcast',
    subtitleZh:
      '每日自動整理 Hacker News、GitHub Trending 與 Product Hunt 熱門話題，產生繁體中文與英語講稿並轉為語音，透過 RSS 發佈至各 Podcast 平台。',
    subtitleEn:
      'Daily automated pipeline summarizing Hacker News, GitHub Trending, and Product Hunt into Traditional Chinese and English audio episodes distributed via RSS.',
    breakthroughsZh: [
      '開發者社群動態整理：每日自動抓取 Hacker News、GitHub Trending、Product Hunt 與 Dev.to 熱門討論',
      '自動文稿與語音合成：將整理後的重點轉為中英雙語講稿，透過 TTS 產生語音並完成音量標準化',
      '音訊代管與 RSS 發佈：串接自建 888box 儲存服務與 RSS 2.0 Feed，支援網頁直接收聽與 Podcast 訂閱',
    ],
    breakthroughsEn: [
      'Daily aggregation of Hacker News, GitHub Trending, Product Hunt, and Dev.to discussions',
      'Automated script writing, TTS voice generation, and audio normalization in Chinese and English',
      'Hosted on 888box storage with standard RSS 2.0 feeds for web playback and podcast apps',
    ],
    techStack: [
      'TTS Audio Pipeline',
      'HN / GitHub / PH Scraper',
      'Bilingual Scripts',
      'Audio Normalization',
      '888box Storage',
      'RSS 2.0 Feed',
    ],
    subLinks: [
      { labelZh: 'English Edition (英文版)', labelEn: 'English Edition', url: 'https://podcast.david888.com/en' },
      { labelZh: 'RSS 訂閱源', labelEn: 'RSS Feed', url: 'https://podcast.david888.com/rss.xml' },
    ],
  },
  {
    id: 'qimen',
    domain: 'qi.david888.com',
    url: 'https://qi.david888.com/',
    icon: Compass,
    titleZh: '333 奇門遁甲 ｜ 傳統曆法排盤與 AI 解讀網站',
    titleEn: '333 Qi Men Dun Jia — Calendar Rule Engine & AI Interpretation',
    subtitleZh:
      '將奇門遁甲、生辰八字、梅花易數、風水與塔羅的排盤規則寫成固定演算法，再交由 AI 進行多輪問答解讀。',
    subtitleEn:
      'Consumer web application combining a deterministic calendar calculation engine with multi-turn AI Q&A across Qi Men, Bazi, Tarot, and Feng Shui.',
    breakthroughsZh: [
      '固定規則排盤程式：二十四節氣、陰陽遁局與天干地支排盤皆由固定規則程式計算，AI 僅負責後續問答解讀',
      '八字人生 K 線與多輪問答：將大運流年繪製成 K 線圖表，並支援依據排盤結果繼續追問',
      '多主題產品整合：在同一個網站架構下整合奇門、八字、塔羅、風水與月老等子服務',
    ],
    breakthroughsEn: [
      'Deterministic calendar calculation engine computing solar terms and sexagenary charts before AI interpretation',
      'Bazi Life K-Line chart visualization with context-aware follow-up Q&A',
      'Multi-module web product combining Qi Men, Bazi, Tarot, Feng Shui, and Matchmaking tools',
    ],
    techStack: [
      'Calendar Rule Engine',
      'Solar Term Calculation',
      'Bazi Life K-Line',
      'Multi-Turn Q&A',
      'Consumer Web App',
    ],
    subLinks: [
      { labelZh: '八字人生 K 線', labelEn: 'Bazi Life K-Line', url: 'https://bazi.david888.com' },
      { labelZh: '生辰八字 2.0', labelEn: 'Bazi 2.0', url: 'https://qi.david888.com/bazi2' },
      { labelZh: '塔羅決策', labelEn: 'Tarot Reading', url: 'https://qi.david888.com/tarot' },
      { labelZh: '風水顧問', labelEn: 'Feng Shui Advisor', url: 'https://qi.david888.com/fengshui' },
      { labelZh: '月老姻緣', labelEn: 'Matchmaking', url: 'https://qi.david888.com/yinyuan' },
    ],
  },
  {
    id: '2md',
    domain: '2md.aiurl.tw',
    url: 'https://2md.aiurl.tw/',
    repoUrl: 'https://github.com/tbdavid2019/888-url2md',
    docUrl: 'https://2md.aiurl.tw/',
    docLabelZh: 'API & Skill 規範',
    docLabelEn: 'API & Skill Spec',
    icon: FileSearch,
    titleZh: '2MD (888-url2md) ｜ 網頁與文件解析、PP-OCRv4 表格重建與個資去識別化引擎',
    titleEn: '2MD (888-url2md) — Web/Doc Parser, PP-OCRv4 Table Reconstruction & PII Shield',
    subtitleZh:
      '將任意網頁、多格式文件（PDF/Word/Excel/PPT/EPUB）、高解析圖片表格與即時搜尋結果，毫秒級轉換為乾淨的 GFM Markdown 或結構化 JSON，內建 15 類台灣與國際個資去識別化護盾。',
    subtitleEn:
      'High-speed LLM ingestion engine converting live web pages, office documents, tabular images (PP-OCRv4), and SERP queries into clean GFM Markdown or JSON, complete with 15-category PII de-identification.',
    breakthroughsZh: [
      '全格式文件與多網址批次爬取：支援單頁擷取、即時網頁搜尋 (`/s/<query>`)、多網址批次讀取與 AnyDoc 文件解析（PDF/Office/EPUB <5ms 轉換）',
      'PP-OCRv4 空間表格重建：支援最高 50MB 圖片上傳（`/api/ocr`），透過 2D Bounding-Box 空間聚類將圖片表格自動還原為標準 GFM Markdown 表格',
      '個資去識別化護盾（PII Shield）：內建 15 類台灣（7 類）與國際（8 類）敏感個資規則（`/api/deid` 或 `X-Deidentify: true`），支援 5 種遮罩模式、自訂 RegExp 與可逆 CSV 映射表',
    ],
    breakthroughsEn: [
      'Multi-URL batch crawling, live SERP search (`/s/<query>`), and sub-5ms AnyDoc document parsing (PDF/Word/Excel/PPT/EPUB)',
      'PP-OCRv4 2D spatial table reconstruction (`/api/ocr`, up to 50MB images) converting complex tabular screenshots directly into GFM Markdown tables',
      'PII De-Identification & Privacy Shield (`/api/deid` or `X-Deidentify: true`) masking 15 Taiwan & international PII categories with reversible CSV mapping and AI privacy scoring',
    ],
    techStack: [
      'AnyDoc Parser',
      'PaddleOCR PP-OCRv4',
      '2D Table Reconstruction',
      '15-Rule PII De-ID',
      'Batch Crawl & SERP',
      'WebMCP & Agent Skill',
    ],
    subLinks: [
      { labelZh: '即時搜尋 API (/s/台積電)', labelEn: 'Live Search API', url: 'https://2md.aiurl.tw/s/%E5%8F%B0%E7%A9%8D%E9%9B%BB' },
      { labelZh: 'OCR 叢集狀態 (/api/capabilities)', labelEn: 'OCR Capabilities', url: 'https://2md.aiurl.tw/api/capabilities' },
    ],
  },
  {
    id: 'storepulse',
    domain: 'storepulse.david888.com',
    url: 'https://storepulse.david888.com/',
    docUrl: 'https://storepulse.david888.com/llms.txt',
    docLabelZh: 'llms.txt 規範',
    docLabelEn: 'llms.txt Spec',
    icon: Store,
    titleZh: 'Store Pulse 店面脈搏 ｜ Google Maps 多分店評價速查與避雷分析系統',
    titleEn: 'Store Pulse — Google Maps Multi-Branch Review Curation & Anti-Hallucination Analysis',
    subtitleZh:
      '專為實體門市、連鎖餐飲與零售品牌打造的 Google Maps 多分店評價速查、顧客負評標記與避雷深度分析系統。透過 Cloudflare Workers 邊緣運算與自備金鑰（BYOK）雙軌機制，協助消費者比較門市水準，並為連鎖品牌自動提煉各門市真實痛點與服務缺口。',
    subtitleEn:
      'Operational intelligence and anti-hallucination review curation for retail and dining chains on Cloudflare Workers edge runtime, featuring BYOK zero-knowledge privacy, SHA-256 evidence fingerprinting, and automated pain-point extraction.',
    breakthroughsZh: [
      '多分店即時搜尋與比對：整合 Google Maps JavaScript API 與 Places Service，支援全台連鎖品牌一鍵搜尋鄰近分店，並以 Haversine 公式精算距離與評分差異',
      '雙軌評論擷取與四層過濾：結合 Google Places 5 則快速預覽與 SerpApi BYOK 20～25 則深度評論，透過 4-Tier 優先權演算法篩選在地嚮導 1～3 星真實痛點負評，排除行銷刷榜短評',
      '防幻覺證據指紋與六大維度分析：每則評論生成 SHA-256 唯一指紋（ev_<hash>），AI 摘要與觀察強制錨定證據；依排隊時間、服務態度、餐點品質、性價比、環境清潔與行銷活動六大維度結構化輸出',
      'BYOK 零知識隱私架構：支援 Gemini、Groq、OpenAI、xAI、Claude 與 Cloudflare Workers AI，金鑰僅存本機 localStorage，端對端傳輸且伺服器記憶體用畢即焚，符合 llms.txt 規範並提供標準 REST API',
    ],
    breakthroughsEn: [
      'Multi-branch live search & comparison: Integrates Google Maps JS API & Places Service with Haversine distance calculations and instant rating benchmarks across branch networks',
      'Dual-source review ingestion & 4-tier curation: Combines Google Places fast preview with SerpApi BYOK deep scraping (~25 reviews), ranking Local Guide 1–3 star pain points while filtering fake reviews and incentive promotions',
      'Anti-hallucination evidence fingerprinting: Generates SHA-256 fingerprints (ev_<hash>) for all reviews, strictly binding AI findings to cited evidence across 6 operational dimensions (wait time, service, quality, pricing, cleanliness, marketing)',
      'Zero-Knowledge BYOK privacy & edge API: Supports Gemini, Groq, OpenAI, xAI, Claude, and Cloudflare Workers AI with client-side key storage and ephemeral memory forwarding; provides standard REST API and llms.txt / llms-full.txt machine-readable specs',
    ],
    techStack: [
      'Cloudflare Workers',
      'Google Places & SerpApi',
      'BYOK Zero-Knowledge',
      'SHA-256 Evidence Hash',
      'Anti-Hallucination Guard',
      'llms.txt REST API',
    ],
    subLinks: [
      { labelZh: '完整技術規格 (llms-full.txt)', labelEn: 'Full Spec (llms-full.txt)', url: 'https://storepulse.david888.com/llms-full.txt' },
      { labelZh: 'API Health Check 端點', labelEn: 'API Health Endpoint', url: 'https://storepulse.david888.com/api/health' },
    ],
  },
];

interface FlagshipShowcaseProps {
  locale: Locale;
}

export const FlagshipShowcase: React.FC<FlagshipShowcaseProps> = ({ locale }) => {
  const isEn = locale === 'en';
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(false as any), 2000);
  };

  return (
    <section
      id="flagships"
      aria-label={isEn ? `${FLAGSHIP_SYSTEMS.length} Flagship Live Systems` : `精選 ${FLAGSHIP_SYSTEMS.length} 大主力線上系統`}
      className="scroll-mt-24 space-y-5"
    >
      <div className="dossier-card border-2 border-[#17324d] p-5 sm:p-7 dark:border-[#ffb010]/70">
        <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-text-main sm:text-3xl">
              {isEn
                ? `${FLAGSHIP_SYSTEMS.length} Flagship Systems — Selected Production Products`
                : `精選 ${FLAGSHIP_SYSTEMS.length} 大主力線上系統（長期維運實機產品）`}
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-text-muted">
              {isEn
                ? `Selected from 180+ open-source GitHub repositories and full-stack projects—${FLAGSHIP_SYSTEMS.length} flagship systems independently built and maintained end-to-end, spanning quantitative finance, time-series forecasting, automated tech intelligence, LLM document/OCR/PII ingestion (2MD), Google Maps multi-branch review curation (Store Pulse), daily audio podcasts, and calendar decision engines.`
                : `從個人 180+ 個 GitHub 開源專案與實戰工具庫中，精選 ${FLAGSHIP_SYSTEMS.length} 套由我獨立架構、前後端開發並長期維運的主力系統（涵蓋台美股估值分析、時序預測模型、科技情報自動彙整、2MD 網頁/文件/OCR/去識別化引擎、Store Pulse 實體門市評價與避雷分析、語音廣播基建與傳統曆法決策網站）。`}
            </p>
          </div>
          <div className="shrink-0 font-mono text-xs font-bold text-[#a9471d] dark:text-[#ffb010]">
            {isEn ? `${FLAGSHIP_SYSTEMS.length} FLAGSHIP DOMAINS` : `${FLAGSHIP_SYSTEMS.length} 大主力線上網域`}
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {FLAGSHIP_SYSTEMS.map((sys) => {
            const Icon = sys.icon;
            const title = isEn ? sys.titleEn : sys.titleZh;
            const subtitle = isEn ? sys.subtitleEn : sys.subtitleZh;
            const breakthroughs = isEn ? sys.breakthroughsEn : sys.breakthroughsZh;

            return (
              <article
                key={sys.id}
                className="rounded-xl border border-border bg-bg-elevated p-5 transition-colors hover:border-[#17324d] sm:p-6 dark:hover:border-[#ffb010]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2b251a] bg-[#ffb010] text-[#2b251a]">
                        <Icon size={20} strokeWidth={2} />
                      </span>
                      <a
                        href={sys.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-full break-all rounded-md border border-[#17324d]/30 bg-[#fff0cc] px-2.5 py-1 font-mono text-xs font-bold text-[#17324d] no-underline transition-colors hover:bg-[#ffb010] dark:border-[#ffb010]/40 dark:bg-[#17324d] dark:text-[#ffb010]"
                      >
                        {sys.domain}
                      </a>
                    </div>

                    <h3 className="mt-3 min-w-0 break-words text-xl font-extrabold leading-snug text-text-main sm:text-2xl">
                      <a
                        href={sys.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-main no-underline hover:underline"
                      >
                        {title}
                      </a>
                    </h3>

                    <p className="mt-2 max-w-[72ch] text-base leading-relaxed text-text-muted">
                      {subtitle}
                    </p>
                  </div>

                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center lg:flex-col lg:items-end">
                    <a
                      href={sys.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-saffron inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 text-sm no-underline sm:w-auto"
                    >
                      <span>{isEn ? 'Launch Live System' : '開啟線上實機系統'}</span>
                      <ArrowUpRight size={17} />
                    </a>

                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                      {sys.docUrl && (
                        <a
                          href={sys.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#17324d] bg-bg-surface px-3 py-1.5 text-xs font-bold text-text-main no-underline transition-colors hover:bg-[#fff0cc] sm:flex-none dark:border-[#ffb010]/60 dark:hover:bg-[#17324d]"
                        >
                          <BookOpen size={14} />
                          <span>{isEn ? sys.docLabelEn : sys.docLabelZh}</span>
                        </a>
                      )}
                      {sys.repoUrl && (
                        <a
                          href={sys.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-bg-surface px-3 py-1.5 font-mono text-xs font-bold text-text-main no-underline transition-colors hover:border-[#17324d] sm:flex-none dark:hover:border-[#ffb010]"
                        >
                          <span>GitHub</span>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Engineering Breakthroughs */}
                <div className="mt-4 rounded-xl border border-border/80 bg-bg-surface p-4">
                  <div className="mb-2.5 text-xs font-extrabold text-[#a9471d] dark:text-[#ffb010]">
                    {isEn ? 'Key Architectural & Engineering Highlights:' : '核心技術架構與實作重點：'}
                  </div>
                  <ul className="m-0 list-none space-y-2 p-0">
                    {breakthroughs.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-main">
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-[#17324d] dark:text-[#ffb010]"
                        />
                        <span className="min-w-0 break-words">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sub-modules for Qi Ecosystem if present */}
                {sys.subLinks && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-text-muted">
                      {isEn ? 'Direct Modules:' : '子系統直達：'}
                    </span>
                    {sys.subLinks.map((sub) => (
                      <a
                        key={sub.url}
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-border bg-bg-surface px-2.5 py-1 text-xs font-bold text-text-main no-underline transition-colors hover:border-[#17324d] hover:bg-[#fff0cc] dark:hover:border-[#ffb010] dark:hover:bg-[#17324d]"
                      >
                        <span>{isEn ? sub.labelEn : sub.labelZh}</span>
                        <ArrowUpRight size={12} />
                      </a>
                    ))}
                  </div>
                )}

                {/* Remote MCP Server Config if present */}
                {sys.mcpConfig && (
                  <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-border bg-bg-surface p-3.5 sm:p-4">
                    <div className="flex flex-col gap-2.5 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-[#17324d] bg-[#17324d] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[#fff9e8] dark:border-[#ffb010] dark:bg-[#ffb010] dark:text-[#2b251a]">
                          REMOTE MCP
                        </span>
                        <span className="text-xs font-extrabold text-text-main">
                          {isEn ? 'Agent 5-Tool Remote Endpoint' : 'Agent 5 工具遠端呼叫端點'}
                        </span>
                      </div>
                      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                        <button
                          type="button"
                          onClick={() => handleCopy(`${sys.id}-endpoint`, sys.mcpConfig!.endpoint)}
                          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 font-mono text-xs font-bold text-text-main transition-colors hover:border-[#17324d] hover:bg-[#fff0cc] dark:hover:border-[#ffb010]"
                        >
                          {copiedKey === `${sys.id}-endpoint` ? <Check size={13} /> : <Copy size={13} />}
                          <span className="truncate">
                            {copiedKey === `${sys.id}-endpoint`
                              ? isEn
                                ? 'Copied URL!'
                                : '已複製端點！'
                              : isEn
                                ? 'Copy Endpoint'
                                : '複製端點'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${sys.id}-config`, sys.mcpConfig!.configSnippet)}
                          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-[#17324d] bg-[#fff0cc] px-2.5 py-1.5 font-mono text-xs font-bold text-[#17324d] transition-colors hover:bg-[#ffb010] dark:border-[#ffb010]/60 dark:bg-[#17324d] dark:text-[#ffb010]"
                        >
                          {copiedKey === `${sys.id}-config` ? <Check size={13} /> : <Copy size={13} />}
                          <span className="truncate">
                            {copiedKey === `${sys.id}-config`
                              ? isEn
                                ? 'Copied Config!'
                                : '已複製組態！'
                              : isEn
                                ? 'Copy MCP Config'
                                : '複製通用 MCP 組態'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs leading-relaxed text-text-muted">
                      {isEn ? sys.mcpConfig.descriptionEn : sys.mcpConfig.descriptionZh}
                    </p>

                    <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="shrink-0 font-mono text-xs font-bold text-text-muted">URL:</span>
                      <code className="min-w-0 max-w-full break-all rounded-md border border-border bg-black/5 px-2.5 py-1.5 font-mono text-xs text-[#a9471d] dark:bg-black/40 dark:text-[#ffb010]">
                        {sys.mcpConfig.endpoint}
                      </code>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1.5 text-[11px] font-bold text-text-muted">
                        {isEn ? '5 Agent Tools Available:' : '連上後直接呼叫五個工具：'}
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:flex lg:flex-wrap">
                        {[
                          { name: 'news888_get_latest', desc: isEn ? 'Latest/7d news' : '精選與全部動態' },
                          { name: 'news888_search', desc: isEn ? '7-day search' : '7天關鍵字搜尋' },
                          { name: 'news888_get_hot_topics', desc: isEn ? 'Hot topics ranking' : '熱門話題與排名' },
                          { name: 'news888_get_story', desc: isEn ? 'Story timeline' : '事件時間軸整理' },
                          { name: 'news888_get_daily', desc: isEn ? 'Daily digest' : '最新 AI 日報' },
                        ].map((t) => (
                          <span
                            key={t.name}
                            className="inline-flex flex-wrap items-center rounded-md border border-border/80 bg-bg-elevated px-2.5 py-1 font-mono text-[11px] text-text-main"
                          >
                            <span className="font-bold text-[#17324d] dark:text-[#ffb010]">{t.name}</span>
                            <span className="ml-1 text-text-muted">({t.desc})</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 text-[11px] font-bold text-text-muted">
                        {isEn
                          ? 'Universal MCP Configuration (Cursor / Claude Desktop / Antigravity):'
                          : '通用 MCP 組態（支援 Cursor、Claude Desktop、Antigravity 等各類 Agent 工具）：'}
                      </div>
                      <pre className="max-w-full overflow-x-auto rounded-lg bg-black/5 p-3 font-mono text-xs leading-tight text-text-main dark:bg-black/40">
                        <code>{sys.mcpConfig.configSnippet}</code>
                      </pre>
                    </div>

                    <div className="mt-3 flex flex-col gap-2.5 border-t border-border/60 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 font-mono text-[11px] text-text-muted">
                        <span className="mr-1.5 font-bold">CLI:</span>
                        <code className="inline-block max-w-full break-all rounded bg-black/5 px-2 py-1 text-text-main dark:bg-black/40">
                          claude mcp add --transport http news888 'https://news2.david888.com/api/mcp'
                        </code>
                      </div>
                      <a
                        href="https://news2.david888.com/agent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[36px] shrink-0 items-center gap-1 self-start font-mono text-xs font-bold text-[#a9471d] hover:underline sm:self-auto dark:text-[#ffb010]"
                      >
                        <span>{isEn ? 'View Full Agent Docs →' : '查看完整 Agent 串接指南 →'}</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Tech Stack Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/70 pt-3.5">
                  {sys.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-border bg-bg-surface px-2.5 py-1 font-mono text-xs font-semibold text-text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
