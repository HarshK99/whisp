import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function PageLayout({
  children,
  className = '',
  padding = true,
}: PageLayoutProps) {
  const classes = [
    'min-h-screen bg-gray-50 flex flex-col',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Main content area that grows and has bottom padding for recorder */}
      <div className={`flex-1 ${padding ? 'pb-28' : ''}`}>
        {children}
      </div>
    </div>
  );
}