import React from 'react';
import { ConciergeBell } from 'lucide-react';
import type { Locale } from '../types';

export interface FloatingConciergeButtonProps {
  locale: Locale;
  onClick: () => void;
  isOpen?: boolean;
}

export const FloatingConciergeButton: React.FC<FloatingConciergeButtonProps> = ({
  locale,
  onClick,
  isOpen = false,
}) => {
  if (isOpen) {
    return null;
  }

  const label = locale === 'en' ? "David's Concierge" : 'David 的小秘書';
  const onlineStatusText = locale === 'en' ? 'Online Concierge' : '小秘書在線接待中';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center rounded-full border border-[#d6bc7c]/40 bg-[#17324d] text-[#ffb010] shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb010] focus-visible:ring-offset-2 h-12 w-12 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5 sm:gap-2.5 group touch-manipulation"
    >
      <span className="relative flex items-center justify-center">
        <ConciergeBell className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
        {/* Pulsing indicator on mobile */}
        <span
          className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:hidden"
          title={onlineStatusText}
        >
          <span className="absolute inline-flex h-full w-full animate-ping motion-reduce:animate-none rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </span>

      {/* Label on sm and larger screens */}
      <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap tracking-wide">
        {label}
      </span>

      {/* Online indicator on sm and larger screens */}
      <span
        className="hidden sm:flex relative h-2.5 w-2.5 shrink-0 items-center justify-center"
        title={onlineStatusText}
        aria-hidden="true"
      >
        <span className="absolute inline-flex h-full w-full animate-ping motion-reduce:animate-none rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
    </button>
  );
};

export default FloatingConciergeButton;
