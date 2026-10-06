import React from 'react';
import {
  Activity,
  AtSign,
  AudioLines,
  BarChart2,
  BarChart3,
  Book,
  BookOpen,
  Bot,
  Box,
  Camera,
  CandlestickChart,
  Compass,
  Copy,
  Cpu,
  Crosshair,
  Dice5,
  ExternalLink,
  Eye,
  FileCode,
  FileEdit,
  FileSearch,
  FileText,
  Gamepad2,
  Globe,
  GraduationCap,
  Heart,
  HeartHandshake,
  HelpCircle,
  House,
  Languages,
  Layers,
  Library,
  LineChart,
  Link as LinkIcon,
  Linkedin,
  MapPin,
  MessageCircle,
  MessageSquare,
  Mic,
  Music,
  Navigation,
  Network,
  Newspaper,
  Package,
  Podcast,
  Radar,
  ScrollText,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Sparkle,
  Sparkles,
  Store,
  TreePine,
  TrendingUp,
  Type,
  Users,
  Workflow,
  Wrench,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
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
  tag?: string;
}

const iconRegistry: Record<string, LucideIcon> = {
  tarot: Sparkles,
  bazi: ScrollText,
  fengshui: House,
  yinyuan: HeartHandshake,
  network: Network,
  candlestick: CandlestickChart,
  newspaper: Newspaper,
  'trending-up': TrendingUp,
  'line-chart': LineChart,
  'bar-chart': BarChart3,
  bot: Bot,
  'book-open': BookOpen,
  mic: Mic,
  'audio-lines': AudioLines,
  sparkles: Sparkles,
  linkedin: Linkedin,
  'file-search': FileSearch,
  youtube: Youtube,
  'file-text': FileText,
  eye: Eye,
  camera: Camera,
  'graduation-cap': GraduationCap,
  'message-square': MessageSquare,
  type: Type,
  languages: Languages,
  'message-circle': MessageCircle,
  activity: Activity,
  'at-sign': AtSign,
  smile: Smile,
  store: Store,
  box: Box,
  search: Search,
  'file-code': FileCode,
  wrench: Wrench,
  library: Library,
  compass: Compass,
  'scroll-text': ScrollText,
  house: House,
  'heart-handshake': HeartHandshake,
  'map-pin': MapPin,
  heart: Heart,
  link: LinkIcon,
  navigation: Navigation,
  'dice-5': Dice5,
  users: Users,
  'help-circle': HelpCircle,
  cpu: Cpu,
  radar: Radar,
  'share-2': Share2,
  'file-edit': FileEdit,
  package: Package,
  book: Book,
  layers: Layers,
  workflow: Workflow,
  music: Music,
  'shopping-bag': ShoppingBag,
  copy: Copy,
  'shopping-cart': ShoppingCart,
  'tree-pine': TreePine,
  crosshair: Crosshair,
  sparkle: Sparkle,
  podcast: Podcast,
  'gamepad-2': Gamepad2,
  'shield-check': ShieldCheck,
};

const getCategoryIconStyle = (tag?: string) => {
  switch (tag) {
    case 'finance':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25';
    case 'agent-skills':
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25';
    case 'products':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25';
    case 'experiments':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25';
    case 'metaphysics':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25';
    case 'social':
      return 'bg-primary/10 text-primary border border-primary/25';
    default:
      return 'bg-bg-elevated text-primary border border-border';
  }
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
  const title = locale === 'en' ? link.titleEn || link.title : link.title;
  const description = locale === 'en' ? link.descriptionEn || link.description : link.description;
  const ServiceIcon = (link.icon && iconRegistry[link.icon]) || Globe;
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
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110',
            getCategoryIconStyle(link.tag)
          )}
        >
          <ServiceIcon size={24} strokeWidth={1.8} aria-hidden="true" />
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
