'use client';

import { Book } from '../lib/types';
import { formatDate } from '../lib/dateUtils';
import { ModalOverlay, Card } from './ui';

interface BookSelectionModalProps {
  show: boolean;
  recentBooks: Book[];
  newBookTitle: string;
  onNewBookTitleChange: (title: string) => void;
  onSelectExistingBook: (bookTitle: string) => void;
  onCreateNewBook: () => void;
  onGoToBooks: () => void;
  onClose: () => void;
  hasCurrentBook: boolean;
}

export default function BookSelectionModal({
  show,
  recentBooks,
  newBookTitle,
  onNewBookTitleChange,
  onSelectExistingBook,
  onCreateNewBook,
  onGoToBooks,
  onClose,
  hasCurrentBook,
}: BookSelectionModalProps) {
  if (!show) return null;

  return (
    <ModalOverlay isOpen={show} onClose={hasCurrentBook ? onClose : undefined}>
      <Card className="w-full max-w-md max-h-96 flex flex-col" padding="none">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Select or Add Book</h3>
          <p className="text-sm text-gray-600 mt-1">Choose a book to record notes for</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Recent Books */}
          {recentBooks.length > 0 && (
            <div className="p-6 border-b">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Books</h4>
              <div className="space-y-2">
                {recentBooks.map((book) => (
                  <button
                    key={book.title}
                    onClick={() => onSelectExistingBook(book.title)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{book.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Last used: {formatDate(book.lastUsed)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add New Book */}
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Book</h4>
            <input
              type="text"
              value={newBookTitle}
              onChange={(e) => onNewBookTitleChange(e.target.value)}
              placeholder="Enter book title..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onCreateNewBook();
                }
              }}
            />
            <button
              onClick={onCreateNewBook}
              disabled={!newBookTitle.trim()}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Create & Select
            </button>
          </div>
        </div>

        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onGoToBooks}
            className="flex-1 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Manage Books
          </button>
          {hasCurrentBook && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            )}
        </div>
      </Card>
    </ModalOverlay>
  );
}