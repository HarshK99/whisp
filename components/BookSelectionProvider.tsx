"use client";

import React, { createContext, useContext, useState } from 'react';

type BookSelectionContextType = {
  showBookPrompt: boolean;
  setShowBookPrompt: (v: boolean) => void;
};

const BookSelectionContext = createContext<BookSelectionContextType | null>(null);

export const BookSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showBookPrompt, setShowBookPrompt] = useState(false);
  return (
    <BookSelectionContext.Provider value={{ showBookPrompt, setShowBookPrompt }}>
      {children}
    </BookSelectionContext.Provider>
  );
};

export const useBookSelection = () => {
  const ctx = useContext(BookSelectionContext);
  if (!ctx) throw new Error('useBookSelection must be used within BookSelectionProvider');
  return ctx;
};

export default BookSelectionProvider;
