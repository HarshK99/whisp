import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: (e?: React.MouseEvent) => void;
  rounded?: 'default' | 'top' | 'bottom' | 'none';
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
  rounded = 'default',
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const roundedClasses = {
    default: 'rounded-xl',
    top: 'rounded-t-xl',
    bottom: 'rounded-b-xl',
    none: '',
  };

  const baseClasses = `bg-white ${roundedClasses[rounded]} shadow-sm border border-gray-200`;
  const hoverClasses = hover ? 'hover:shadow-md hover:border-gray-300 transition-all duration-200' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}