import React from 'react';
import { BookOpen, ExternalLink, HeartHandshake, House, ScrollText, Sparkles, type LucideIcon } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import { cn } from '../../lib/utils';
import type { BentoLinkIcon, BentoLinkRuntimeStatus, Locale } from '../../types';

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
  runtimeStatus?: BentoLinkRuntimeStatus;
  repoUrl?: string;
  cloneCommand?: string;
  colSpan?: 1 | 2;
  docUrl?: string;
  docLabel?: string;
  docLabelEn?: string;
}

const iconMap: Record<BentoLinkIcon, LucideIcon> = {
  tarot: Sparkles,
  bazi: ScrollText,
  fengshui: House,
  yinyuan: HeartHandshake,
};

const runtimeStatusLabels: Record<BentoLinkRuntimeStatus, { zh: string; en: string }> = {
  paused: { zh: '暫停', en: 'Paused' },
  sleeping: { zh: '休眠', en: 'Sleeping' },
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
  const statusCopy = link.runtimeStatus ? runtimeStatusLabels[link.runtimeStatus] : null;
  const statusLabel = statusCopy ? `[${locale === 'en' ? statusCopy.en : statusCopy.zh}]` : null;
  const statusTooltip = statusCopy
    ? locale === 'en'
      ? `Hugging Face Space status: ${statusCopy.en}`
      : `Hugging Face Space 狀態：${statusCopy.zh}`
    : '';

  return (
    <CardWrapper
      onClick={() => window.open(link.url, '_blank', 'noreferrer')}
      className="group min-h-[180px]"
    >
      <div className="flex items-start justify-between gap-3">
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
        {statusLabel && (
          <span
            title={statusTooltip}
            aria-label={statusTooltip}
            className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-black text-warning"
          >
            {statusLabel}
          </span>
        )}
      </div>
      <div className="mt-auto pt-8">
        <div className="text-lg font-bold leading-tight tracking-tight text-text-main md:text-xl">
          {title}
        </div>
        {description && (
          <div className={cn(
            "mb-3 text-sm leading-relaxed text-text-muted md:text-[15px]",
            link.colSpan === 2 ? "line-clamp-6 md:line-clamp-none" : "line-clamp-4"
          )}>
            {description}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-[11px] font-black uppercase tracking-widest text-text-muted">{getDomain(link.url)}</div>
          <div className="flex flex-wrap items-center gap-2">
            {link.docUrl && (
              <a
                href={link.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={locale === 'en' ? (link.docLabelEn || 'Feature Guide & Prompts') : (link.docLabel || '實戰題庫指南')}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-400 transition-colors hover:border-amber-500 hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <BookOpen size={13} />
                <span>{locale === 'en' ? (link.docLabelEn || 'Feature Guide') : (link.docLabel || '題庫指南')}</span>
              </a>
            )}
            {link.repoUrl && (
              <a
                href={link.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={link.cloneCommand}
                aria-label={locale === 'en' ? 'Open source for local run' : '開啟原始碼並在本機運行'}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-2.5 py-1 text-xs font-black text-primary transition-colors hover:border-primary hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{locale === 'en' ? 'Run locally' : '本機運行'}</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </CardWrapper>
  );
};
