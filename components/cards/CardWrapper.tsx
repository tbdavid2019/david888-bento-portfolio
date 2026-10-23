import React from 'react';
import { cn } from '../../lib/utils';

interface CardWrapperProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  children,
  className = '',
  onClick,
  noPadding = false,
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'dossier-card group relative flex h-full flex-col overflow-hidden transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17324d]',
        !noPadding && 'p-5 sm:p-6',
        onClick &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-[#17324d] dark:hover:border-[#ffb010]',
        className,
      )}
    >
      <div className="relative z-10 flex h-full flex-col min-w-0">{children}</div>
    </div>
  );
};
