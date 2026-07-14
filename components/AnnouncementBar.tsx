import React from 'react';
import { ArrowUpRight, Megaphone } from 'lucide-react';
import announcement from '../data/announcement.json';

type AnnouncementData = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  body?: string;
  linkLabel?: string;
  link?: string;
};

export const AnnouncementBar: React.FC<{ data?: AnnouncementData }> = ({
  data = announcement,
}) => {
  if (!data.enabled || !data.title) return null;

  return (
    <aside
      aria-label={data.eyebrow || 'Announcement'}
      aria-live="polite"
      className="border border-primary/25 bg-[linear-gradient(105deg,var(--primary-glow),transparent_62%)] px-5 py-4 shadow-sm"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white dark:text-bg-base">
            <Megaphone size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
              {data.eyebrow || 'Announcement'}
            </div>
            <h2 className="mt-1 text-base font-black leading-6 text-text-main md:text-lg">
              {data.title}
            </h2>
            {data.body && <p className="mt-1 text-sm leading-6 text-text-muted">{data.body}</p>}
          </div>
        </div>

        {data.link && data.linkLabel && (
          <a
            href={data.link}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-text-main px-4 text-sm font-black text-text-main transition-colors hover:bg-text-main hover:text-bg-base md:self-center"
          >
            {data.linkLabel}
            <ArrowUpRight size={15} />
          </a>
        )}
      </div>
    </aside>
  );
};
