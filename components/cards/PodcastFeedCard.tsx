import React from 'react';
import { ExternalLink, Headphones, Play, Radio, Volume2 } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import type { Locale } from '../../types';

const PODCAST_RSS_URL = 'https://podcast.david888.com/rss.xml';
const PODCAST_HOME_URL = 'https://podcast.david888.com/';
const EPISODE_LIMIT = 3;

type Episode = {
  title: string;
  link: string;
  audioUrl: string | null;
  pubDate: string | null;
  description: string | null;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getFirstElementByTagName(parent: Document | Element, tagName: string) {
  return parent.getElementsByTagName(tagName)[0] ?? null;
}

function getNodeText(parent: Document | Element, tagName: string) {
  return getFirstElementByTagName(parent, tagName)?.textContent?.trim() || '';
}

export const PodcastFeedCard: React.FC<{ locale: Locale }> = ({ locale }) => {
  const [episodes, setEpisodes] = React.useState<Episode[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setLoading(true);
      setHasError(false);

      try {
        const response = await fetch(PODCAST_RSS_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch podcast RSS: ${response.status}`);
        }

        const xmlText = await response.text();
        const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
        const parserError = getFirstElementByTagName(xml, 'parsererror');
        if (parserError) {
          throw new Error('Failed to parse podcast RSS');
        }

        const nextEpisodes = Array.from(xml.getElementsByTagName('item'))
          .slice(0, EPISODE_LIMIT)
          .map((item) => {
            const title = getNodeText(item, 'title');
            const link = getNodeText(item, 'link');
            const audioUrl = getFirstElementByTagName(item, 'enclosure')?.getAttribute('url') || null;
            const pubDate = getNodeText(item, 'pubDate') || null;
            const description = getNodeText(item, 'description') || null;

            return {
              title,
              link,
              audioUrl,
              pubDate,
              description: description ? stripHtml(description) : null,
            };
          })
          .filter((item) => item.title && item.link);

        if (!cancelled) {
          setEpisodes(nextEpisodes);
          setHasError(nextEpisodes.length === 0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setHasError(true);
          setEpisodes([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-TW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );

  const formatDate = (value: string | null) => {
    if (!value) {
      return locale === 'en' ? 'New episode' : '最新更新';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return formatter.format(date);
  };

  const featuredEpisode = episodes[0];
  const secondaryEpisodes = episodes.slice(1);

  return (
    <CardWrapper className="min-h-[340px] border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(255,122,0,0.18),transparent_30%),linear-gradient(135deg,rgba(255,246,235,0.95),rgba(255,250,244,0.82))] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,122,0,0.2),transparent_30%),linear-gradient(135deg,rgba(36,28,24,0.96),rgba(24,19,17,0.9))]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff7a00] text-white shadow-sm">
            <Headphones size={22} />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">
              {locale === 'en' ? 'Live Podcast Feed' : '即時 Podcast Feed'}
            </div>
            <h3 className="mt-2 text-xl font-black leading-tight text-text-main">
              {locale === 'en' ? 'Latest DAVID888 Episodes' : 'DAVID888 最新節目'}
            </h3>
          </div>
        </div>

        <a
          href={PODCAST_HOME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-bg-surface/80 px-4 text-sm font-bold text-text-main transition-colors hover:border-border-hover hover:bg-bg-elevated"
        >
          RSS
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="mt-6 space-y-4">
        {loading && (
          <>
            <div className="h-40 animate-pulse rounded-[1.75rem] bg-bg-elevated" />
            <div className="h-20 animate-pulse rounded-2xl bg-bg-elevated" />
            <div className="h-20 animate-pulse rounded-2xl bg-bg-elevated" />
          </>
        )}

        {!loading && hasError && (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
            {locale === 'en'
              ? 'Unable to load the feed right now. Open the podcast site directly.'
              : '目前無法載入 RSS，先直接打開 podcast 網站。'}
          </div>
        )}

        {!loading && !hasError && featuredEpisode && (
          <div className="rounded-[1.75rem] border border-border bg-[linear-gradient(145deg,rgba(255,255,255,0.55),rgba(255,255,255,0.18))] p-5 shadow-sm dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">
              <Radio size={13} />
              {locale === 'en' ? 'Now Featured' : '本日主打'}
            </div>

            <div className="mt-3">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                {formatDate(featuredEpisode.pubDate)}
              </div>
              <h4 className="mt-2 text-lg font-black leading-7 text-text-main md:text-xl">
                {featuredEpisode.title}
              </h4>
              {featuredEpisode.description && (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-muted">
                  {featuredEpisode.description}
                </p>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-border/80 bg-bg-surface/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-text-main">
                  <Volume2 size={16} />
                  {locale === 'en' ? 'Listen now' : '直接播放'}
                </div>
                <a
                  href={featuredEpisode.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-text-muted transition-colors hover:text-text-main"
                >
                  {locale === 'en' ? 'Open episode' : '打開節目頁'}
                  <ExternalLink size={13} />
                </a>
              </div>

              {featuredEpisode.audioUrl ? (
                <audio controls preload="none" className="w-full">
                  <source src={featuredEpisode.audioUrl} type="audio/mpeg" />
                </audio>
              ) : (
                <a
                  href={featuredEpisode.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#ff7a00] px-4 text-sm font-bold text-white"
                >
                  <Play size={14} fill="currentColor" />
                  {locale === 'en' ? 'Play on site' : '前往收聽'}
                </a>
              )}
            </div>
          </div>
        )}

        {!loading &&
          !hasError &&
          secondaryEpisodes.map((episode) => (
            <a
              key={episode.link}
              href={episode.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group/episode block rounded-2xl border border-border bg-bg-surface/70 p-4 transition-colors hover:border-border-hover hover:bg-bg-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                    {formatDate(episode.pubDate)}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-text-main">
                    {episode.title}
                  </div>
                  {episode.description && (
                    <div className="mt-2 line-clamp-2 text-xs leading-5 text-text-muted">
                      {episode.description}
                    </div>
                  )}
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff7a00] text-white transition-transform group-hover/episode:scale-105">
                  <Play size={14} fill="currentColor" />
                </div>
              </div>
            </a>
          ))}
      </div>
    </CardWrapper>
  );
};
