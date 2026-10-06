import React from 'react';
import { profileContent } from '../data/profile-content';
import type { Locale } from '../types';

interface ProfileIntroductionProps {
  locale: Locale;
}

export const ProfileIntroduction: React.FC<ProfileIntroductionProps> = ({ locale }) => {
  const content = profileContent[locale];

  return (
    <article className="mt-6 border-y border-border py-6" aria-label={locale === 'en' ? 'Professional introduction' : '專業介紹'}>
      <h2 className="text-xl font-black leading-snug text-text-main">
        {content.subHeadline}
      </h2>

      <div className="profile-introduction-body mt-5 gap-x-6 text-[15px] leading-7 text-text-muted">
        {content.body.map((block, index) => {
          if (block.kind === 'sectionTitle') {
            return (
              <h3 key={index} className="mb-2 mt-5 break-inside-avoid-column break-after-avoid text-base font-black text-text-main">
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
