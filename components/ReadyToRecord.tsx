'use client';

interface ReadyToRecordProps {
  currentBook: string;
}

export default function ReadyToRecord({ currentBook }: ReadyToRecordProps) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Record</h2>
      <p className="text-gray-600 mb-8">
        Recording notes for <span className="font-medium text-gray-900">"{currentBook}"</span>
      </p>
    </div>
  );
}