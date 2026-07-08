import React from 'react';
import { ArrowUpRight, Github, GitCommitHorizontal } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import type { Locale } from '../../types';

const GITHUB_PROFILE_URL = 'https://github.com/tbdavid2019';
const GITHUB_ACTIVITY_JSON_URL = '/github-activity.json';

type GithubActivityEntry = {
  title: string;
  url: string;
  updated: string;
  summary?: string;
};

type GithubActivityPayload = {
  entries: GithubActivityEntry[];
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export const GithubActivityCard: React.FC<{ locale: Locale }> = ({ locale }) => {
  const [entries, setEntries] = React.useState<GithubActivityEntry[]>([]);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      try {
        const response = await fetch(GITHUB_ACTIVITY_JSON_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch GitHub activity JSON: ${response.status}`);
        }

        const payload = (await response.json()) as GithubActivityPayload;
        const nextEntries = Array.isArray(payload.entries)
          ? payload.entries
              .map((entry) => ({
                title: normalizeText(entry.title || ''),
                url: entry.url || '',
                updated: entry.updated || '',
                summary: entry.summary ? normalizeText(entry.summary) : '',
              }))
              .filter((entry) => entry.title && entry.url)
          : [];

        if (!cancelled) {
          setEntries(nextEntries);
          setIsReady(true);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setEntries([]);
          setIsReady(true);
        }
      }
    }

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-TW', {
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );

  if (isReady && entries.length === 0) {
    return null;
  }

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return formatter.format(date);
  };

  return (
    <CardWrapper className="min-h-[280px] justify-between border-border bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.06),transparent_35%),linear-gradient(160deg,rgba(255,252,247,0.96),rgba(248,244,238,0.9))] dark:bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_35%),linear-gradient(160deg,rgba(34,29,26,0.96),rgba(24,20,18,0.9))]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-text-main text-bg-base shadow-sm">
            <Github size={22} />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">
              {locale === 'en' ? 'Build-time Atom Feed' : 'Build-time Atom Feed'}
            </div>
            <h3 className="mt-2 text-lg font-black leading-tight text-text-main">
              {locale === 'en' ? 'Latest GitHub Activity' : '最新 GitHub 動態'}
            </h3>
          </div>
        </div>

        <a
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-bg-surface/80 px-4 text-sm font-bold text-text-main transition-colors hover:border-border-hover hover:bg-bg-elevated"
        >
          GitHub
          <ArrowUpRight size={14} />
        </a>
      </div>

      <div className="mt-6 space-y-3">
        {!isReady && (
          <>
            <div className="h-16 animate-pulse rounded-2xl bg-bg-elevated" />
            <div className="h-16 animate-pulse rounded-2xl bg-bg-elevated" />
            <div className="h-16 animate-pulse rounded-2xl bg-bg-elevated" />
          </>
        )}

        {entries.map((entry) => (
          <a
            key={entry.url}
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-border bg-bg-surface/70 p-4 transition-colors hover:border-border-hover hover:bg-bg-elevated"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-text-muted">
                <GitCommitHorizontal size={13} />
                {formatDate(entry.updated)}
              </div>
              <ArrowUpRight size={14} className="text-text-muted" />
            </div>
            <div className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-text-main">
              {entry.title}
            </div>
            {entry.summary && (
              <div className="mt-2 line-clamp-2 text-xs leading-5 text-text-muted">
                {entry.summary}
              </div>
            )}
          </a>
        ))}
      </div>
    </CardWrapper>
  );
};
