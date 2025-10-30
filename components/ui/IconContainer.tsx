import React from 'react';

interface IconContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export default function IconContainer({
  size = 'md',
  variant = 'secondary',
  children,
  className = '',
}: IconContainerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const variantClasses = {
    primary: 'bg-blue-100 text-blue-600',
    secondary: 'bg-gray-200 text-gray-500',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
  };

  const classes = [
    'rounded-full flex items-center justify-center',
    sizeClasses[size],
    variantClasses[variant],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
}