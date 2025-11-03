import React from 'react';

interface GradientHeaderProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'top' | 'bottom';
}

export default function GradientHeader({
  children,
  className = '',
  variant = 'top',
}: GradientHeaderProps) {
  const borderClass = variant === 'top' ? 'border-b' : 'border-t';
  const baseClasses = `bg-gradient-to-r from-blue-50 to-blue-100 ${borderClass} border-gray-200`;
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
}