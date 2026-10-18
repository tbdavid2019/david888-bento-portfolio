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
        ? '12-Month Technical Advisor (Annual Retainer)'
        : '一年期企業技術顧問約',
      target: isEn
        ? 'For Listed Companies, E-Commerce Retailers & Growing Teams'
        : '適合：上市櫃公司、零售電商、需要跨系統整合或擴編的企業',
      deliverables: isEn
        ? [
            'Regular architecture reviews, technical debt cleanup & cloud cost optimization',
            'Cross-system data integration across eCommerce, CRM (Salesforce/HubSpot), ERP & RMA workflows',
            'Hiring & leadership support: interviewing, evaluating, and mentoring engineering leads',
          ]
        : [
            '依約定頻率（每週或雙週）參與架構檢視、技術決策會議與雲端成本調整',
            '跨系統資料流串接：整合電商、CRM (Salesforce/HubSpot)、ERP 庫存與售後 RMA 退換貨流程',
            '技術人才招募與培育：協助面試、評估與培養技術主管 (VP / Director / Architect)',
          ],
    },
    {
      id: 'fulltime-cto',
      icon: Users,
      title: isEn
        ? 'Full-Time CTO / VP of Engineering'
        : '技術長 / 研發部門負責人 (CTO / VP of Engineering)',
      target: isEn
        ? 'For Multinational Corporations, Retail/E-Commerce Groups & Tech Companies'
        : '適合：跨國企業、上市櫃公司、零售電商與科技公司',
      deliverables: isEn
        ? [
            'Manage 100+ person cross-regional engineering, data, and product delivery teams',
            'E-commerce platform refactoring and global CRM/ERP system integration',
            'Participate directly in system architecture design, code reviews, and technical decisions',
          ]
        : [
            '管理 100+ 人跨區工程、資料與產品研發團隊，讓技術投入對齊商業目標',
            '負責大型電商平台改版、微服務架構升級與跨國 CRM/ERP 營運系統整合',
            '實際參與系統架構設計、程式碼審查與關鍵技術選型',
          ],
    },
    {
      id: 'tech-dd',
      icon: ShieldCheck,
      title: isEn
        ? 'Technical Due Diligence & System Diagnosis'
        : '技術盡職調查 (Tech DD) 與系統診斷',
      target: isEn
        ? 'For Investors, Venture Capital & Corporate M&A'
        : '適合：創投機構、投資人、企業併購評估與系統效能改善',
      deliverables: isEn
        ? [
            'Pre-investment codebase review, scalability assessment & security configuration check (approx. 1–2 weeks)',
            'Evaluate engineering team execution, technical debt, and realistic maintenance costs',
            'Full architecture audit & ablation diagnosis: untangle spaghetti information flows, multi-channel integrations (banking/promos/logistics), eliminate SPOF, and stop wasteful compute spend',
          ]
        : [
            '投資與併購前第三方評估：依標的資料完整度，約 1–2 週交付系統架構、程式碼品質與資安設定檢視報告（屬技術評估，非法律意見）',
            '團隊交付與維護成本評估：協助投資人釐清實際技術狀況、技術債與後續維護成本',
            '全面系統盤查與消融診斷：針對企業疊床架屋的毛線團資訊流、多方渠道串接（銀行/金流/優惠/物流）與單點故障 (SPOF) 風險進行全面盤查，以科學消融試驗揪出隱性浪費與真實瓶頸，落實開源節流',
          ],
    },
  ];

  const flagshipCases = [
    {
      id: 'sap-ecommerce',
      title: isEn
        ? 'Led 100+ Engineers: International Health & Beauty Retailer eCommerce Platform'
        : '帶領 100+ 人工程團隊：跨國健康與美容零售商大型電商平台',
      metrics: isEn
        ? [
            { label: 'Team Size', value: '100+ Engineers' },
            { label: 'Architecture', value: 'Microservices' },
            { label: 'Platform', value: 'SAP Commerce' },
          ]
        : [
            { label: '工程團隊', value: '100+ 位工程師' },
            { label: '系統架構', value: '微服務架構' },
            { label: '核心平台', value: 'SAP Commerce' },
          ],
      challenge: isEn
        ? 'Legacy monolithic systems experienced slowdowns during major sales and had separate inventory data across markets.'
        : '舊有單體式系統在促銷檔期容易發生延遲，且跨國會員、促銷規則與庫存資料分散在不同系統。',
      solution: isEn
        ? 'Refactored the platform onto SAP Commerce Cloud with headless PWA, event-driven microservices, and multi-currency checkout.'
        : '帶領團隊改版 SAP Commerce Cloud 電商平台，導入 Headless PWA、微服務架構與多幣別結帳流程。',
      tags: ['CTO Leadership', 'SAP Commerce Cloud', '100+ Engineers', 'E-Commerce'],
      icon: Building2,
    },
    {
      id: 'crm-erp-integration',
      title: isEn
        ? 'Consumer Electronics Brand: Multichannel CRM / ERP Integration'
        : '跨國消費性電子品牌：客服與 CRM / ERP 跨系統整合',
      metrics: isEn
        ? [
            { label: 'Systems Connected', value: '5 Systems' },
            { label: 'Key Platforms', value: 'SFDC · HubSpot' },
            { label: 'RMA Turnaround', value: 'Days → Minutes' },
          ]
        : [
            { label: '串接系統', value: '5 個跨部門系統' },
            { label: '核心平台', value: 'SFDC · HubSpot' },
            { label: 'RMA 退換貨流程', value: '數天縮短至數分鐘' },
          ],
      challenge: isEn
        ? 'Customer support, sales, and RMA returns were spread across separate tools, causing multi-day delays and inventory errors.'
        : '客服、業務與售後 RMA 退換貨分散在不同系統，人工跨部門傳遞造成數天延遲與庫存對帳誤差。',
      solution: isEn
        ? 'Connected Salesforce Service Cloud, HubSpot, RingCentral voice, and ERP inventory to automate RMA workflows.'
        : '串接 Salesforce Service Cloud、HubSpot、RingCentral 語音系統與 ERP 庫存，讓售後退換貨與客服流程自動同步。',
      tags: ['System Integration', 'Salesforce', 'HubSpot', 'RingCentral', 'ERP / RMA'],
      icon: Network,
    },
    {
      id: 'tech-due-diligence',
      title: isEn
        ? 'Technical Due Diligence for Investors & Companies'
        : '投資與併購前「技術盡職調查 (Tech Due Diligence)」',
      metrics: isEn
        ? [
            { label: 'Leadership Scale', value: '100+ Team Scale' },
            { label: 'Review Scope', value: 'Arch · Code · Sec' },
            { label: 'Turnaround', value: 'Within 2 Weeks' },
          ]
        : [
            { label: '團隊管理規模', value: '100+ 人研發團隊' },
            { label: '評估範圍', value: '架構 · 程式碼 · 資安' },
            { label: '交付時程', value: '2 週內出件' },
          ],
      challenge: isEn
        ? 'Investors and executives often cannot see technical debt, scaling bottlenecks, or team delivery issues from pitch decks alone.'
        : '投資人與經營層在投資、併購或大型專案前，不容易只靠簡報看出背後的技術債、擴充瓶頸與團隊交付狀況。',
      solution: isEn
        ? 'Conduct codebase reviews, architecture evaluations, and team capability assessments before investment decisions.'
        : '實際檢視程式碼品質、系統負載、技術債成本與工程團隊開發流程，提供架構、程式碼與資安三面向評估報告。',
      tags: ['Tech Due Diligence', 'Architecture Review', 'Investment Advisory', 'Risk Assessment'],
      icon: ShieldCheck,
    },
    {
      id: 'institutional-quant',
      title: isEn
        ? '888 StockBot & StockQuant: Equity Valuation & Corporate Network'
        : '888 StockBot & StockQuant：台美股估值分析與上市櫃關係網路',
      metrics: isEn
        ? [
            { label: 'Forecasting', value: 'TimesFM + LSTM' },
            { label: 'Valuation', value: 'DCF · SEPA · Options' },
            { label: 'Graph Model', value: 'TW Listed Network' },
          ]
        : [
            { label: '時間序列預測', value: 'TimesFM + LSTM' },
            { label: '估值試算', value: 'DCF · SEPA · 選擇權' },
            { label: '企業關係圖', value: '台灣上市櫃股權網' },
          ],
      challenge: isEn
        ? 'Combining fundamental valuation, time-series forecasting, institutional chip flows, and corporate ownership networks in one workspace.'
        : '整合基本面估值試算、時間序列預測、三大法人與券商分點籌碼，以及上市櫃公司交叉持股關係於同一工作台。',
      solution: isEn
        ? 'Built a quantitative analysis suite in TypeScript & Python with DCF/SEPA calculators, time-series models, and corporate ownership graphs.'
        : '以 TypeScript 與 Python 開發金融分析工具群：包含 DCF/SEPA 估值試算、時間序列預測模型與台灣企業法人持股關係圖。',
      tags: ['Quantitative Finance', 'TimesFM & Timestral', 'Data Pipeline', 'Knowledge Graph'],
      icon: Cpu,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: 3 Advisory & Executive Engagement Models */}
      <div className="dossier-card border-2 border-[#17324d] p-5 sm:p-7 dark:border-[#ffb010]/70">
        <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-text-main sm:text-3xl">
              {isEn
                ? 'CTO & Technical Advisory'
                : '合作方式：企業技術顧問 ＆ 技術管理'}
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-text-muted">
              {isEn
                ? 'Engagement options for companies, investors, and executive search partners—combining e-commerce architecture, cross-system integration, and 100+ person team management.'
                : '提供企業經營層、投資人與獵頭夥伴三種合作方式——結合大型電商架構、CRM/ERP 跨系統整合、100+ 人團隊管理與系統開發經驗。'}
            </p>
          </div>
          <button
            type="button"
            onClick={onContact}
            className="btn-saffron inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-sm md:w-auto"
          >
            <span>{isEn ? 'Discuss Advisory / CTO Role' : '預約顧問合作 / 職缺洽談'}</span>
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
                    <h3 className="min-w-0 break-words text-lg font-extrabold leading-snug text-text-main">
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
                        <span className="min-w-0 break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onContact}
                  className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg border border-[#17324d] bg-bg-surface px-3 py-2 text-xs font-extrabold text-text-main transition-colors hover:bg-[#17324d] hover:text-[#fff9e8] dark:border-[#ffb010]/60 dark:hover:bg-[#ffb010] dark:hover:text-[#2b251a]"
                >
                  <span>{isEn ? 'Inquire About This Option' : '洽詢此合作方式'}</span>
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
              ? 'Representative Enterprise Experience'
              : '跨國企業代表經歷與系統整合實績'}
          </h2>
          <p className="mt-1.5 text-sm font-semibold text-text-muted sm:text-base">
            {isEn
              ? 'Proven delivery across global retail e-commerce, Fortune 500 system integration, and technical due diligence'
              : '大型零售電商架構、跨國企業 CRM/ERP 整合、100+ 人團隊帶領與技術盡職調查'}
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
                  <h3 className="min-w-0 break-words text-lg font-extrabold leading-snug text-text-main sm:text-xl">
                    {item.title}
                  </h3>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#17324d]/30 bg-bg-surface text-[#17324d] dark:border-[#ffb010]/40 dark:text-[#ffb010]">
                    <Icon size={20} />
                  </div>
                </div>

                {/* Metrics Banner */}
                <div className="my-4 grid grid-cols-1 gap-2.5 rounded-lg border border-border bg-bg-surface p-3 text-left sm:grid-cols-3 sm:gap-2 sm:text-center">
                  {item.metrics.map((metric, idx) => (
                    <div key={idx} className="min-w-0 flex items-center justify-between gap-2 sm:block">
                      <div className="break-words font-mono text-xs font-extrabold tabular-nums text-text-main sm:text-sm">
                        {metric.value}
                      </div>
                      <div className="mt-0.5 break-words text-[11px] font-bold text-text-muted">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Problem & Solution Narrative */}
                <div className="space-y-2.5 text-sm leading-relaxed text-text-muted">
                  <div>
                    <span className="font-extrabold text-text-main">
                      {isEn ? 'Challenge: ' : '面臨挑戰：'}
                    </span>
                    <span>{item.challenge}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-text-main">
                      {isEn ? 'Solution & Outcome: ' : '解決方案與成果：'}
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

      {/* Section 3: The 5 Live Production Systems */}
      <FlagshipShowcase locale={locale} />

      {/* Bottom Direct Advisory Callout */}
      <div className="dossier-card flex flex-col items-start justify-between gap-4 border-2 border-[#17324d] p-5 sm:flex-row sm:items-center sm:p-7 dark:border-[#ffb010]">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-text-main">
            {isEn
              ? 'Looking for a Technical Advisor, CTO, or Independent Tech Due Diligence?'
              : '需要企業技術顧問、高階技術主管，或投資前技術盡職調查？'}
          </h3>
          <p className="text-sm font-semibold text-text-muted">
            {isEn
              ? 'Send an inquiry directly—your message goes straight to David with an instant tracking number.'
              : '歡迎直接填寫表單聯繫，訊息會直達 David 信箱並產生服務單號。'}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          <button
            type="button"
            onClick={onContact}
            className="btn-saffron inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-sm sm:w-auto"
          >
            <span>{isEn ? 'Get in Touch' : '立即聯繫洽談'}</span>
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onSwitchToCatalog}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#17324d] bg-bg-elevated px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:bg-[#fff0cc] sm:w-auto dark:border-[#ffb010]/60 dark:hover:bg-[#17324d]"
          >
            <span>{isEn ? 'Browse Full Work Directory' : '瀏覽全部作品與開源專案'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
