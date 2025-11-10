'use client';

import { GradientHeader } from './ui';
import UserProfile from './auth/UserProfile';

interface HeaderProps {}

export default function Header(_: HeaderProps) {
  return (
    <GradientHeader>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Whisp</h1>
            <p className="text-sm text-gray-600 mt-1">Voice notes for your books</p>
          </div>
          <div className="flex items-center space-x-4">
            <UserProfile />
          </div>
        </div>
      </div>
    </GradientHeader>
  );
}