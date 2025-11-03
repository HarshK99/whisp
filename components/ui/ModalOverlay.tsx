import React from 'react';

interface ModalOverlayProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export default function ModalOverlay({
  children,
  isOpen,
  onClose,
  className = '',
}: ModalOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-gray-50/90 to-white/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Backdrop to close modal */}
      {onClose && (
        <div
          className="absolute inset-0"
          onClick={onClose}
        />
      )}
      
      {/* Modal content */}
      <div className={`relative ${className}`}>
        {children}
      </div>
    </div>
  );
}