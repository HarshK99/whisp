'use client';

import { useState, useEffect } from 'react';
import { Book } from '../../lib/types';
import { cloudDBManager } from '../../lib/cloudDB';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import AuthModal from '../../components/auth/AuthModal';
import LoadingScreen from '../../components/LoadingScreen';
import { formatDate } from '../../lib/dateUtils';
import { PageHeader, Card, ModalOverlay } from '../../components/ui';

export default function BooksPage() {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadBooks();
      cloudDBManager.reset();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadBooks = async () => {
    try {
      await cloudDBManager.initDB();
      const allBooks = await cloudDBManager.getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!newBookTitle.trim()) return;

    try {
      const book: Book = {
        title: newBookTitle.trim(),
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      await cloudDBManager.saveBook(book);
      await loadBooks();
      setNewBookTitle('');
      setShowAddBook(false);
    } catch (error) {
      console.error('Failed to add book:', error);
    }
  };

  const handleSelectBook = async (bookTitle: string) => {
    try {
      await cloudDBManager.updateBookLastUsed(bookTitle);
      localStorage.setItem('currentBook', bookTitle);
      router.push('/');
    } catch (error) {
      console.error('Failed to select book:', error);
    }
  };

  const handleViewNotes = (bookTitle: string) => {
    router.push(`/books/${encodeURIComponent(bookTitle)}`);
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthModal />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Books"
        leftAction={{
          icon: (
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z"/>
            </svg>
          ),
          label: "Back to Record",
          onClick: () => router.push('/'),
        }}
        rightAction={{
          icon: (
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          ),
          label: "Add",
          onClick: () => setShowAddBook(true),
        }}
      />

      {/* Books List */}
      <div className="px-4 py-6">
        {books.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Books Yet</h3>
            <p className="text-gray-600 mb-6">Add your first book to start recording notes</p>
            <button
              onClick={() => setShowAddBook(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Book
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <Card key={book.title} hover>
                <button
                  type="button"
                  onClick={() => handleSelectBook(book.title)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-lg">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Last used: {formatDate(book.lastUsed)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewNotes(book.title);
                        }}
                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Notes
                      </button>
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      <ModalOverlay 
        isOpen={showAddBook} 
        onClose={() => {
          setShowAddBook(false);
          setNewBookTitle('');
        }}
      >
        <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl" padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Book
          </h3>
          <input
            type="text"
            value={newBookTitle}
            onChange={(e) => setNewBookTitle(e.target.value)}
            placeholder="Enter book title..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddBook();
              } else if (e.key === 'Escape') {
                setShowAddBook(false);
              }
            }}
          />
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowAddBook(false);
                setNewBookTitle('');
              }}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBook}
              disabled={!newBookTitle.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Book
            </button>
          </div>
        </Card>
      </ModalOverlay>
    </div>
  );
}