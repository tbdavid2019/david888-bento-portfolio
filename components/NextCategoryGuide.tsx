import React from 'react';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Cpu,
  Layers,
  LineChart,
  Radio,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import {
  CATEGORY_SEQUENCE,
  CategorySequenceId,
  normalizeCategoryForSequence,
} from '../lib/useSwipeCategory';
import type { Locale } from '../types';

interface NextCategoryGuideProps {
  currentCategoryId: string;
  locale: Locale;
  onSelectCategory: (categoryId: string) => void;
  onContact?: () => void;
}

interface GuideMetadata {
  id: CategorySequenceId;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  actionText: string;
  actionTextEn: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CATEGORY_GUIDES: Record<CategorySequenceId, GuideMetadata> = {
  social: {
    id: 'social',
    title: '最新內容與動態',
    titleEn: 'Latest Updates & Broadcasts',
    summary: '自動更新科技播客、Blog 深入分析與 GitHub 每日活動。',
    summaryEn: 'Auto-updated podcast feeds, architecture blogs, and GitHub commits.',
    actionText: '前往最新動態',
    actionTextEn: 'Go to Latest',
    icon: Radio,
  },
  executive: {
    id: 'executive',
    title: '合作方式與高階技術顧問完整實績',
    titleEn: 'Ways to Work & Executive Dossier',
    summary: '了解技術長 5 大承諾、年度企業技術顧問與系統盡職調查方案。',
    summaryEn: 'Review a CTO’s 5 commitments, annual retainer model, and tech due diligence.',
    actionText: '前往合作方式',
    actionTextEn: 'Explore Ways to Work',
    icon: Briefcase,
  },
  finance: {
    id: 'finance',
    title: '財經命理系統與量化平台',
    titleEn: 'Finance, Quant & Metaphysics Systems',
    summary: '888 Stock Quant 時序預測、台美股估值機器人與人生 K 線圖。',
    summaryEn: '888 Stock Quant timeseries forecasting, equity valuation bots, and life candlestick visualization.',
    actionText: '前往財經命理',
    actionTextEn: 'Explore Finance & Qi',
    icon: LineChart,
  },
  'agent-skills': {
    id: 'agent-skills',
    title: 'AI Agent Skills 與遠端 MCP 工具',
    titleEn: 'Skills & MCP Tools for LLMs & AI Agents',
    summary: '開源 AI Agent 技能、遠端 MCP 工具與自動化代理實戰。',
    summaryEn: 'Battle-tested agent skills, remote MCP endpoints, and edge orchestration.',
    actionText: '前往 Agent Skills',
    actionTextEn: 'Explore Skills',
    icon: Cpu,
  },
  products: {
    id: 'products',
    title: '其他應用、生活工具與視覺實驗',
    titleEn: 'Productivity Apps, Tools & Visuals',
    summary: '小濃縮網頁 AI 摘要、生活工具、瀏覽器套件與 3D 視覺實驗。',
    summaryEn: 'Quick summary browser extensions, productivity tools, and 3D WebXR experiments.',
    actionText: '前往其他應用',
    actionTextEn: 'Explore Other Apps',
    icon: Layers,
  },
};

export const NextCategoryGuide: React.FC<NextCategoryGuideProps> = ({
  currentCategoryId,
  locale,
  onSelectCategory,
  onContact,
}) => {
  const isEn = locale === 'en';
  const currentNormalized = normalizeCategoryForSequence(currentCategoryId);
  const currentIndex = CATEGORY_SEQUENCE.indexOf(currentNormalized);
  const isLastCategory = currentIndex === CATEGORY_SEQUENCE.length - 1;

  if (isLastCategory) {
    return (
      <aside
        aria-label={isEn ? 'Portfolio exploration completed' : '專案總覽探索完畢'}
        className="dossier-card mt-8 flex flex-col justify-between gap-5 border-2 border-[#17324d] p-6 transition-all sm:p-7 md:flex-row md:items-center dark:border-[#ffb010]/60"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={26} />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>{isEn ? 'All 5 Categories Explored' : '已探索完 5 大專題分類'}</span>
            </div>
            <h3 className="text-xl font-extrabold text-text-main sm:text-2xl">
              {isEn ? 'Need Technical Leadership or System Due Diligence?' : '面臨系統重構、技術債或需要顧問協助？'}
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              {isEn
                ? 'Send an inquiry directly or initiate a confidential advisory conversation. Messages reach David directly.'
                : '百人團隊帶得動，複雜系統搞得定。歡迎直接聯繫洽談，訊息會直達 David 信箱並開立追蹤序號。'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {onContact && (
            <button
              type="button"
              onClick={onContact}
              className="btn-saffron inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold no-underline"
            >
              <span>{isEn ? 'Get in Touch' : '立即聯繫洽談'}</span>
              <ArrowRight size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelectCategory('social')}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#17324d] bg-bg-elevated px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:bg-[#fff0cc] dark:border-[#ffb010]/50 dark:hover:bg-[#17324d]"
          >
            <RotateCcw size={15} />
            <span>{isEn ? 'Back to Latest' : '回到最新動態'}</span>
          </button>
        </div>
      </aside>
    );
  }

  const nextCategoryKey = CATEGORY_SEQUENCE[currentIndex + 1];
  const nextGuide = CATEGORY_GUIDES[nextCategoryKey];
  const NextIcon = nextGuide.icon;

  return (
    <aside
      aria-label={isEn ? `Next section: ${nextGuide.titleEn}` : `下一章節：${nextGuide.title}`}
      className="dossier-card mt-8 overflow-hidden border-2 border-[#17324d] p-6 transition-all hover:border-[#ffb010] sm:p-7 dark:border-[#ffb010]/50 dark:hover:border-[#ffb010]"
    >
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffb010]/20 text-[#2b251a] dark:bg-[#ffb010]/15 dark:text-[#ffb010]">
            <NextIcon size={24} />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#a9471d] dark:text-[#ffb010]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#ffb010] animate-pulse" />
              <span>{isEn ? 'Next Chapter · Continue Reading' : '下一章節 · 接續探索'}</span>
            </div>
            <h3 className="text-xl font-extrabold text-text-main sm:text-2xl">
              {isEn ? nextGuide.titleEn : nextGuide.title}
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              {isEn ? nextGuide.summaryEn : nextGuide.summary}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => onSelectCategory(nextGuide.id)}
            className="btn-saffron inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold no-underline md:w-auto"
          >
            <span>{isEn ? nextGuide.actionTextEn : nextGuide.actionText}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Swipe Hint Micro-badge */}
      <div className="mt-4 flex items-center gap-2 border-t border-[#17324d]/15 pt-3.5 text-xs font-semibold text-text-muted dark:border-[#ffb010]/20 md:hidden">
        <Smartphone size={14} className="shrink-0 text-[#a9471d] dark:text-[#ffb010]" />
        <span>
          {isEn
            ? 'Tip: Swipe left anytime to advance to the next category'
            : '提示：在手機上亦可向左滑動隨時切換至下一分類'}
        </span>
      </div>
    </aside>
  );
};
