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
        bg-card-light/92 dark:bg-card-dark/92
        rounded-[2rem]
        border border-black/[0.05] dark:border-white/[0.08]
        shadow-[0_24px_60px_-40px_rgba(15,23,42,0.34)]
        dark:shadow-[0_24px_60px_-40px_rgba(2,6,23,0.8)]
        transition-all duration-500 ease-out
        h-full flex flex-col
        relative overflow-hidden
        backdrop-blur-xl
        ${noPadding ? '' : 'p-6 md:p-8'}
        ${onClick ? 'cursor-pointer group hover:-translate-y-1.5 hover:shadow-[0_28px_80px_-42px_rgba(15,23,42,0.4)] dark:hover:shadow-[0_28px_80px_-42px_rgba(2,6,23,0.95)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
