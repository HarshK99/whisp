import React, { useEffect, useState } from 'react';
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    let initialHeight = window.innerHeight;

    // Function to handle viewport changes (keyboard events)
    const handleViewportChange = () => {
      if (typeof window !== 'undefined') {
        // Use visualViewport if available (more accurate for keyboard detection)
        if (window.visualViewport) {
          const keyboardHeight = Math.max(0, initialHeight - window.visualViewport.height);
          setKeyboardHeight(keyboardHeight);
        } else {
          // Fallback: detect significant height changes that indicate keyboard
          const currentHeight = window.innerHeight;
          const heightDiff = initialHeight - currentHeight;
          // Only consider it a keyboard if the height difference is significant (> 150px)
          const keyboardHeight = heightDiff > 150 ? heightDiff : 0;
          setKeyboardHeight(keyboardHeight);
        }
      }
    };

    // Set initial state
    handleViewportChange();

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      // Fallback for browsers without visualViewport
      window.addEventListener('resize', handleViewportChange);
      // Also listen for orientationchange which can affect keyboard
      window.addEventListener('orientationchange', () => {
        setTimeout(handleViewportChange, 500); // Delay to allow orientation change to complete
      });
    }

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleViewportChange);
      }
      setKeyboardHeight(0);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate bottom margin: 5rem for recorder bar + keyboard height + safe area
  const bottomMargin = keyboardHeight > 0 
    ? `max(${80 + keyboardHeight}px, calc(5rem + env(safe-area-inset-bottom)))` // 80px = 5rem (recorder bar) + keyboard height
    : 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))'; // Default 5rem + safe area when no keyboard

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-gray-50/90 to-white/95 backdrop-blur-sm flex items-end z-[60]">
      {/* Backdrop to close */}
      {onClose && (
        <div
          className="absolute inset-0"
          onClick={onClose}
        />
      )}
      
      {/* Bottom sheet content with dynamic margin */}
      <div 
        className="w-full animate-slide-up"
        style={{ marginBottom: bottomMargin }}
      >
        <Card 
          className={`w-full ${maxHeight} flex flex-col shadow-xl border-0`}
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
    </div>
  );
}