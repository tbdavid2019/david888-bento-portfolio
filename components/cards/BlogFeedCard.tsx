import React from 'react';
import { ArrowUpRight, BookOpenText, ExternalLink, Newspaper } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import type { Locale } from '../../types';

const BLOG_HOME_URL = 'https://blog.david888.com/';
const BLOG_API_URL =
  'https://admin.blog.david888.com/ghost/api/content/posts/?key=9f872fa2c1d0f2c4a54b921194&limit=3&fields=title,url,excerpt,published_at,feature_image';

type BlogPost = {
  title: string;
  url: string;
  excerpt: string | null;
  published_at: string;
  feature_image: string | null;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export const BlogFeedCard: React.FC<{ locale: Locale }> = ({ locale }) => {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setHasError(false);

      try {
        const response = await fetch(BLOG_API_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch blog feed: ${response.status}`);
        }

        const payload = await response.json();
        const nextPosts = Array.isArray(payload.posts)
          ? payload.posts
              .map((post) => ({
                title: typeof post.title === 'string' ? normalizeText(post.title) : '',
                url: typeof post.url === 'string' ? post.url : '',
                excerpt: typeof post.excerpt === 'string' ? normalizeText(post.excerpt) : null,
                published_at: typeof post.published_at === 'string' ? post.published_at : '',
                feature_image: typeof post.feature_image === 'string' ? post.feature_image : null,
              }))
              .filter((post) => post.title && post.url && post.published_at)
          : [];

        if (!cancelled) {
          setPosts(nextPosts);
          setHasError(nextPosts.length === 0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setPosts([]);
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

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

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return formatter.format(date);
  };

  const featuredPost = posts[0];
  const morePosts = posts.slice(1);

  return (
    <CardWrapper className="min-h-[340px] justify-between border-secondary/20 bg-[radial-gradient(circle_at_top_right,rgba(47,93,108,0.16),transparent_32%),linear-gradient(180deg,rgba(255,252,247,0.94),rgba(255,248,242,0.84))] dark:bg-[radial-gradient(circle_at_top_right,rgba(130,184,192,0.14),transparent_32%),linear-gradient(180deg,rgba(38,31,28,0.94),rgba(28,23,21,0.88))]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2f5d6c] text-white shadow-sm">
            <BookOpenText size={22} />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">
              {locale === 'en' ? 'Live Blog Feed' : '即時 Blog Feed'}
            </div>
            <h3 className="mt-2 text-lg font-black leading-tight text-text-main">
              {locale === 'en' ? 'Latest DAVID888 Posts' : 'DAVID888 最新文章'}
            </h3>
          </div>
        </div>

        <a
          href={BLOG_HOME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-bg-surface/80 px-4 text-sm font-bold text-text-main transition-colors hover:border-border-hover hover:bg-bg-elevated"
        >
          Blog
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="mt-6 space-y-4">
        {loading && (
          <>
            <div className="h-32 animate-pulse rounded-[1.5rem] bg-bg-elevated" />
            <div className="h-16 animate-pulse rounded-2xl bg-bg-elevated" />
            <div className="h-16 animate-pulse rounded-2xl bg-bg-elevated" />
          </>
        )}

        {!loading && hasError && (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
            {locale === 'en'
              ? 'Unable to load the blog feed right now. Open the blog directly.'
              : '目前無法載入 blog 動態，先直接打開 blog 網站。'}
          </div>
        )}

        {!loading && !hasError && featuredPost && (
          <a
            href={featuredPost.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/post block overflow-hidden rounded-[1.5rem] border border-border bg-bg-surface/70 transition-colors hover:border-border-hover hover:bg-bg-elevated"
          >
            {featuredPost.feature_image && (
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={featuredPost.feature_image}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/post:scale-[1.03]"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-text-muted">
                  <Newspaper size={13} />
                  {formatDate(featuredPost.published_at)}
                </div>
                <ArrowUpRight size={16} className="text-text-muted" />
              </div>
              <div className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-text-main">
                {featuredPost.title}
              </div>
              {featuredPost.excerpt && (
                <div className="mt-2 line-clamp-3 text-xs leading-5 text-text-muted">
                  {featuredPost.excerpt}
                </div>
              )}
            </div>
          </a>
        )}

        {!loading &&
          !hasError &&
          morePosts.map((post) => (
            <a
              key={post.url}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-border bg-bg-surface/70 p-4 transition-colors hover:border-border-hover hover:bg-bg-elevated"
            >
              <div className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
                {formatDate(post.published_at)}
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-text-main">
                {post.title}
              </div>
            </a>
          ))}
      </div>
    </CardWrapper>
  );
};
