import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';
import { profileContent } from '../data/profile-content';
import { cn } from '../lib/utils';
import type { Locale } from '../types';

interface ProfileIntroductionProps {
  locale: Locale;
}

export const ProfileIntroduction: React.FC<ProfileIntroductionProps> = ({ locale }) => {
  const content = profileContent[locale];
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="mt-6 border-t border-border pt-5"
      aria-label={locale === 'en' ? 'Professional introduction' : '專業介紹'}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 max-w-[70ch] text-base font-bold leading-relaxed text-text-main sm:text-lg">
          {content.subHeadline}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-[#17324d] bg-bg-elevated px-3.5 py-1.5 text-xs font-extrabold text-text-main transition-colors hover:bg-[#fff0cc] sm:self-auto dark:border-[#ffb010]/60 dark:hover:bg-[#17324d]"
          aria-expanded={expanded}
        >
          <span>
            {expanded
              ? locale === 'en'
                ? 'Collapse Executive Track Record & Commitments'
                : '收起完整實績與經營層承諾'
              : locale === 'en'
                ? 'Read Full Executive Track Record & 5 Commitments for Leaders'
                : '展開完整 CTO 實績與給經營層的 5 大安心承諾'}
          </span>
          <ChevronDown
            size={15}
            className={cn('transition-transform duration-200', expanded && 'rotate-180')}
          />
        </button>
      </div>

      {/* First summary paragraph is always visible */}
      {content.body[0] && (
        <p className="mt-3 max-w-[75ch] text-[15px] leading-relaxed text-text-muted sm:text-base">
          {content.body[0].text}
        </p>
      )}

      {expanded && (
        <div className="mt-5 space-y-3 rounded-xl border border-border bg-bg-elevated p-5 text-[15px] leading-7 text-text-muted">
          {content.body.slice(1).map((block, index) => {
            if (block.kind === 'sectionTitle') {
              const isExecutiveSection =
                block.text.includes('給企業經營層') || block.text.includes('Non-Technical Executives');
              const isQuestion =
                block.text.includes('「') ||
                (block.text.startsWith('"') && block.text.includes('"')) ||
                /^\d+\.\s*[“"「]/.test(block.text);

              if (isExecutiveSection) {
                return (
                  <div
                    key={index}
                    className="mb-4 mt-6 first:mt-0 flex items-center gap-2.5 rounded-xl border border-[#17324d] bg-[#fff0cc] p-3.5 text-text-main dark:border-[#ffb010]/60 dark:bg-[#17324d]/60"
                  >
                    <ShieldCheck className="h-5 w-5 shrink-0 text-[#a9471d] dark:text-[#ffb010]" />
                    <h3 className="m-0 text-base font-extrabold sm:text-lg">
                      {block.text}
                    </h3>
                  </div>
                );
              }

              if (isQuestion) {
                return (
                  <div
                    key={index}
                    className="mt-4 mb-2 flex items-start gap-2.5 rounded-lg border-l-4 border-[#17324d] bg-bg-surface p-3 font-semibold text-text-main dark:border-[#ffb010]"
                  >
                    <HelpCircle size={17} className="mt-0.5 shrink-0 text-[#a9471d] dark:text-[#ffb010]" />
                    <span className="text-sm font-bold sm:text-[15px]">{block.text}</span>
                  </div>
                );
              }

              return (
                <h3
                  key={index}
                  className="mb-1.5 mt-5 first:mt-0 text-base font-extrabold text-text-main sm:text-lg"
                >
                  {block.text}
                </h3>
              );
            }

            if (block.kind === 'bullet') {
              const isCommitmentAnswer =
                block.text.startsWith('說人話') ||
                block.text.startsWith('生意優先') ||
                block.text.startsWith('尊重業務') ||
                block.text.startsWith('聽得懂') ||
                block.text.startsWith('陽光透明') ||
                block.text.startsWith('Speak Business') ||
                block.text.startsWith('Business Continuity') ||
                block.text.startsWith('Grounded Respect') ||
                block.text.startsWith('Decades of') ||
                block.text.startsWith('Public Accountability');

              return (
                <div key={index} className="mb-2 flex items-start gap-2.5 text-text-main">
                  {isCommitmentAnswer ? (
                    <CheckCircle2
                      size={16}
                      className="mt-1 shrink-0 text-[#17324d] dark:text-[#ffb010]"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#a9471d] dark:bg-[#ffb010]"
                      aria-hidden="true"
                    />
                  )}
                  <p className="m-0 leading-relaxed text-sm sm:text-[15px]">{block.text}</p>
                </div>
              );
            }

            if (block.kind === 'note') {
              return (
                <p
                  key={index}
                  className="mt-4 rounded-lg border border-[#17324d]/25 bg-[#fff0cc] px-4 py-2.5 text-sm font-bold text-[#2b251a] dark:border-[#ffb010]/30 dark:bg-[#17324d] dark:text-[#fff9e8]"
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
        </div>
      )}
    </article>
  );
};
