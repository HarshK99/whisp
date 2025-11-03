import React from 'react';
import { Card, GradientHeader } from './';

interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxHeight?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxHeight = 'max-h-96',
}: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-gray-50/90 to-white/95 backdrop-blur-sm flex items-end z-[60]">
      {/* Backdrop to close */}
      {onClose && (
        <div
          className="absolute inset-0"
          onClick={onClose}
        />
      )}
      
      {/* Bottom sheet content */}
      <Card 
        className={`w-full ${maxHeight} flex flex-col mb-20 shadow-xl border-0 animate-slide-up`} 
        padding="none" 
        rounded="top"
      >
        <GradientHeader>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </GradientHeader>
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        {actions && (
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            {actions}
          </div>
        )}
      </Card>
    </div>
  );
}