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
    'min-h-screen bg-gray-50',
    padding ? 'pb-24' : '', // Space for recorder bar
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
}