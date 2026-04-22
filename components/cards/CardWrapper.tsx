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
        rounded-3xl 
        border border-black/[0.05] dark:border-white/[0.05] 
        shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
        dark:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.3),0_10px_20px_-2px_rgba(0,0,0,0.2)]
        hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]
        dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.4),0_10px_10px_-5px_rgba(0,0,0,0.3)]
        transition-all duration-500 ease-out
        h-full flex flex-col 
        relative overflow-hidden
        ${noPadding ? '' : 'p-6 md:p-8'}
        ${onClick ? 'cursor-pointer group hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};