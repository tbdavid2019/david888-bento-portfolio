import React from 'react';
import { HeartHandshake, House, ScrollText, Sparkles, type LucideIcon } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import type { BentoLinkIcon, Locale } from '../../types';

interface BentoLink {
  title: string;
  titleEn?: string;
  url: string;
  description?: string;
  descriptionEn?: string;
  image?: string | null;
  imageSource?: string | null;
  bgClass?: string | null;
  icon?: BentoLinkIcon;
}

const iconMap: Record<BentoLinkIcon, LucideIcon> = {
  tarot: Sparkles,
  bazi: ScrollText,
  fengshui: House,
  yinyuan: HeartHandshake,
};

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
  const ServiceIcon = link.icon ? iconMap[link.icon] : null;

  return (
    <CardWrapper
      onClick={() => window.open(link.url, '_blank', 'noreferrer')}
      className="group min-h-[180px]"
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl transition-transform duration-300 group-hover:scale-110 ${link.icon ? 'bg-primary/10 text-primary' : link.bgClass || 'bg-bg-elevated'}`}>
          {ServiceIcon ? (
            <ServiceIcon size={25} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <img
              src={imageDisplayUrl as string}
              alt={title}
              className={`h-full w-full ${isBranded ? 'object-contain p-2' : 'object-cover'}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.getAttribute('src') !== fallbackImageUrl) {
                  target.src = fallbackImageUrl;
                }
              }}
            />
          )}
        </div>
      </div>
      <div className="mt-auto pt-8">
        <div className="text-lg font-bold leading-tight tracking-tight text-text-main md:text-xl">
          {title}
        </div>
        {description && (
          <div className="mb-3 line-clamp-4 text-sm leading-relaxed text-text-muted md:text-[15px]">
            {description}
          </div>
        )}
        <div className="text-[11px] font-black uppercase tracking-widest text-text-muted opacity-60">{getDomain(link.url)}</div>
      </div>
    </CardWrapper>
  );
};
