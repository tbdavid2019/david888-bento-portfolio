import React from 'react';
import {
  Activity,
  ArrowUpRight,
  AtSign,
  AudioLines,
  BarChart3,
  Book,
  BookOpen,
  Bot,
  Box,
  Camera,
  CandlestickChart,
  Check,
  CheckCircle2,
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
  flagship?: boolean;
  highlights?: string[];
  highlightsEn?: string[];
  techStack?: string[];
  mcpConfig?: {
    serverName?: string;
    type?: string;
    url: string;
    configJson?: string;
    description?: string;
    descriptionEn?: string;
  };
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

export const BentoLinkCard: React.FC<{
  link: BentoLink;
  locale?: Locale;
  onTagClick?: (tag: string) => void;
}> = ({
  link,
  locale = 'zh',
  onTagClick,
}) => {
  const isEn = locale === 'en';
  const [copiedMcp, setCopiedMcp] = React.useState(false);
  const title = isEn ? link.titleEn || link.title : link.title;
  const description = isEn ? link.descriptionEn || link.description : link.description;
  const highlights = isEn ? link.highlightsEn || link.highlights : link.highlights;
  const ServiceIcon = (link.icon && iconRegistry[link.icon]) || Globe;
  const statusCopy = link.runtimeStatus ? runtimeStatusLabels[link.runtimeStatus] : null;
  const statusLabel = statusCopy ? `[${isEn ? statusCopy.en : statusCopy.zh}]` : null;
  const statusTooltip = statusCopy
    ? isEn
      ? `Hugging Face Space status: ${statusCopy.en}`
      : `Hugging Face Space 狀態：${statusCopy.zh}`
    : '';

  const handleCopyMcp = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const mcpJson = link.mcpConfig
    ? link.mcpConfig.configJson ||
      JSON.stringify(
        {
          mcpServers: {
            [link.mcpConfig.serverName || 'news888']: {
              type: link.mcpConfig.type || 'http',
              url: link.mcpConfig.url || link.url,
            },
          },
        },
        null,
        2,
      )
    : '';

  return (
    <CardWrapper
      onClick={() => window.open(link.url, '_blank', 'noreferrer')}
      className={cn(
        'group min-h-[180px]',
        link.flagship && 'border-2 border-[#17324d] dark:border-[#ffb010]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#2b251a] bg-[#ffb010] text-[#2b251a] shadow-xs transition-transform duration-200 group-hover:scale-105">
            <ServiceIcon size={21} strokeWidth={2} aria-hidden="true" />
          </div>
          <span className="rounded-md border border-border bg-bg-elevated px-2.5 py-1 font-mono text-xs font-bold text-text-muted">
            {getDomain(link.url)}
          </span>
          {link.flagship && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[#f59e0b] bg-[#fff0cc] px-2 py-0.5 text-[11px] font-black text-[#854d0e] dark:border-[#ffb010] dark:bg-[#17324d] dark:text-[#fcd34d]">
              <Sparkles size={11} className="text-[#f59e0b] dark:text-[#ffb010]" />
              <span>{isEn ? 'Flagship' : '主力系統'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {statusLabel && (
            <span
              title={statusTooltip}
              aria-label={statusTooltip}
              className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-extrabold text-warning"
            >
              {statusLabel}
            </span>
          )}
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors group-hover:border-[#17324d] group-hover:bg-[#17324d] group-hover:text-[#fff9e8] dark:group-hover:border-[#ffb010] dark:group-hover:bg-[#ffb010] dark:group-hover:text-[#2b251a]">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-1 flex-col">
        <div className="break-words text-lg font-bold leading-tight tracking-tight text-text-main md:text-xl">
          {title}
        </div>

        {description && (
          <div className="mt-2 break-words text-sm leading-relaxed text-text-muted md:text-[15px]">
            {description}
          </div>
        )}

        {link.mcpConfig && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 min-w-0 overflow-hidden rounded-xl border border-border bg-bg-surface p-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
              <span className="font-mono text-[11px] font-extrabold text-[#a9471d] dark:text-[#ffb010]">
                {isEn ? 'Universal MCP Config' : '通用 MCP 組態'}
              </span>
              <button
                type="button"
                onClick={(e) => handleCopyMcp(e, mcpJson)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#17324d] bg-[#fff0cc] px-2.5 py-1 font-mono text-[11px] font-bold text-[#17324d] transition-colors hover:bg-[#ffb010] focus-visible:outline-2 focus-visible:outline-[#17324d] dark:border-[#ffb010]/60 dark:bg-[#17324d] dark:text-[#ffb010]"
                aria-label={isEn ? 'Copy MCP config' : '複製 MCP 組態'}
              >
                {copiedMcp ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedMcp ? (isEn ? 'Copied!' : '已複製！') : (isEn ? 'Copy JSON' : '複製組態')}</span>
              </button>
            </div>
            <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-black/5 p-2.5 font-mono text-[11px] leading-tight text-text-main dark:bg-black/40">
              <code>{mcpJson}</code>
            </pre>
          </div>
        )}

        {highlights && highlights.length > 0 && (
          <ul className="mt-3 m-0 min-w-0 list-none space-y-1.5 rounded-lg border border-border/80 bg-bg-elevated p-3 text-xs leading-relaxed text-text-main sm:text-sm">
            {highlights.map((point, idx) => (
              <li key={idx} className="flex min-w-0 items-start gap-2">
                <CheckCircle2
                  size={15}
                  className="mt-0.5 shrink-0 text-[#17324d] dark:text-[#ffb010]"
                />
                <span className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {link.techStack && link.techStack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {link.techStack.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tech);
                }}
                title={isEn ? `Filter portfolio by #${tech}` : `依 #${tech} 檢索跨分類相關作品`}
                className="inline-flex cursor-pointer items-center rounded-md border border-border bg-bg-elevated px-2 py-0.5 font-mono text-[11px] font-bold text-text-muted transition-colors hover:border-[#17324d] hover:bg-[#fff0cc] hover:text-[#17324d] dark:hover:border-[#ffb010] dark:hover:bg-[#17324d] dark:hover:text-[#ffb010]"
              >
                #{tech.replace(/^#/, '')}
              </button>
            ))}
          </div>
        )}

        {(link.docUrl || link.repoUrl) && (
          <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-3 mt-4">
            {link.docUrl && (
              <a
                href={link.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  isEn
                    ? link.docLabelEn || 'Feature Guide & Prompts'
                    : link.docLabel || link.docLabelZh || '實戰題庫指南'
                }
                onClick={(event) => event.stopPropagation()}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#17324d] bg-bg-elevated px-3 py-1.5 text-xs font-extrabold text-text-main no-underline transition-colors hover:bg-[#fff0cc] focus-visible:outline-2 focus-visible:outline-[#17324d] dark:border-[#ffb010]/60 dark:hover:bg-[#17324d]"
              >
                <BookOpen size={13} />
                <span>
                  {isEn ? link.docLabelEn || 'Feature Guide' : link.docLabel || link.docLabelZh || '題庫指南'}
                </span>
              </a>
            )}
            {link.repoUrl && (
              <a
                href={link.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={link.cloneCommand}
                aria-label={
                  isEn ? 'Open source for local run' : '開啟原始碼並在本機執行'
                }
                onClick={(event) => event.stopPropagation()}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs font-extrabold text-text-main no-underline transition-colors hover:border-[#17324d] focus-visible:outline-2 focus-visible:outline-[#17324d] dark:hover:border-[#ffb010]"
              >
                <span>{isEn ? 'Run locally' : '本機執行'}</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </div>
    </CardWrapper>
  );
};
