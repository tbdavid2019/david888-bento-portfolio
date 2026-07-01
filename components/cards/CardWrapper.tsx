import React from 'react';

interface CardWrapperProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({ children, className = '', onClick, noPadding = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white dark:bg-card-dark/92
        rounded-2xl
        border border-slate-200/80 dark:border-white/[0.08]
        shadow-sm
        dark:shadow-[0_18px_45px_-34px_rgba(2,6,23,0.9)]
        transition-all duration-500 ease-out
        h-full flex flex-col
        relative overflow-hidden
        backdrop-blur-xl
        ${noPadding ? '' : 'p-6 md:p-8'}
        ${onClick ? 'cursor-pointer group hover:-translate-y-1 hover:shadow-md dark:hover:shadow-[0_24px_60px_-36px_rgba(2,6,23,0.95)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
