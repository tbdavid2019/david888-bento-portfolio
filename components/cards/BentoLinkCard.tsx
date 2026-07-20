import React from 'react';
import { CardWrapper } from './CardWrapper';
import type { Locale } from '../../types';

interface BentoLink {
  title: string;
  titleEn?: string;
  url: string;
  description?: string;
  descriptionEn?: string;
  image?: string | null;
  imageSource?: string | null;
  bgClass?: string | null;
}

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const BentoLinkCard: React.FC<{ link: BentoLink; locale?: Locale }> = ({ link, locale = 'zh' }) => {
  const fallbackImageUrl = '/bento/default-icon.svg';

  // Filter out unstable Bento/Creatorspace URLs
  const isUnstableUrl = (url?: string | null) =>
    url && (
      url.includes('creatorspace-public') ||
      url.includes('storage.googleapis.com')
    );

  // Prioritize stable custom images, otherwise fallback to auto-generated favicon
  const imageDisplayUrl = (!isUnstableUrl(link.imageSource) && link.imageSource)
    ? link.imageSource
    : fallbackImageUrl;

  const isBranded = !!link.bgClass;
  const title = locale === 'en' ? link.titleEn || link.title : link.title;
  const description = locale === 'en' ? link.descriptionEn || link.description : link.description;

  return (
    <CardWrapper
      onClick={() => window.open(link.url, '_blank', 'noreferrer')}
      className="group min-h-[140px]"
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${link.bgClass || 'bg-bg-elevated'}`}>
          <img
            src={imageDisplayUrl as string}
            alt={title}
            className={`w-full h-full ${isBranded ? 'p-2 object-contain' : 'object-cover'}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.getAttribute('src') !== fallbackImageUrl) {
                target.src = fallbackImageUrl;
              }
            }}
          />
        </div>
      </div>
      <div className="mt-auto pt-6">
        <div className="text-base font-bold text-text-main leading-tight tracking-tight mb-1">
          {title}
        </div>
        {description && (
          <div className="text-xs text-text-muted line-clamp-4 mb-2 leading-relaxed">
            {description}
          </div>
        )}
        <div className="text-[10px] uppercase font-black tracking-widest text-text-muted opacity-60">{getDomain(link.url)}</div>
      </div>
    </CardWrapper>
  );
};
