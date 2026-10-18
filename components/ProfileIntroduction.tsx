import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Link2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { profileContent } from '../data/profile-content';
import { cn } from '../lib/utils';
import type { Locale } from '../types';

interface ProfileIntroductionProps {
  locale: Locale;
  activeCategoryId?: string;
}

/**
 * Big Eye-Catching Executive Seal Logo (5 大承諾官方品質信賴標章)
 */
const ExecutiveCommitmentSeal: React.FC<{ locale: Locale }> = ({ locale }) => {
  return (
    <div className="relative flex shrink-0 items-center justify-center">
      {/* Ambient Pulsing Aura */}
      <div
        className="absolute inset-0 rounded-full bg-[#f59e0b]/30 blur-lg transition-all duration-500 group-hover:bg-[#f59e0b]/55 group-hover:blur-xl dark:bg-[#ffb010]/30 dark:group-hover:bg-[#ffb010]/55"
        aria-hidden="true"
      />

      {/* High-Impact Certified Shield & Medallion SVG */}
      <svg
        viewBox="0 0 120 120"
        className="relative h-20 w-20 sm:h-24 sm:w-24 drop-shadow-[0_4px_12px_rgba(245,158,11,0.38)] transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={locale === 'en' ? '5 Executive Commitments Seal' : '5 大安心承諾信賴標章'}
      >
        <defs>
          <linearGradient id="sealGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF5B8" />
            <stop offset="25%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id="sealNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A5F" />
            <stop offset="60%" stopColor="#102337" />
            <stop offset="100%" stopColor="#08131E" />
          </linearGradient>
          <linearGradient id="sealNumberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FEF3C7" />
            <stop offset="70%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <filter id="sealShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </filter>
          <filter id="numberGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.65" />
          </filter>
        </defs>

        {/* Outer Gold Rosette & Rim */}
        <circle cx="60" cy="60" r="56" fill="url(#sealGoldGrad)" />
        <circle cx="60" cy="60" r="51.5" fill="#78350F" />
        <circle cx="60" cy="60" r="49" fill="url(#sealGoldGrad)" />

        {/* Core Deep Navy Medallion */}
        <circle cx="60" cy="60" r="45" fill="url(#sealNavyGrad)" />

        {/* Dotted Inner Gold Ring */}
        <circle
          cx="60"
          cy="60"
          r="41"
          stroke="#FDE68A"
          strokeWidth="1.2"
          strokeDasharray="2.5 3"
          opacity="0.8"
        />

        {/* Top 5 Golden Stars (Arc) */}
        <polygon
          points="60.0,14.5 61.2,17.4 64.3,17.6 61.9,19.6 62.6,22.6 60.0,21.0 57.4,22.6 58.1,19.6 55.7,17.6 58.8,17.4"
          fill="#FDE047"
          filter="url(#sealShadow)"
        />
        <polygon
          points="48.0,18.0 49.1,20.5 51.8,20.8 49.7,22.6 50.4,25.2 48.0,23.8 45.6,25.2 46.3,22.6 44.2,20.8 46.9,20.5"
          fill="#FDE047"
          filter="url(#sealShadow)"
        />
        <polygon
          points="72.0,18.0 73.1,20.5 75.8,20.8 73.7,22.6 74.4,25.2 72.0,23.8 69.6,25.2 70.3,22.6 68.2,20.8 70.9,20.5"
          fill="#FDE047"
          filter="url(#sealShadow)"
        />
        <polygon
          points="37.0,24.5 37.9,26.7 40.3,26.9 38.5,28.5 39.1,30.8 37.0,29.6 34.9,30.8 35.5,28.5 33.7,26.9 36.1,26.7"
          fill="#FBBF24"
          filter="url(#sealShadow)"
        />
        <polygon
          points="83.0,24.5 83.9,26.7 86.3,26.9 84.5,28.5 85.1,30.8 83.0,29.6 80.9,30.8 81.5,28.5 79.7,26.9 82.1,26.7"
          fill="#FBBF24"
          filter="url(#sealShadow)"
        />

        {/* Big Stylized "5" Centerpiece */}
        <text
          x="60"
          y="66"
          textAnchor="middle"
          fontSize="44"
          fontWeight="950"
          fontFamily="'Arial Black', -apple-system, sans-serif"
          fill="url(#sealNumberGrad)"
          filter="url(#numberGlow)"
        >
          5
        </text>

        {/* Lower Banner Ribbon with Fishtail Ends */}
        <path
          d="M 12 72 L 108 72 L 102 84 L 108 96 L 12 96 L 18 84 Z"
          fill="#78350F"
          filter="url(#sealShadow)"
        />
        <path
          d="M 14 73.5 L 106 73.5 L 100 84 L 106 94.5 L 14 94.5 L 20 84 Z"
          fill="url(#sealGoldGrad)"
        />
        <text
          x="60"
          y="87.5"
          textAnchor="middle"
          fontSize={locale === 'en' ? '9.5' : '11.5'}
          fontWeight="950"
          fontFamily="-apple-system, BlinkMacSystemFont, 'PingFang TC', 'Microsoft JhengHei', sans-serif"
          fill="#0B1A29"
          letterSpacing={locale === 'en' ? '0.8' : '2'}
        >
          {locale === 'en' ? 'PROMISES' : '安心承諾'}
        </text>
      </svg>
    </div>
  );
};

export const ProfileIntroduction: React.FC<ProfileIntroductionProps> = ({
  locale,
  activeCategoryId,
}) => {
  const content = profileContent[locale];

  const checkIsDirectCommitments = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      activeCategoryId === 'commitments' ||
      activeCategoryId === 'promises' ||
      path === 'commitments' ||
      path === 'promises' ||
      hash === '#commitments' ||
      hash === '#promises'
    );
  };

  const [expanded, setExpanded] = useState<boolean>(checkIsDirectCommitments);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const handleUrlOrCategoryCheck = () => {
      const isMatch =
        activeCategoryId === 'commitments' ||
        activeCategoryId === 'promises' ||
        (typeof window !== 'undefined' &&
          (window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase() === 'commitments' ||
            window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase() === 'promises' ||
            window.location.hash.toLowerCase() === '#commitments' ||
            window.location.hash.toLowerCase() === '#promises'));

      if (isMatch) {
        setExpanded(true);
        const timer = setTimeout(() => {
          const el = document.getElementById('commitments');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    };

    handleUrlOrCategoryCheck();
    window.addEventListener('popstate', handleUrlOrCategoryCheck);
    window.addEventListener('hashchange', handleUrlOrCategoryCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlOrCategoryCheck);
      window.removeEventListener('hashchange', handleUrlOrCategoryCheck);
    };
  }, [activeCategoryId]);

  const handleCopyLink = async () => {
    const origin =
      typeof window !== 'undefined' && window.location.hostname === 'david888.com'
        ? window.location.origin
        : 'https://david888.com';
    const directUrl = `${origin}/commitments`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(directUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = directUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      if (typeof window !== 'undefined' && window.history?.pushState) {
        const canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
          canonicalLink.setAttribute('href', directUrl);
        }
        window.history.pushState(null, '', '/commitments');
      }
    } catch (err) {
      console.error('Failed to copy direct link:', err);
    }
  };

  return (
    <article
      className="mt-6 border-t border-border pt-5"
      aria-label={locale === 'en' ? 'Professional introduction' : '專業介紹'}
    >
      {/* Executive Sub-headline */}
      <p className="m-0 text-base font-bold leading-relaxed text-text-main sm:text-lg [text-wrap:pretty]">
        {content.subHeadline}
      </p>

      {/* Primary Track Record Summary */}
      {content.body[0] && (
        <p className="mt-3 text-[15px] leading-relaxed text-text-muted sm:text-base [text-wrap:pretty]">
          {content.body[0].text}
        </p>
      )}

      {/* Eye-Catching Centerpiece: 給不諳技術老闆的 5 大安心承諾 (Big Logo, Direct Route & 1-Click Share) */}
      <section id="commitments" className="mt-5 scroll-mt-24">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded((prev) => !prev);
            }
          }}
          className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-[#f59e0b] bg-gradient-to-br from-[#fff9eb] via-[#fffdfa] to-[#ffedd5] p-4 sm:p-5 text-left shadow-[0_8px_24px_rgba(245,158,11,0.22)] transition-all duration-300 hover:border-[#d97706] hover:shadow-[0_12px_32px_rgba(245,158,11,0.32)] hover:-translate-y-0.5 active:translate-y-0 dark:border-[#ffb010] dark:bg-gradient-to-br dark:from-[#132a42] dark:via-[#17324d] dark:to-[#0f2338] dark:shadow-[0_8px_24px_rgba(255,176,16,0.2)]"
          aria-expanded={expanded}
          aria-controls="commitments-details"
        >
          {/* Decorative Corner Glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#f59e0b]/15 blur-2xl dark:bg-[#ffb010]/15" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            {/* 1. Big Eye-Catching Logo Seal */}
            <ExecutiveCommitmentSeal locale={locale} />

            {/* 2. Main Title, Hook, & Feature Badges */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a9471d] px-2.5 py-0.5 text-xs font-black text-white shadow-sm dark:bg-[#ffb010] dark:text-[#0b1a29]">
                  <Sparkles size={12} className="shrink-0" />
                  <span>
                    {locale === 'en'
                      ? 'FOR EXECUTIVES & FOUNDERS · ZERO JARGON'
                      : '老闆與主管必看 · 零技術黑話'}
                  </span>
                </span>
                <span className="text-xs font-bold text-[#8a6b10] dark:text-[#fcd34d]">
                  {locale === 'en' ? 'CTO Decision Commitments' : '直球對齊經營層 5 大核心命題'}
                </span>
                <span className="rounded-md border border-[#17324d]/20 bg-[#17324d]/10 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#17324d] dark:border-[#ffb010]/30 dark:bg-[#ffb010]/15 dark:text-[#fcd34d]">
                  /commitments
                </span>
              </div>

              <h3 className="mt-1.5 text-lg font-black tracking-tight text-[#17324d] sm:text-2xl dark:text-[#fff9e8]">
                {locale === 'en'
                  ? '5 Executive Decision Commitments of a Top CTO'
                  : '頂級技術長（CTO）的「5 大決策承諾」'}
              </h3>

              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#5c4a30] sm:text-sm dark:text-[#d3e3f5]">
                {locale === 'en'
                  ? 'Strategic judgment, organizational leadership, business ROI, risk ownership, and grounded delivery. Click to reveal the 5 CTO Decision Commitments ➔'
                  : '戰略判斷、商業回報、組織領導、風險承擔與執行落地。點擊立即解鎖 5 大決策承諾 ➔'}
              </p>

              {/* 5 Quick Feature Chips */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-extrabold sm:text-xs">
                <span className="rounded-md border border-[#f59e0b]/40 bg-[#fffdfa]/95 px-2 py-0.5 text-[#854d0e] dark:border-[#ffb010]/30 dark:bg-[#0b1a29]/80 dark:text-[#fcd34d]">
                  {locale === 'en' ? '✓ 1. Strategic Judgment' : '✓ 1. 戰略判斷不走偏'}
                </span>
                <span className="rounded-md border border-[#f59e0b]/40 bg-[#fffdfa]/95 px-2 py-0.5 text-[#854d0e] dark:border-[#ffb010]/30 dark:bg-[#0b1a29]/80 dark:text-[#fcd34d]">
                  {locale === 'en' ? '✓ 2. Business ROI' : '✓ 2. 嚴控成本算清 ROI'}
                </span>
                <span className="rounded-md border border-[#f59e0b]/40 bg-[#fffdfa]/95 px-2 py-0.5 text-[#854d0e] dark:border-[#ffb010]/30 dark:bg-[#0b1a29]/80 dark:text-[#fcd34d]">
                  {locale === 'en' ? '✓ 3. 100+ Team Leadership' : '✓ 3. 百人團隊帶得動'}
                </span>
                <span className="rounded-md border border-[#f59e0b]/40 bg-[#fffdfa]/95 px-2 py-0.5 text-[#854d0e] dark:border-[#ffb010]/30 dark:bg-[#0b1a29]/80 dark:text-[#fcd34d]">
                  {locale === 'en' ? '✓ 4. Risk Ownership' : '✓ 4. 系統危機敢扛大局'}
                </span>
                <span className="rounded-md border border-[#f59e0b]/40 bg-[#fffdfa]/95 px-2 py-0.5 text-[#854d0e] dark:border-[#ffb010]/30 dark:bg-[#0b1a29]/80 dark:text-[#fcd34d]">
                  {locale === 'en' ? '✓ 5. Grounded Execution' : '✓ 5. 戰略穿透底層落地'}
                </span>
              </div>
            </div>

            {/* 3. CTA Action Buttons: 1-Click Copy Link & Expand Accordion */}
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0 sm:shrink-0 sm:self-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink();
                }}
                className={cn(
                  'inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border-2 px-3.5 py-2 text-xs font-black shadow-xs transition-all duration-200 active:scale-95 sm:text-xs',
                  copied
                    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                    : 'border-[#17324d] bg-white text-[#17324d] hover:bg-[#fff0cc] dark:border-[#ffb010] dark:bg-[#132a42] dark:text-[#ffb010] dark:hover:bg-[#17324d]',
                )}
                title={
                  locale === 'en'
                    ? 'Copy direct URL (https://david888.com/commitments) to share with executives'
                    : '複製直達網址 (https://david888.com/commitments)，一鍵分享給老闆'
                }
                aria-label={
                  locale === 'en'
                    ? 'Copy direct link to 5 commitments'
                    : '複製 5 大承諾直達網址'
                }
              >
                {copied ? (
                  <Check size={15} strokeWidth={2.5} className="shrink-0 text-white" />
                ) : (
                  <Link2 size={15} className="shrink-0" />
                )}
                <span>
                  {copied
                    ? locale === 'en'
                      ? 'Link Copied!'
                      : '已複製直達連結！'
                    : locale === 'en'
                      ? 'Copy Direct Link'
                      : '複製直達連結'}
                </span>
              </button>

              <span className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border-2 border-[#17324d] bg-[#17324d] px-4 py-2 text-xs font-black text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:bg-[#0b1a29] sm:text-xs dark:border-[#ffb010] dark:bg-[#ffb010] dark:text-[#0b1a29] dark:group-hover:bg-[#ffc038]">
                <span>
                  {expanded
                    ? locale === 'en'
                      ? 'Collapse ▴'
                      : '收起 5 大承諾 ▴'
                    : locale === 'en'
                      ? 'Reveal 5 Commitments ▾'
                      : '展開 5 大安心解方 ▾'}
                </span>
                <ChevronDown
                  size={16}
                  className={cn('transition-transform duration-300', expanded && 'rotate-180')}
                />
              </span>
            </div>
          </div>
        </div>

        {/* Copy Success Feedback Bar */}
        {copied && (
          <div className="mt-2.5 flex items-center justify-between rounded-xl border border-emerald-600/35 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-950/80 dark:text-emerald-200">
            <span className="flex items-center gap-2">
              <Check size={16} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
              <span>
                {locale === 'en'
                  ? 'Canonical URL https://david888.com/commitments copied to clipboard. Ready to paste in LINE / Email / Chat!'
                  : '直達網址 https://david888.com/commitments 已複製！可直接貼在 LINE、Telegram、信件中發送給老闆與合作夥伴。'}
              </span>
            </span>
          </div>
        )}
      </section>

      {/* Expanded Track Record & 5 Commitments Details */}
      {expanded && (
        <div className="mt-5 space-y-4 rounded-2xl border-2 border-border bg-bg-elevated p-5 sm:p-7 text-[15px] leading-7 text-text-muted shadow-md">
          {content.body.slice(1).map((block, index) => {
            if (block.kind === 'sectionTitle') {
              const isExecutiveSection =
                block.text.includes('給企業經營層') ||
                block.text.includes('給不諳技術的老闆') ||
                block.text.includes('給不諳技術老闆') ||
                block.text.includes('Non-Technical Executives') ||
                block.text.includes('5 Core Commitments');

              const isQuestion =
                block.text.includes('「') ||
                (block.text.startsWith('"') && block.text.includes('"')) ||
                /^\d+\.\s*[“"「]/.test(block.text);

              if (isExecutiveSection) {
                return (
                  <div
                    key={index}
                    className="mb-4 mt-2 flex items-center gap-2.5 rounded-xl border-2 border-[#17324d] bg-[#fff0cc] p-4 text-text-main dark:border-[#ffb010]/70 dark:bg-[#17324d]/70"
                  >
                    <ShieldCheck className="h-6 w-6 shrink-0 text-[#a9471d] dark:text-[#ffb010]" />
                    <h3 className="m-0 text-base font-black sm:text-xl">{block.text}</h3>
                  </div>
                );
              }

              if (isQuestion) {
                return (
                  <div
                    key={index}
                    className="mb-2 mt-7 first:mt-3 rounded-2xl border border-amber-900/15 bg-amber-50/70 p-4 sm:p-5 shadow-xs dark:border-amber-400/20 dark:bg-[#131f2e]/90"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200/80 text-amber-900 text-xs font-black dark:bg-amber-900/50 dark:text-amber-300">
                        ?
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-amber-900/80 dark:text-amber-300/90">
                        {locale === 'en' ? "Boss's Biggest Anxiety" : '老闆心中的痛點與疑慮'}
                      </span>
                    </div>
                    <p className="m-0 text-sm font-bold leading-relaxed text-[#451a03] sm:text-base dark:text-[#fef3c7]">
                      {block.text}
                    </p>
                  </div>
                );
              }

              return (
                <h3
                  key={index}
                  className="mb-2 mt-6 first:mt-0 text-base font-extrabold text-text-main sm:text-lg"
                >
                  {block.text}
                </h3>
              );
            }

            if (block.kind === 'bullet') {
              const isCommitmentAnswer =
                block.text.startsWith('商業導向') ||
                block.text.startsWith('開源節流') ||
                block.text.startsWith('建立基準') ||
                block.text.startsWith('隻身掌控') ||
                block.text.startsWith('穿透底層') ||
                block.text.startsWith('Business-Driven') ||
                block.text.startsWith('Fiscal Discipline') ||
                block.text.startsWith('Setting Baselines') ||
                block.text.startsWith('Eliminating SPOF') ||
                block.text.startsWith('Deep Grounding') ||
                block.text.startsWith('說人話') ||
                block.text.startsWith('精準盤查') ||
                block.text.startsWith('梳理毛線團') ||
                block.text.startsWith('風險分級') ||
                block.text.startsWith('陽光透明') ||
                block.text.startsWith('Speak Plain Business') ||
                block.text.startsWith('Precision Audit') ||
                block.text.startsWith('Untangling') ||
                block.text.startsWith('Risk Prioritization') ||
                block.text.startsWith('Transparent Track Record');

              if (isCommitmentAnswer) {
                const colonIndex =
                  block.text.indexOf('：') !== -1
                    ? block.text.indexOf('：')
                    : block.text.indexOf(':');
                const title = colonIndex !== -1 ? block.text.slice(0, colonIndex).trim() : '';
                const body = colonIndex !== -1 ? block.text.slice(colonIndex + 1).trim() : block.text;

                return (
                  <div
                    key={index}
                    className="mb-7 rounded-2xl border-2 border-emerald-600/35 bg-emerald-50/70 p-5 sm:p-6 shadow-[0_4px_20px_rgba(5,150,105,0.08)] transition-all dark:border-emerald-500/40 dark:bg-emerald-950/25"
                  >
                    {/* Solution Header Bar */}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-600/15 pb-2.5 dark:border-emerald-400/15">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs dark:bg-emerald-500">
                          <CheckCircle2 size={18} strokeWidth={2.5} />
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          {locale === 'en' ? "David's Solution & Commitment" : 'David 的專家實戰解方'}
                        </span>
                      </div>
                      <span className="rounded-full border border-emerald-600/30 bg-white/90 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 shadow-2xs dark:border-emerald-500/30 dark:bg-emerald-900/50 dark:text-emerald-200">
                        {locale === 'en' ? 'Core Deliverable' : '核心實戰承諾'}
                      </span>
                    </div>

                    {/* Prominent Solution Title */}
                    {title && (
                      <h4 className="mb-2 text-base font-black tracking-tight text-emerald-950 sm:text-xl dark:text-emerald-100">
                        {title}
                      </h4>
                    )}

                    {/* Large, High-Readability Solution Body Text */}
                    <p className="m-0 text-base font-medium leading-[1.8] text-emerald-950/90 sm:text-[1.125rem] dark:text-emerald-50/90">
                      {body}
                    </p>
                  </div>
                );
              }

              return (
                <div key={index} className="mb-3 flex items-start gap-3 text-text-main">
                  <span
                    className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#a9471d] dark:bg-[#ffb010]"
                    aria-hidden="true"
                  />
                  <p className="m-0 text-sm font-medium leading-relaxed sm:text-base">
                    {block.text}
                  </p>
                </div>
              );
            }

            if (block.kind === 'note') {
              return (
                <p
                  key={index}
                  className="mt-4 rounded-xl border border-[#17324d]/25 bg-[#fff0cc] px-4 py-3 text-sm font-bold text-[#2b251a] dark:border-[#ffb010]/30 dark:bg-[#17324d] dark:text-[#fff9e8]"
                >
                  {block.text}
                </p>
              );
            }

            return (
              <p key={index} className="mb-3 max-w-[75ch]">
                {block.text}
              </p>
            );
          })}

          {/* Bottom Action Bar for Convenience */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleCopyLink}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border-2 px-4 py-2 text-xs font-black transition-colors',
                copied
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-[#f59e0b] bg-[#fff9eb] text-[#854d0e] hover:bg-[#ffedd5] dark:border-[#ffb010]/60 dark:bg-[#17324d] dark:text-[#ffb010] dark:hover:bg-[#1f3f60]',
              )}
            >
              {copied ? <Check size={14} strokeWidth={2.5} /> : <Link2 size={14} />}
              <span>
                {copied
                  ? locale === 'en'
                    ? 'Link Copied to Clipboard!'
                    : '已複製直達連結至剪貼簿！'
                  : locale === 'en'
                    ? 'Copy Direct Link (/commitments)'
                    : '複製 5 大承諾直達網址 (/commitments)'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#17324d] bg-bg-surface px-4 py-2 text-xs font-black text-text-main transition-colors hover:bg-[#fff0cc] dark:border-[#ffb010]/60 dark:hover:bg-[#17324d]"
            >
              <span>{locale === 'en' ? 'Collapse 5 Commitments & Track Record ▴' : '收起 5 大承諾與經歷 ▴'}</span>
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
