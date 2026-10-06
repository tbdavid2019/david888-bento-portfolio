import React from 'react';
import { profileContent } from '../data/profile-content';
import type { Locale } from '../types';

interface ProfileIntroductionProps {
  locale: Locale;
}

export const ProfileIntroduction: React.FC<ProfileIntroductionProps> = ({ locale }) => {
  const content = profileContent[locale];

  return (
    <article className="border-y border-border py-8 md:py-10" aria-label={locale === 'en' ? 'Professional introduction' : '專業介紹'}>
      <h2 className="max-w-3xl text-2xl font-black leading-tight text-text-main md:text-3xl">
        {content.subHeadline}
      </h2>

      <div className="mt-6 columns-1 gap-x-10 text-[15px] leading-7 text-text-muted md:columns-2 md:text-base md:leading-8">
        {content.body.map((block, index) => {
          if (block.kind === 'sectionTitle') {
            return (
              <h3 key={index} className="mb-2 mt-5 break-inside-avoid-column break-after-avoid text-base font-black text-text-main md:text-lg">
                {block.text}
              </h3>
            );
          }

          if (block.kind === 'bullet') {
            return (
              <div key={index} className="mb-2 flex items-start gap-3 break-inside-avoid-column text-text-main">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <p>{block.text}</p>
              </div>
            );
          }

          if (block.kind === 'note') {
            return (
              <p key={index} className="mb-3 break-inside-avoid-column font-semibold text-text-main">
                {block.text}
              </p>
            );
          }

          return (
            <p key={index} className="mb-4 break-inside-avoid-column">
              {block.text}
            </p>
          );
        })}
      </div>
    </article>
  );
};
