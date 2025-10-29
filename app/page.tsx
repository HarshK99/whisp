'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RecorderBar from '../components/RecorderBar';
import RecentNotes from '../components/RecentNotes';
import EditNoteModal from '../components/EditNoteModal';
import BookSelectionModal from '../components/BookSelectionModal';
import ReadyToRecord from '../components/ReadyToRecord';
import SelectBookPrompt from '../components/SelectBookPrompt';
import { dbManager } from '../lib/db';
import { Book, Note } from '../lib/types';

export default function Home() {
  const [currentBook, setCurrentBook] = useState<string>('');
  const [showBookPrompt, setShowBookPrompt] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [currentBookNotes, setCurrentBookNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');
  const [swipedNoteId, setSwipedNoteId] = useState<string | null>(null);
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

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditText(note.text);
  };

  const handleSaveEdit = async () => {
    if (!editingNote || !editText.trim()) return;

    try {
      const updatedNote: Note = {
        ...editingNote,
        text: editText.trim(),
      };
      
      await dbManager.updateNote(updatedNote);
      await loadCurrentBookNotes();
      setEditingNote(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await dbManager.deleteNote(noteId);
      await loadCurrentBookNotes();
      setSwipedNoteId(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleSwipeStart = (e: React.TouchEvent, noteId: string) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleSwipeMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const diffX = startX - currentTouch.clientX;
      
      if (diffX > 50) { // Swipe threshold
        setSwipedNoteId(noteId);
        document.removeEventListener('touchmove', handleSwipeMove);
        document.removeEventListener('touchend', handleSwipeEnd);
      }
    };
    
    const handleSwipeEnd = () => {
      document.removeEventListener('touchmove', handleSwipeMove);
      document.removeEventListener('touchend', handleSwipeEnd);
    };
    
    document.addEventListener('touchmove', handleSwipeMove);
    document.addEventListener('touchend', handleSwipeEnd);
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
          <>
            {/* Show Ready to Record only when no notes exist */}
            {currentBookNotes.length === 0 && (
              <ReadyToRecord currentBook={currentBook} />
            )}
          </>
        ) : (
          <SelectBookPrompt onBookChange={handleBookChange} />
        )}

        {/* Recent Notes for Current Book */}
        <RecentNotes
          currentBook={currentBook}
          notes={currentBookNotes}
          swipedNoteId={swipedNoteId}
          onSwipeStart={handleSwipeStart}
          onSwipeCancel={() => setSwipedNoteId(null)}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          onViewAll={() => router.push(`/books/${encodeURIComponent(currentBook)}`)}
        />
      </div>

      {/* Edit Note Modal */}
      <EditNoteModal
        note={editingNote}
        editText={editText}
        onEditTextChange={setEditText}
        onSave={handleSaveEdit}
        onCancel={() => {
          setEditingNote(null);
          setEditText('');
        }}
      />

      {/* Book Selection Modal */}
      <BookSelectionModal
        show={showBookPrompt}
        recentBooks={recentBooks}
        newBookTitle={newBookTitle}
        onNewBookTitleChange={setNewBookTitle}
        onSelectExistingBook={handleSelectExistingBook}
        onCreateNewBook={handleCreateNewBook}
        onGoToBooks={handleGoToBooks}
        onClose={() => setShowBookPrompt(false)}
        hasCurrentBook={!!currentBook}
      />

      {/* Recorder Bar */}
      <RecorderBar 
        currentBook={currentBook} 
        onBookChange={handleBookChange}
        onNoteSaved={loadCurrentBookNotes}
      />
    </div>
  );
}

