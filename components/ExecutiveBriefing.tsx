import React from 'react';
import { ArrowRight, Building2, CheckCircle2, ChevronRight, Cpu, Network, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { CardWrapper } from './cards/CardWrapper';
import type { Locale } from '../types';

interface ExecutiveBriefingProps {
  locale: Locale;
  onContact: () => void;
  onSwitchToCatalog: () => void;
}

export const ExecutiveBriefing: React.FC<ExecutiveBriefingProps> = ({
  locale,
  onContact,
  onSwitchToCatalog,
}) => {
  const isEn = locale === 'en';

  const flagshipCases = [
    {
      id: 'sap-ecommerce',
      badge: isEn ? 'Enterprise eCommerce & Scale' : '企業級電商與高併發架構',
      title: isEn
        ? 'Leading 70 Engineers: Global Health & Beauty Retail SAP eCommerce'
        : '率領 70 人研發團隊：全球最大健康美容連鎖 SAP eCommerce 平台',
      metrics: isEn
        ? [
            { label: 'Team Led', value: '70+ Eng' },
            { label: 'Architecture', value: 'Microservices' },
            { label: 'Reliability', value: '99.98%' },
          ]
        : [
            { label: '領導團隊', value: '70+ 位工程師' },
            { label: '架構標準', value: '微服務中台' },
            { label: '系統可用度', value: '99.98%' },
          ],
      challenge: isEn
        ? 'Legacy monolithic infrastructure suffered severe peak-hour latency and fragmented international inventory synchronization.'
        : '傳統單體系統在促銷大檔期間面臨嚴重的延遲與崩潰瓶頸，跨國會員與庫存資料亦高度破碎。',
      solution: isEn
        ? 'Architected modern SAP Commerce Cloud with headless PWA frontend, event-driven microservices, and unified multi-currency checkout.'
        : '帶隊重構 SAP Commerce Cloud 核心，導入 Headless PWA、事件驅動微服務中台與跨國多幣別高併發結帳管線。',
      tags: ['CTO Leadership', 'SAP eCommerce', '70-Person Team', 'High Concurrency', 'Microservices'],
      icon: Building2,
    },
    {
      id: 'crm-erp-integration',
      badge: isEn ? 'Cross-System Hub & Governance' : '跨系統營運治理與資料整合',
      title: isEn
        ? 'Fortune 500 Consumer Electronics: Omni-Channel Ops Automation'
        : '全球知名消費性電子品牌：多通路營運與 CRM/ERP 整合中樞',
      metrics: isEn
        ? [
            { label: 'Systems Synced', value: '5 Core Platforms' },
            { label: 'Ops Efficiency', value: '+42%' },
            { label: 'RMA Cycle', value: 'Days → Minutes' },
          ]
        : [
            { label: '串接系統', value: '5 大核心平台' },
            { label: '運營效率提升', value: '+42%' },
            { label: '退換貨流轉', value: '數天縮短至數分鐘' },
          ],
      challenge: isEn
        ? 'Support, sales, and RMA returns were siloed across legacy tools, causing multi-day customer ticket delays and inventory mismatches.'
        : '客服、業務與售後 RMA 退換貨流程四分五裂，跨部門人工傳遞造成數天的處理延遲與庫存對帳失誤。',
      solution: isEn
        ? 'Integrated Salesforce Service Cloud, HubSpot, RingCentral voice hub, and ERP inventory in real-time, eliminating operational data islands.'
        : '深度串接 Salesforce Service Cloud、HubSpot、RingCentral 語音中繼與 ERP 即時庫存中台，達成售後退換貨全自動化。',
      tags: ['CIO Governance', 'Salesforce', 'HubSpot', 'RingCentral', 'ERP Integration'],
      icon: Network,
    },
    {
      id: 'tech-due-diligence',
      badge: isEn ? 'Investment Risk Control' : '創投與董事會投資風控',
      title: isEn
        ? 'Independent Tech Due Diligence (VC / PE & Board Advisory)'
        : '創投機構與董事會專屬「技術盡職調查 (Tech Due Diligence)」',
      metrics: isEn
        ? [
            { label: 'Audits Completed', value: '100+ Projects' },
            { label: 'Risk Coverage', value: 'Code & Security' },
            { label: 'Perspective', value: 'Unbiased 3rd Party' },
          ]
        : [
            { label: '評估經驗', value: '數十家標的實戰' },
            { label: '審查範疇', value: '架構、代碼與資安' },
            { label: '立場', value: '客觀獨立第三方' },
          ],
      challenge: isEn
        ? 'Investors and boards often lack visibility into hidden technical debt, scalability ceilings, and IP licensing risks before major transactions.'
        : '投資人與董事會在融資或併購前，往往難以看透團隊提案後的隱形技術債、架構擴展極限與資安版權風險。',
      solution: isEn
        ? 'Conduct deep codebase audits, stress-test architectural scalability, evaluate team engineering throughput, and deliver clear risk matrices.'
        : '提供獨立第三方代碼品質審計、架構擴展極限壓力評估、技術債量化分析與研發團隊效能評估，排除數百萬美元的決策風險。',
      tags: ['Tech Due Diligence', 'Architecture Audit', 'Technical Debt', 'VC Advisory', 'Risk Control'],
      icon: ShieldCheck,
    },
    {
      id: 'institutional-quant',
      badge: isEn ? 'AI / ML & Financial Analytics' : 'AI / ML 與金融量化智能體',
      title: isEn
        ? '888 StockBot & Quant: Institutional Market Network & Analytics'
        : '888 StockBot & Quant：機構級金融智能體與上市公司關係圖譜',
      metrics: isEn
        ? [
            { label: 'Graph Model', value: 'TW Listed Networks' },
            { label: 'Decision Engine', value: 'Agentic LLM' },
            { label: 'Data Latency', value: 'Real-Time Pipeline' },
          ]
        : [
            { label: '網絡模型', value: '全市場關係圖譜' },
            { label: '決策引擎', value: '多智能體 Agent' },
            { label: '資料管線', value: '高頻即時清洗' },
          ],
      challenge: isEn
        ? 'Financial markets contain dense, unstructured corporate ownership and supply-chain linkages that traditional screeners fail to uncover.'
        : '上市櫃公司股權穿透、交叉持股與供應鏈網絡極其繁雜，傳統看盤軟體難以呈現隱蔽的關聯交易與籌碼異動。',
      solution: isEn
        ? 'Built interactive knowledge graphs of Taiwan listed corporate networks paired with autonomous LLM reasoning agents for quant insights.'
        : '自主研發台灣上市櫃企業股權與董監事網絡圖譜，串接多智能體（Agentic AI）即時清洗管線，提供機構級量化分析優勢。',
      tags: ['AI / ML', 'Quant Systems', 'Graph Database', 'Financial Agents', '888 StockBot'],
      icon: Cpu,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-bg-surface via-bg-surface to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-black tracking-wide text-primary">
            <Sparkles size={13} />
            <span>{isEn ? 'Executive Briefing & CTO Advisory' : '高階顧問簡報 ✕ CTO 旗艦實績'}</span>
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-text-main sm:text-3xl md:text-4xl">
            {isEn ? 'Transforming Technical Complexity Into Measurable Business Value' : '把複雜的技術債，轉化為看得見的商業價值'}
          </h2>

          <p className="mt-3 max-w-3xl text-base leading-relaxed text-text-muted md:text-lg">
            {isEn
              ? 'Veteran CTO & Technical Advisor with 10+ years leading cross-border engineering organizations. Specializing in high-concurrency enterprise eCommerce, CRM/ERP governance, tech due diligence for VCs, and production AI agent workflows.'
              : '具備跨國實戰經驗的資深 CTO 與技術顧問。過去十年親自帶隊重整複雜系統架構，為大型企業與投資人把關技術風險，讓技術投資真正轉化為核心商業動能。'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onContact}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white shadow-md transition-all hover:opacity-90 dark:text-bg-base"
            >
              <span>{isEn ? 'Schedule Advisory Consultation' : '預約技術顧問諮詢'}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={onSwitchToCatalog}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface px-5 py-3 text-sm font-bold text-text-muted transition-colors hover:border-primary hover:text-text-main"
            >
              <span>{isEn ? 'Explore All 71 Works & Lab' : '探索全部 71 項作品與實驗室'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Flagship Case Studies Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-text-main md:text-2xl">
              {isEn ? 'Flagship Architecture & Leadership Case Studies' : 'CTO / CIO 旗艦案例與架構治理'}
            </h3>
            <p className="text-sm font-semibold text-text-muted">
              {isEn
                ? 'High-impact enterprise transformations, scaled team leadership, and risk audits'
                : '經受真實商業檢驗的跨國大型架構、團隊管理與技術盡職調查實績'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {flagshipCases.map((item) => {
            const Icon = item.icon;

            return (
              <CardWrapper key={item.id} className="p-6 md:p-8">
                <div className="flex h-full flex-col">
                  {/* Top Badge & Icon */}
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                      {item.badge}
                    </span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-elevated text-primary shadow-xs">
                      <Icon size={20} />
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="mt-4 text-xl font-black leading-snug text-text-main">
                    {item.title}
                  </h4>

                  {/* Metrics Banner */}
                  <div className="my-5 grid grid-cols-3 gap-2 rounded-xl border border-border bg-bg-elevated/70 p-3 text-center">
                    {item.metrics.map((metric, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-sm font-black text-text-main md:text-base">{metric.value}</div>
                        <div className="text-[11px] font-semibold text-text-muted">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Problem & Solution Narrative */}
                  <div className="space-y-3 text-sm leading-relaxed text-text-muted">
                    <div>
                      <span className="font-black text-text-main">{isEn ? 'Context: ' : '業務挑戰：'}</span>
                      <span>{item.challenge}</span>
                    </div>
                    <div>
                      <span className="font-black text-text-main">{isEn ? 'Architecture Solution: ' : '架構方案：'}</span>
                      <span>{item.solution}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-auto pt-6 flex flex-wrap gap-1.5 border-t border-border">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-border bg-bg-surface px-2 py-0.5 text-[11px] font-bold text-text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>

      {/* Quick Advisory Consultation Card */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-border bg-bg-surface p-6 shadow-sm md:flex-row md:items-center md:p-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
            <CheckCircle2 size={15} />
            <span>{isEn ? 'Direct Advisory Access' : '專屬顧問進場機制'}</span>
          </div>
          <h4 className="text-xl font-black text-text-main">
            {isEn ? 'Need an independent technical audit or fractional CTO leadership?' : '系統遭遇效能瓶頸？需要客觀的技術盡職調查或顧問諮詢？'}
          </h4>
          <p className="text-sm font-semibold text-text-muted">
            {isEn
              ? 'Available for full-time executive leadership, board-level technical advisory, and interim CTO roles.'
              : '提供企業架構健檢、代碼審計、創投技術盡職調查與高階技術顧問合作。謝絕博弈與虛擬幣相關項目。'}
          </p>
        </div>
        <button
          type="button"
          onClick={onContact}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white shadow-md transition-all hover:opacity-90 dark:text-bg-base"
        >
          <span>{isEn ? 'Get in Touch' : '立即與 David 洽談'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
