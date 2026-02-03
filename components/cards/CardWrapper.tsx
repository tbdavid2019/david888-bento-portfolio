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
        bg-card-light dark:bg-card-dark 
        rounded-2xl 
        border border-slate-200/60 dark:border-slate-700/50 
        shadow-sm hover:shadow-md 
        transition-all duration-300 
        h-full flex flex-col 
        relative overflow-hidden
        ${noPadding ? '' : 'p-6 md:p-8'}
        ${onClick ? 'cursor-pointer group' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};