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
  const [liveData, setLiveData] = React.useState<AnnouncementData>(data);

  React.useEffect(() => {
    let active = true;
    void import('../lib/crm')
      .then(({ loadHomepageAnnouncement }) => loadHomepageAnnouncement())
      .then((remote) => {
        if (active && remote) setLiveData(remote);
      })
      .catch(() => {
        // The static JSON remains the offline fallback when Firebase is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!liveData.enabled || !liveData.title) return null;

  return (
    <aside
      aria-label={liveData.eyebrow || 'Announcement'}
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
              {liveData.eyebrow || 'Announcement'}
            </div>
            <h2 className="mt-1 text-base font-black leading-6 text-text-main md:text-lg">
              {liveData.title}
            </h2>
            {liveData.body && <p className="mt-1 text-sm leading-6 text-text-muted">{liveData.body}</p>}
          </div>
        </div>

        {liveData.link && liveData.linkLabel && (
          <a
            href={liveData.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-text-main px-4 text-sm font-black text-text-main transition-colors hover:bg-text-main hover:text-bg-base md:self-center"
          >
            {liveData.linkLabel}
            <ArrowUpRight size={15} />
          </a>
        )}
      </div>
    </aside>
  );
};
