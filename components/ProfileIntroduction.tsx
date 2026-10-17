import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
                ? 'Collapse Full Executive Dossier'
                : '收起完整顧問與履歷背景'
              : locale === 'en'
                ? 'Read Full Executive Track Record & Retainer Terms'
                : '展開完整 CTO 實績與顧問合作細節'}
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
              return (
                <h3
                  key={index}
                  className="mb-1.5 mt-4 first:mt-0 text-base font-extrabold text-text-main sm:text-lg"
                >
                  {block.text}
                </h3>
              );
            }

            if (block.kind === 'bullet') {
              return (
                <div key={index} className="mb-2 flex items-start gap-3 text-text-main">
                  <span
                    className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#a9471d] dark:bg-[#ffb010]"
                    aria-hidden="true"
                  />
                  <p className="m-0">{block.text}</p>
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
