'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface NotificationHandlerProps {
  onConfirmation: (message: string) => void;
  onError: (message: string) => void;
}

export default function NotificationHandler({ onConfirmation, onError }: NotificationHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle email confirmation and error messages from URL
    const confirmed = searchParams.get('confirmed');
    const error = searchParams.get('error');
    
    if (confirmed === 'true') {
      onConfirmation('Email confirmed successfully! You are now signed in.');
      // Clear the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('confirmed');
      window.history.replaceState({}, '', newUrl.pathname);
    }
    
    if (error) {
      onError(decodeURIComponent(error));
      // Clear the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.pathname);
    }
  }, [searchParams, onConfirmation, onError]);

  return null;
}