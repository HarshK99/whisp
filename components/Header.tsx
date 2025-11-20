'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GradientHeader } from './ui';
import UserProfile from './auth/UserProfile';

interface HeaderProps {}

export default function Header(_: HeaderProps) {
  const [currentBook, setCurrentBook] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('currentBook');
      if (saved) setCurrentBook(saved);
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <GradientHeader>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Whisp</h1>
            <p className="text-sm text-gray-600 mt-1">Voice notes for your books</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/books" className="inline-flex items-center px-3 py-2 rounded-md border bg-white text-sm font-medium shadow-sm hover:bg-gray-50">
              Books
              
            </Link>
            <UserProfile />
          </div>
        </div>
      </div>
    </GradientHeader>
  );
}