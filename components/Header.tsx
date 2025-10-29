'use client';

import UserProfile from './auth/UserProfile';

interface HeaderProps {
  onGoToBooks: () => void;
}

export default function Header({ onGoToBooks }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Whisp</h1>
            <p className="text-sm text-gray-600 mt-1">Voice notes for your books</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onGoToBooks}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
              Books
            </button>
            
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
}