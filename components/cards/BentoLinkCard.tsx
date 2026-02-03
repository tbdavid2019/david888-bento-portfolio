import React from 'react';
import { CardWrapper } from './CardWrapper';

interface BentoLink {
  title: string;
  url: string;
  image?: string | null;
  imageSource?: string | null;
}

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const BentoLinkCard: React.FC<{ link: BentoLink }> = ({ link }) => {
  const getFaviconUrl = (url: string) =>
    `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=128`;

  // Filter out unstable Bento/Creatorspace URLs
  const isUnstableUrl = (url?: string | null) =>
    url && (url.includes('creatorspace-public') || url.includes('bento'));

  // Prioritize stable custom images, otherwise fallback to auto-generated favicon
  const imageDisplayUrl = (!isUnstableUrl(link.imageSource) && link.imageSource)
    ? link.imageSource
    : getFaviconUrl(link.url);

  return (
    <CardWrapper
      onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
      className="group min-h-[140px]"
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
          <img
            src={imageDisplayUrl as string}
            alt={link.title}
            className="w-full h-full object-cover"
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
        <div className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
          {link.title}
        </div>
        <div className="text-xs text-slate-400 mt-1">{getDomain(link.url)}</div>
      </div>
    </CardWrapper>
  );
};
