import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Network,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { FlagshipShowcase } from './FlagshipShowcase';
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

  const engagementPackages = [
    {
      id: 'annual-retainer',
      icon: Briefcase,
      title: isEn
        ? '12-Month Enterprise Technical Advisor (Annual Retainer / Fractional CTO)'
        : '一年期企業技術顧問約 (Annual Retainer / Fractional CTO)',
      target: isEn
        ? 'For Listed Corporations, Omni-Channel Retail & Scaling Ventures'
        : '適用：上市櫃企業、大型電商零售、跨系統整合與高成長公司',
      deliverables: isEn
        ? [
            'Monthly executive architecture governance, technical debt refactoring & cloud cost optimization',
            'Cross-system data flow unification across eCommerce, CRM (Salesforce/HubSpot), ERP & RMA hubs',
            'Executive hiring support: interviewing, vetting, and mentoring engineering directors & principal architects',
          ]
        : [
            '每月固定參與高層技術決策、核心架構把關、雲端成本優化與技術債清理路線圖',
            '跨系統資料流打通：重整大型電商、CRM (Salesforce/HubSpot)、ERP 庫存與售後 RMA 服務邊界',
            '高階人才把關：協助 CEO 與人資長面試、考核技術主管 (VP/Director/Architect) 並建立高效交付文化',
          ],
    },
    {
      id: 'fulltime-cto',
      icon: Users,
      title: isEn
        ? 'Full-Time Chief Technology Officer / VP of Engineering (NT$ 3M+ / Global Tier)'
        : '高階技術長正職 / 研發副總 (CTO / VP of Engineering · 目標年薪 NT$ 300萬+)',
      target: isEn
        ? 'For Multinational Enterprises, Global eCommerce Leaders & High-Growth Tech Groups'
        : '適用：跨國集團、大型零售電商、金融科技與高成長科技企業',
      deliverables: isEn
        ? [
            'End-to-end leadership of 50–300+ cross-border engineering, data, and product organizations',
            'High-concurrency eCommerce & commercial platform refactoring (99.98% SLA) and global CRM/ERP unification',
            'Hands-on Chief Architect CTO: sets boardroom technical ROI while personally governing core system design',
          ]
        : [
            '全面執掌 50–300+ 人跨國研發、數據與產品技術組織，對齊董事會商業目標與技術投資報酬率 (ROI)',
            '主導跨國高併發電商平台重構（99.98% 可用度）、多品牌微服務中台與全球 CRM/ERP 營運整合',
            '稀缺「能管百人軍團、亦能親手寫底層架構」的實戰派 CTO，徹底終結外行領導內行的管理內耗',
          ],
    },
    {
      id: 'tech-dd',
      icon: ShieldCheck,
      title: isEn
        ? 'VC / PE Technical Due Diligence & High-Stakes Architecture Rescue'
        : '創投 / 董事會技術盡職調查 (Tech DD) 與系統危機救援',
      target: isEn
        ? 'For Venture Capital, Private Equity, Family Offices & Board M&A'
        : '適用：創投機構、私募基金、家族辦公室併購審計與高併發系統急救',
      deliverables: isEn
        ? [
            'Pre-investment codebase audit, scalability stress-testing, cybersecurity & IP compliance review',
            'Engineering organization & technical moat verification: exposing hidden tech debt and delivery bottlenecks',
            'Emergency architecture rescue for eCommerce or enterprise systems suffering peak-hour outages or data locks',
          ]
        : [
            '投資與併購前獨立第三方審查：深入檢視原始碼品質、架構擴展極限、資安漏洞與合規風險',
            '團隊戰力與技術護城河鑑定：協助投資人看穿標的企業之真實交付能力、隱形技術債與後續重構成本',
            '關鍵系統危機救援：針對電商大促銷崩潰、資料庫鎖死或跨系統資料失準提供極速診斷與重構方案',
          ],
    },
  ];

  const flagshipCases = [
    {
      id: 'sap-ecommerce',
      title: isEn
        ? 'Led 70+ Engineers: Global #1 Health & Beauty Retail SAP eCommerce Platform'
        : '率領 70+ 人研發軍團：全球最大健康美容零售集團 SAP eCommerce 平台',
      metrics: isEn
        ? [
            { label: 'Engineering Team', value: '70+ Eng' },
            { label: 'Architecture', value: 'Microservices' },
            { label: 'SLA Uptime', value: '99.98%' },
          ]
        : [
            { label: '直接領導研發', value: '70+ 位工程師' },
            { label: '核心架構', value: '微服務中台' },
            { label: '系統可用度', value: '99.98%' },
          ],
      challenge: isEn
        ? 'Legacy monolithic infrastructure suffered severe peak-hour latency and fragmented international inventory synchronization.'
        : '傳統單體系統在跨國促銷大檔期間面臨嚴重延遲與崩潰瓶頸，跨區會員、促銷規則與庫存資料高度破碎。',
      solution: isEn
        ? 'Architected modern SAP Commerce Cloud with headless PWA frontend, event-driven microservices, and unified multi-currency checkout.'
        : '帶隊重構 SAP Commerce Cloud 核心，導入 Headless PWA、事件驅動微服務中台與跨國多幣別高併發結帳管線。',
      tags: ['CTO Leadership', 'SAP Commerce Cloud', '70-Person Engineering Team', 'High Concurrency'],
      icon: Building2,
    },
    {
      id: 'crm-erp-integration',
      title: isEn
        ? 'Fortune 500 Consumer Electronics: Global Omni-Channel CRM / ERP Hub'
        : 'Fortune 500 全球消費性電子品牌：多通路營運與 CRM / ERP 整合中樞',
      metrics: isEn
        ? [
            { label: 'Systems Unified', value: '5 Core Platforms' },
            { label: 'Ops Efficiency', value: '+42%' },
            { label: 'RMA Turnaround', value: 'Days → Minutes' },
          ]
        : [
            { label: '串接核心系統', value: '5 大跨國平台' },
            { label: '營運效率提升', value: '+42%' },
            { label: 'RMA 退換貨流轉', value: '數天縮短至數分鐘' },
          ],
      challenge: isEn
        ? 'Support, sales, and RMA returns were siloed across legacy tools, causing multi-day customer ticket delays and inventory mismatches.'
        : '跨國客服、業務與售後 RMA 退換貨流程分散於不同舊系統，人工跨部門傳遞造成數天延遲與庫存對帳失誤。',
      solution: isEn
        ? 'Integrated Salesforce Service Cloud, HubSpot, RingCentral voice hub, and ERP inventory in real-time, eliminating operational data islands.'
        : '深度串接 Salesforce Service Cloud、HubSpot、RingCentral 語音中繼與全球 ERP 即時庫存中台，實現售後退換貨全自動化。',
      tags: ['CIO Governance', 'Salesforce', 'HubSpot', 'RingCentral', 'Global ERP'],
      icon: Network,
    },
    {
      id: 'tech-due-diligence',
      title: isEn
        ? 'Independent Tech Due Diligence for Venture Capital, PE & Corporate Boards'
        : '創投機構與企業董事會專屬「獨立技術盡職調查 (Tech Due Diligence)」',
      metrics: isEn
        ? [
            { label: 'Max Org Experience', value: '300+ Staff' },
            { label: 'Audit Scope', value: 'Arch · Code · Sec' },
            { label: 'Position', value: 'Unbiased 3rd Party' },
          ]
        : [
            { label: '最高組織歷練', value: '300+ 人規模' },
            { label: '審查維度', value: '架構 · 代碼 · 資安' },
            { label: '獨立立場', value: '客觀第三方報告' },
          ],
      challenge: isEn
        ? 'Investors and boards often lack visibility into hidden technical debt, scalability ceilings, and engineering execution bottlenecks before major transactions.'
        : '投資人與董事會在融資、併購或大型轉型前，難以看透簡報背後的隱形技術債、架構擴展極限與團隊交付瓶頸。',
      solution: isEn
        ? 'Conduct deep codebase audits, stress-test architectural scalability, evaluate engineering team velocity, and deliver clear executive risk matrices.'
        : '提供深度原始碼審計、高併發壓力評估、技術債量化分析與研發團隊產出評估，為董事會排除數千萬投資決策風險。',
      tags: ['Tech Due Diligence', 'Architecture Audit', 'VC / PE Advisory', 'Risk Control'],
      icon: ShieldCheck,
    },
    {
      id: 'institutional-quant',
      title: isEn
        ? '888 StockBot & StockQuant: Institutional Quantitative Engine & Corporate Graph'
        : '888 StockBot & StockQuant：機構級量化估值引擎與上市櫃股權圖譜',
      metrics: isEn
        ? [
            { label: 'Forecasting', value: 'TimesFM + LSTM' },
            { label: 'Quant Engine', value: 'DCF · SEPA · Options' },
            { label: 'Graph Model', value: 'TW Listed Network' },
          ]
        : [
            { label: '時序預測管線', value: 'TimesFM + LSTM' },
            { label: '原生量化引擎', value: 'DCF · SEPA · 期權' },
            { label: '企業關係圖譜', value: '台灣上市櫃股權網' },
          ],
      challenge: isEn
        ? 'Retail and legacy financial tools fail to combine institutional valuation models, time-series forecasting pipelines, and corporate ownership graphs.'
        : '傳統看盤軟體無法同時貫通「華爾街級基本面估值、時序預測模型、三大法人與券商分點籌碼、以及公司交叉持股網路」。',
      solution: isEn
        ? 'Architected a full-stack quantitative suite combining native TS valuation engines, dual time-series models, and force-directed corporate graphs.'
        : '獨立研發完整量化金融系統群：涵蓋純 TS 估值引擎、雙時序預測管線與台灣企業法人投資關係知識圖譜。',
      tags: ['Quantitative Finance', 'TimesFM & Timestral', 'High-Throughput Data', 'Knowledge Graph'],
      icon: Cpu,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: 3 High-Ticket Advisory & Executive Mandates */}
      <div className="dossier-card border-2 border-[#17324d] p-5 sm:p-7 dark:border-[#ffb010]/70">
        <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-text-main sm:text-3xl">
              {isEn
                ? 'Executive CTO Mandates & 12-Month Advisory Retainers'
                : '高階技術長聘任 (CTO) ＆ 一年期企業技術顧問方案'}
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-text-muted">
              {isEn
                ? 'Direct engagement structures designed for CEOs, Boards, and Executive Search Partners seeking proven global eCommerce architecture, cross-system CRM/ERP governance, and 70–300+ engineering org leadership.'
                : '專為企業決策層、上市櫃董事會與高階獵頭設計的合作架構——結合「跨國大型電商 (SAP eCommerce) 與 CRM/ERP 整合實績」、「70–300+ 人研發團隊治理」與「第一線底層架構實戰力」。'}
            </p>
          </div>
          <button
            type="button"
            onClick={onContact}
            className="btn-saffron inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-sm"
          >
            <span>{isEn ? 'Request Retainer / CTO Discussion' : '預約顧問合約 / CTO 職缺洽談'}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {engagementPackages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <div
                key={pkg.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-bg-elevated p-5 transition-colors hover:border-[#17324d] dark:hover:border-[#ffb010]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2b251a] bg-[#ffb010] text-[#2b251a]">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <h3 className="text-lg font-extrabold leading-snug text-text-main">
                      {pkg.title}
                    </h3>
                  </div>

                  <p className="mt-3 rounded-lg border border-border/80 bg-bg-surface px-3 py-2 text-xs font-bold text-[#a9471d] dark:text-[#ffb010]">
                    {pkg.target}
                  </p>

                  <ul className="mt-4 m-0 list-none space-y-2.5 p-0">
                    {pkg.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-text-main">
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-[#17324d] dark:text-[#ffb010]"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onContact}
                  className="mt-5 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg border border-[#17324d] bg-bg-surface px-3 py-2 text-xs font-extrabold text-text-main transition-colors hover:bg-[#17324d] hover:text-[#fff9e8] dark:border-[#ffb010]/60 dark:hover:bg-[#ffb010] dark:hover:text-[#2b251a]"
                >
                  <span>{isEn ? 'Inquire About This Mandate' : '洽詢此合作方案'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Enterprise Leadership Case Studies */}
      <div className="dossier-card p-5 sm:p-7">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-text-main sm:text-3xl">
            {isEn
              ? 'Enterprise Architecture & Organization Leadership Track Record'
              : '跨國集團 CTO / CIO 代表戰役與架構治理實績'}
          </h2>
          <p className="mt-1.5 text-sm font-semibold text-text-muted sm:text-base">
            {isEn
              ? 'Battle-tested transformations across global retail eCommerce, Fortune 500 operations, and institutional due diligence'
              : '經受真實商業與高併發檢驗的跨國大型架構、70–300+ 人團隊管理與技術盡職調查實績'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {flagshipCases.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="flex h-full flex-col rounded-xl border border-border bg-bg-elevated p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-extrabold leading-snug text-text-main sm:text-xl">
                    {item.title}
                  </h3>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#17324d]/30 bg-bg-surface text-[#17324d] dark:border-[#ffb010]/40 dark:text-[#ffb010]">
                    <Icon size={20} />
                  </div>
                </div>

                {/* Metrics Banner */}
                <div className="my-4 grid grid-cols-3 gap-2 rounded-lg border border-border bg-bg-surface p-3 text-center">
                  {item.metrics.map((metric, idx) => (
                    <div key={idx}>
                      <div className="font-mono text-sm font-extrabold tabular-nums text-text-main sm:text-base">
                        {metric.value}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-text-muted">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Problem & Solution Narrative */}
                <div className="space-y-2.5 text-sm leading-relaxed text-text-muted">
                  <div>
                    <span className="font-extrabold text-text-main">
                      {isEn ? 'Business Challenge: ' : '業務與技術挑戰：'}
                    </span>
                    <span>{item.challenge}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-text-main">
                      {isEn ? 'Architectural Execution: ' : '架構治理與交付成果：'}
                    </span>
                    <span>{item.solution}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-auto flex flex-wrap gap-1.5 border-t border-border pt-4 mt-4">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-border bg-bg-surface px-2 py-0.5 font-mono text-[11px] font-bold text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: The 5 Flagship Production Systems */}
      <FlagshipShowcase locale={locale} />

      {/* Bottom Direct Advisory Callout */}
      <div className="dossier-card flex flex-col items-start justify-between gap-4 border-2 border-[#17324d] p-5 sm:flex-row sm:items-center sm:p-7 dark:border-[#ffb010]">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-text-main">
            {isEn
              ? 'Ready to discuss an Annual Advisory Retainer, CTO Mandate, or Tech Audit?'
              : '尋求一年期企業技術顧問、高階 CTO 掌舵人，或獨立技術盡職調查？'}
          </h3>
          <p className="text-sm font-semibold text-text-muted">
            {isEn
              ? 'Direct response via verified service ticket. Strictly no gambling or illicit crypto projects.'
              : '透過專屬諮詢單直達 David 本人信箱並即時核發追蹤單號。謝絕博弈與非法資金盤項目。'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onContact}
            className="btn-saffron inline-flex min-h-[44px] shrink-0 items-center gap-2 px-5 py-2.5 text-sm"
          >
            <span>{isEn ? 'Start Advisory Conversation' : '立即與 David 預約洽談'}</span>
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onSwitchToCatalog}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#17324d] bg-bg-elevated px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:bg-[#fff0cc] dark:border-[#ffb010]/60 dark:hover:bg-[#17324d]"
          >
            <span>{isEn ? 'Browse Full Work Directory' : '瀏覽完整作品與開源目錄'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
