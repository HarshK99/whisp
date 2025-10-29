'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RecorderBar from '../components/RecorderBar';
import { dbManager } from '../lib/db';
import { Book, Note } from '../lib/types';

export default function Home() {
  const [currentBook, setCurrentBook] = useState<string>('');
  const [showBookPrompt, setShowBookPrompt] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [currentBookNotes, setCurrentBookNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (currentBook) {
      loadCurrentBookNotes();
    }
  }, [currentBook]);

  const initializeApp = async () => {
    try {
      await dbManager.initDB();
      
      // Load recent books
      const books = await dbManager.getAllBooks();
      setRecentBooks(books.slice(0, 3)); // Show top 3 recent books
      
      // Check for stored current book
      const stored = localStorage.getItem('currentBook');
      if (stored && books.find(book => book.title === stored)) {
        setCurrentBook(stored);
      } else if (books.length === 0) {
        // First run - show book prompt
        setShowBookPrompt(true);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentBookNotes = async () => {
    if (!currentBook) return;
    
    try {
      const notes = await dbManager.getNotesByBook(currentBook);
      setCurrentBookNotes(notes.slice(0, 3)); // Show last 3 notes
    } catch (error) {
      console.error('Failed to load current book notes:', error);
    }
  };

  const handleBookChange = () => {
    setShowBookPrompt(true);
  };

  const handleSelectExistingBook = async (bookTitle: string) => {
    setCurrentBook(bookTitle);
    localStorage.setItem('currentBook', bookTitle);
    await dbManager.updateBookLastUsed(bookTitle);
    setShowBookPrompt(false);
    
    // Load notes for the selected book
    try {
      const notes = await dbManager.getNotesByBook(bookTitle);
      setCurrentBookNotes(notes.slice(0, 3));
    } catch (error) {
      console.error('Failed to load current book notes:', error);
    }
  };

  const handleCreateNewBook = async () => {
    if (!newBookTitle.trim()) return;

    try {
      const book: Book = {
        title: newBookTitle.trim(),
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      await dbManager.saveBook(book);
      setCurrentBook(newBookTitle.trim());
      localStorage.setItem('currentBook', newBookTitle.trim());
      setNewBookTitle('');
      setShowBookPrompt(false);
      
      // Refresh recent books
      const books = await dbManager.getAllBooks();
      setRecentBooks(books.slice(0, 3));
      
      // Load notes for the new book (will be empty initially)
      setCurrentBookNotes([]);
    } catch (error) {
      console.error('Failed to create book:', error);
    }
  };

  const handleGoToBooks = () => {
    router.push('/books');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <div className="text-gray-600">Loading Whisp...</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Whisp</h1>
              <p className="text-sm text-gray-600 mt-1">Voice notes for your books</p>
            </div>
            <button
              onClick={handleGoToBooks}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
              Books
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8">
        {currentBook ? (
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
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Book</h2>
            <p className="text-gray-600 mb-8">Choose a book to start recording your voice notes</p>
            <button
              onClick={handleBookChange}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose Book
            </button>
          </div>
        )}

        {/* Recent Notes for Current Book */}
        {currentBook && currentBookNotes.length > 0 && (
          <div className="mt-12 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Notes</h3>
              <button
                onClick={() => router.push(`/books/${encodeURIComponent(currentBook)}`)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {currentBookNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <p className="text-gray-900 text-sm leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {note.text}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Book Selection Modal */}
      {showBookPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md max-h-96 flex flex-col">
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
                        onClick={() => handleSelectExistingBook(book.title)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{book.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Last used: {new Date(book.lastUsed).toLocaleDateString()}
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
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Enter book title..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewBook();
                    }
                  }}
                />
                <button
                  onClick={handleCreateNewBook}
                  disabled={!newBookTitle.trim()}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Create & Select
                </button>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={handleGoToBooks}
                className="flex-1 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Manage Books
              </button>
              {currentBook && (
                <button
                  onClick={() => setShowBookPrompt(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recorder Bar */}
      <RecorderBar 
        currentBook={currentBook} 
        onBookChange={handleBookChange}
        onNoteSaved={loadCurrentBookNotes}
      />
    </div>
  );
}

