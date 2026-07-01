import React from 'react';
import { CardWrapper } from './CardWrapper';
import type { Locale } from '../../App';

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
  const getFaviconUrl = (url: string) =>
    `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=128`;

  // Filter out unstable Bento/Creatorspace URLs
  const isUnstableUrl = (url?: string | null) =>
    url && (
      url.includes('creatorspace-public') ||
      url.includes('storage.googleapis.com')
    );

  // Prioritize stable custom images, otherwise fallback to auto-generated favicon
  const imageDisplayUrl = (!isUnstableUrl(link.imageSource) && link.imageSource)
    ? link.imageSource
    : getFaviconUrl(link.url);

  const isBranded = !!link.bgClass;
  const title = locale === 'en' ? link.titleEn || link.title : link.title;
  const description = locale === 'en' ? link.descriptionEn || link.description : link.description;

  return (
    <CardWrapper
      onClick={() => window.open(link.url, '_blank', 'noreferrer')}
      className="group min-h-[140px]"
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${link.bgClass || 'bg-white dark:bg-slate-800'}`}>
          <img
            src={imageDisplayUrl as string}
            alt={title}
            className={`w-full h-full ${isBranded ? 'p-2 object-contain' : 'object-cover'}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const faviconUrl = getFaviconUrl(link.url);
              if (target.src !== faviconUrl) {
                target.src = faviconUrl;
              }
            }}
          />
        </div>
      </div>
      <div className="mt-auto pt-6">
        <div className="text-base font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-1">
          {title}
        </div>
        {description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 mb-2 leading-relaxed">
            {description}
          </div>
        )}
        <div className="text-[10px] uppercase font-black tracking-widest text-slate-300 dark:text-slate-600">{getDomain(link.url)}</div>
      </div>
    </CardWrapper>
  );
};
