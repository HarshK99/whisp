import React from 'react';
import GradientHeader from './GradientHeader';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  };
  rightAction?: {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  children,
}: PageHeaderProps) {
  return (
    <GradientHeader>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left section */}
          {leftAction ? (
            <button
              onClick={leftAction.onClick}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              {leftAction.icon}
              {leftAction.label}
            </button>
          ) : (
            <div>
              {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          )}

          {/* Center title for left action layouts */}
          {leftAction && title && (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          )}

          {/* Right section */}
          {rightAction && (
            <button
              onClick={rightAction.onClick}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              {rightAction.icon}
              {rightAction.label}
            </button>
          )}
        </div>
        
        {/* Custom content */}
        {children}
      </div>
    </GradientHeader>
  );
}