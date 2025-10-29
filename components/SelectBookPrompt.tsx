'use client';

interface SelectBookPromptProps {
  onBookChange: () => void;
}

export default function SelectBookPrompt({ onBookChange }: SelectBookPromptProps) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Book</h2>
      <p className="text-gray-600 mb-8">Choose a book to start recording your voice notes</p>
      <button
        onClick={onBookChange}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Choose Book
      </button>
    </div>
  );
}