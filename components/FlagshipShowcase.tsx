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
  LineChart,
  Newspaper,
  Podcast,
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
    titleZh: '888 StockBot 2.0 ｜ 機構級金融多智能體系統',
    titleEn: '888 StockBot 2.0 — Institutional Financial AI Agent',
    subtitleZh:
      '不依賴外部黑盒算力，以純 TypeScript 原生建構華爾街級量化估值與期權引擎，結合台股三大法人籌碼穿透與 Generative UI 互動圖表工作台。',
    subtitleEn:
      'Pure TypeScript institutional quantitative engine combining DCF valuation, Minervini SEPA, options Greeks, TWSE/TPEx institutional chip flows, and Generative UI cards.',
    breakthroughsZh: [
      '純 TypeScript 原生量化引擎：實作 DCF 現金流折現估值、Minervini SEPA 趨勢模板、期權損益模擬與微觀流動性衝擊模型',
      '台股籌碼深度穿透：即時整併證交所與櫃買中心三大法人買賣超、主力籌碼集中度與 TradingView 互動式 K 線圖表',
      '多智能體協同與即時連網：串接自研 2MD 毫秒級 SERP 搜尋引擎與 Generative UI 動態財報卡片渲染',
    ],
    breakthroughsEn: [
      'Native TypeScript quant engines: DCF intrinsic valuation, Minervini SEPA trend templates, options PnL & micro-liquidity modeling',
      'TWSE/TPEx institutional penetration: real-time foreign, trust, and dealer flow tracking integrated with TradingView charts',
      'Multi-agent tool orchestration with live 2MD SERP web search and dynamic Generative UI financial cards',
    ],
    techStack: [
      'TypeScript Quant Engine',
      'DCF & SEPA',
      'Options Greeks',
      'TWSE Chip Flow',
      'Generative UI',
      '2MD SERP',
    ],
  },
  {
    id: 'stockquant',
    domain: 'stockdata.david888.com',
    url: 'https://stockdata.david888.com/',
    repoUrl: 'https://github.com/tbdavid2019/stock-underdog-ml',
    icon: LineChart,
    titleZh: '888 StockQuant ｜ 雙時序大模型與多維量化決策平台',
    titleEn: '888 StockQuant — Time-Series Foundation Model & Quant Platform',
    subtitleZh:
      '整合 Google TimesFM 與 Timestral 雙時序基礎大模型、LSTM 次日價格預測，以及三大法人與券商分點主力籌碼雷達的專業量化數據工作台。',
    subtitleEn:
      'Multi-dimensional quantitative decision workbench powered by Google TimesFM & Timestral time-series foundation models, LSTM forecasting, and broker-branch chip radars.',
    breakthroughsZh: [
      '雙時序大模型架構：同步驅動 TimesFM 與 Timestral 時序基礎模型及 LSTM 深度學習管線，進行台美股次日走勢機率預測',
      '券商分點與法人籌碼雷達：穿透追蹤關鍵券商分點吸籌、派發異常與三大法人多空力道背離',
      '自動化特徵工程管線：將數十項技術指標矩陣（MACD、RSI、波動率通道、量價結構）收斂為直覺的機構級決策儀表板',
    ],
    breakthroughsEn: [
      'Dual time-series foundation models (TimesFM & Timestral) paired with LSTM pipelines for next-day equity forecasting',
      'Broker-branch & institutional flow radar detecting hidden accumulation and distribution across Taiwan and US markets',
      'End-to-end automated feature engineering distilling multi-factor technical indicators into actionable quant signals',
    ],
    techStack: [
      'TimesFM & Timestral',
      'LSTM Forecasting',
      'Broker Branch Radar',
      'Multi-Factor Quant',
      'TW/US Equities',
    ],
  },
  {
    id: '888news',
    domain: 'news2.david888.com',
    url: 'https://news2.david888.com/',
    repoUrl: 'https://github.com/tbdavid2019/888news',
    icon: Newspaper,
    titleZh: '888news ｜ 全球科技與 AI 情報自動化雷達',
    titleEn: '888news — Autonomous Global Tech & AI Intelligence Radar',
    subtitleZh:
      '全天候自動監控全球上百個頂尖 AI 實驗室與一手科技信源，透過多源報導語意歸組與 LLM 品質評分過濾行銷噪音，每日清晨產出高管情報簡報。',
    subtitleEn:
      'Autonomous intelligence pipeline tracking 100+ frontier AI labs and primary tech sources with multi-source semantic clustering, quality scoring, and executive synthesis.',
    breakthroughsZh: [
      '百大一手信源高併發擷取：涵蓋 OpenAI、Anthropic、Google DeepMind、Meta 及頂尖工程部落格之自動化監控管線',
      '多源語意歸組與噪音過濾：自動聚類同一事件之跨國報導，並透過 LLM 嚴格評分剔除公關廣編與內容農場',
      '雙語高管情報合成：將零散的技術發佈提煉為具架構洞察與商業影響力評估的每日精選雷達',
    ],
    breakthroughsEn: [
      'High-concurrency ingestion monitoring 100+ primary AI research labs, engineering blogs, and global tech feeds',
      'Multi-source semantic event clustering and strict LLM quality scoring that strips out PR fluff and low-signal noise',
      'Automated daily bilingual executive synthesis focused on architectural breakthroughs and strategic impact',
    ],
    techStack: [
      '100+ Source Ingestion',
      'Semantic Clustering',
      'LLM Quality Scoring',
      'Streamable HTTP MCP',
      'Cloudflare Edge',
    ],
    mcpConfig: {
      endpoint: 'https://news2.david888.com/api/mcp',
      descriptionZh:
        'Agent 直接呼叫五個工具：適合支援遠端 MCP 的 Agent 與開發工具。標準 Streamable HTTP，匿名只讀，不需要 token；工具返回簡潔文字與同一份結構化資料。',
      descriptionEn:
        'Agent directly calls 5 tools. Built for remote MCP-compatible agents and dev tools. Standard Streamable HTTP, anonymous read-only, no token required; tools return concise text and structured data.',
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
    titleZh: 'DAVID888 Daily ｜ 自動化 AI 播客與智慧語音媒體基建',
    titleEn: 'DAVID888 Daily — Automated AI Podcast & Audio Media Infrastructure',
    subtitleZh:
      '每日自動彙整 Hacker News、GitHub Trending、Product Hunt 與全球商業科技動態，全自動完成台灣繁中深度腳本編排、擬真語音合成與標準 RSS 串流分發。',
    subtitleEn:
      'End-to-end autonomous media pipeline aggregating Hacker News, GitHub Trending, and Product Hunt into daily Traditional Chinese analysis and broadcast-ready podcast episodes.',
    breakthroughsZh: [
      '跨平台開發者趨勢聚合：每日自動爬梳 Hacker News、GitHub Trending、Product Hunt、Dev.to 高價值技術討論',
      '端到端語音合成與混音管線：自動將結構化技術洞察轉化為自然口語廣播腳本，完成神經網路 TTS 合成與音訊標準化',
      '自建雲端音訊資產與動態 RSS 引擎：結合 888box 儲存叢集與標準 RSS 2.0 Enclosures，無縫同步各大 Podcast 平台與網頁直連播放',
    ],
    breakthroughsEn: [
      'Automated daily synthesis of Hacker News, GitHub Trending, Product Hunt, and Dev.to engineering discussions',
      'Autonomous script generation, neural TTS voice synthesis, and audio mastering tailored for natural Taiwanese Mandarin',
      'Self-hosted 888box media asset storage and dynamic RSS 2.0 distribution engine with instant web streaming',
    ],
    techStack: [
      'Neural TTS Pipeline',
      'HN / GitHub / PH Crawler',
      'Automated Audio Mastering',
      '888box Storage',
      'Dynamic RSS 2.0',
    ],
  },
  {
    id: 'qimen',
    domain: 'qi.david888.com',
    url: 'https://qi.david888.com/',
    icon: Compass,
    titleZh: '333 奇門遁甲 ｜ 高日活古曆法確定性演算法與 AI 決策生態系',
    titleEn: '333 Qi Men Dun Jia — High-DAU Deterministic Calendar & AI Decision Engine',
    subtitleZh:
      '將極度複雜的傳統奇門遁甲、生辰八字、梅花易數、風水與塔羅轉化為「零幻覺確定性排盤演算法 × 多輪結構化 AI 推理」，打造高回訪率、高留存的日常決策產品群。',
    subtitleEn:
      'High-retention consumer decision ecosystem combining a zero-hallucination astronomical calendar rule engine with multi-turn LLM reasoning across Qi Men, Bazi Life K-Line, and Feng Shui.',
    breakthroughsZh: [
      '確定性天文曆法規則引擎：精準計算二十四節氣交節、陰陽遁局、天干地支與八字大運排盤，徹底消除純 LLM 排盤算錯的幻覺痛點',
      '獨創「八字人生 K 線」與多維決策介面：將抽象命理運勢轉化為金融級 K 線波動視覺化，支援跨場景多輪追問與上下文記憶',
      '高自然流量與高用戶留存（High-DAU）：證明將高度複雜的傳統領域規則轉化為現代化 SaaS/B2C 產品的完整產品化操盤實力',
    ],
    breakthroughsEn: [
      'Deterministic astronomical & sexagenary rule engine guaranteeing 100% accurate chart calculation before LLM interpretation',
      'Pioneered Bazi Life K-Line candlestick visualization and context-aware multi-turn decision dialogues',
      'High organic DAU and user retention demonstrating end-to-end domain rule engineering and B2C productization',
    ],
    techStack: [
      'Deterministic Rule Engine',
      'Astronomical Calendar',
      'Bazi Life K-Line',
      'Multi-Turn LLM',
      'High-DAU Consumer Web',
    ],
    subLinks: [
      { labelZh: '八字人生 K 線', labelEn: 'Bazi Life K-Line', url: 'https://bazi.david888.com' },
      { labelZh: '生辰八字 2.0', labelEn: 'Bazi 2.0', url: 'https://qi.david888.com/bazi2' },
      { labelZh: '塔羅決策', labelEn: 'Tarot Reading', url: 'https://qi.david888.com/tarot' },
      { labelZh: '風水顧問', labelEn: 'Feng Shui Advisor', url: 'https://qi.david888.com/fengshui' },
      { labelZh: '月老姻緣', labelEn: 'Matchmaking', url: 'https://qi.david888.com/yinyuan' },
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
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section
      id="flagships"
      aria-label={isEn ? 'Flagship Production Systems' : '五大高難度主力艦系統'}
      className="scroll-mt-24 space-y-5"
    >
      <div className="dossier-card border-2 border-[#17324d] p-5 sm:p-7 dark:border-[#ffb010]/70">
        <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-text-main sm:text-3xl">
              {isEn
                ? '5 Live Flagship Systems — Chief Architect Hands-On Engineering Proof'
                : '五大高難度主力艦系統 ｜ 首席架構師親手落地的工程實證'}
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-text-muted">
              {isEn
                ? 'Unlike hands-off executives who only manage via slides, I personally architected and shipped every production system below on *.david888.com—spanning institutional quantitative finance engines, time-series forecasting pipelines, high-concurrency media ingestion, automated audio broadcasting, and high-DAU deterministic rule engines.'
                : '不同於只看簡報、脫離一線代碼的傳統高管，以下 5 套線上主力系統（*.david888.com）皆由我親手完成底層架構與全端交付——橫跨純 TS 機構量化估值引擎、時序預測資料管線、高併發媒體情報中心、自動化語音廣播基建與高日活確定性規則引擎。'}
            </p>
          </div>
          <div className="shrink-0 font-mono text-xs font-bold text-[#a9471d] dark:text-[#ffb010]">
            {isEn ? '5 LIVE PRODUCTION DOMAINS' : '5 大獨立網域線上實機運行'}
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
                        className="rounded-md border border-[#17324d]/30 bg-[#fff0cc] px-2.5 py-1 font-mono text-xs font-bold text-[#17324d] no-underline transition-colors hover:bg-[#ffb010] dark:border-[#ffb010]/40 dark:bg-[#17324d] dark:text-[#ffb010]"
                      >
                        {sys.domain}
                      </a>
                    </div>

                    <h3 className="mt-3 text-xl font-extrabold leading-snug text-text-main sm:text-2xl">
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

                  <div className="flex shrink-0 flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
                    <a
                      href={sys.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-saffron inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2.5 text-sm no-underline"
                    >
                      <span>{isEn ? 'Launch Live System' : '開啟線上實機系統'}</span>
                      <ArrowUpRight size={17} />
                    </a>

                    <div className="flex flex-wrap items-center gap-2">
                      {sys.docUrl && (
                        <a
                          href={sys.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#17324d] bg-bg-surface px-3 py-1.5 text-xs font-bold text-text-main no-underline transition-colors hover:bg-[#fff0cc] dark:border-[#ffb010]/60 dark:hover:bg-[#17324d]"
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
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-border bg-bg-surface px-3 py-1.5 font-mono text-xs font-bold text-text-main no-underline transition-colors hover:border-[#17324d] dark:hover:border-[#ffb010]"
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
                    {isEn ? 'Key Architectural & Engineering Breakthroughs:' : '核心技術難度與架構突破：'}
                  </div>
                  <ul className="m-0 list-none space-y-2 p-0">
                    {breakthroughs.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-main">
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-[#17324d] dark:text-[#ffb010]"
                        />
                        <span>{point}</span>
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
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-surface px-2.5 py-1 text-xs font-bold text-text-main no-underline transition-colors hover:border-[#17324d] hover:bg-[#fff0cc] dark:hover:border-[#ffb010] dark:hover:bg-[#17324d]"
                      >
                        <span>{isEn ? sub.labelEn : sub.labelZh}</span>
                        <ArrowUpRight size={12} />
                      </a>
                    ))}
                  </div>
                )}

                {/* Remote MCP Server Config if present */}
                {sys.mcpConfig && (
                  <div className="mt-4 rounded-xl border border-border bg-bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-[#17324d] bg-[#17324d] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[#fff9e8] dark:border-[#ffb010] dark:bg-[#ffb010] dark:text-[#2b251a]">
                          REMOTE MCP
                        </span>
                        <span className="text-xs font-extrabold text-text-main">
                          {isEn ? 'Agent 5-Tool Remote Endpoint' : 'Agent 5 工具遠端呼叫端點'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(`${sys.id}-endpoint`, sys.mcpConfig!.endpoint)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 py-1 font-mono text-xs font-bold text-text-main transition-colors hover:border-[#17324d] hover:bg-[#fff0cc] dark:hover:border-[#ffb010]"
                        >
                          {copiedKey === `${sys.id}-endpoint` ? <Check size={12} /> : <Copy size={12} />}
                          <span>
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
                          className="inline-flex items-center gap-1 rounded-md border border-[#17324d] bg-[#fff0cc] px-2.5 py-1 font-mono text-xs font-bold text-[#17324d] transition-colors hover:bg-[#ffb010] dark:border-[#ffb010]/60 dark:bg-[#17324d] dark:text-[#ffb010]"
                        >
                          {copiedKey === `${sys.id}-config` ? <Check size={12} /> : <Copy size={12} />}
                          <span>
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

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text-muted">URL:</span>
                      <code className="rounded-md border border-border bg-black/5 px-2.5 py-1 font-mono text-xs text-[#a9471d] dark:bg-black/40 dark:text-[#ffb010]">
                        {sys.mcpConfig.endpoint}
                      </code>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 text-[11px] font-bold text-text-muted">
                        {isEn
                          ? 'Universal MCP Configuration (Cursor / Claude Desktop / Antigravity):'
                          : '通用 MCP 組態（支援 Cursor、Claude Desktop、Antigravity 等各類 Agent 工具）：'}
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-black/5 p-3 font-mono text-xs leading-tight text-text-main dark:bg-black/40">
                        <code>{sys.mcpConfig.configSnippet}</code>
                      </pre>
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
