'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RecorderBar from '../components/RecorderBar';
import RecentNotes from '../components/RecentNotes';
import EditNoteModal from '../components/EditNoteModal';
import BookSelectionModal from '../components/BookSelectionModal';
import ReadyToRecord from '../components/ReadyToRecord';
import SelectBookPrompt from '../components/SelectBookPrompt';
import LoadingScreen from '../components/LoadingScreen';
import Header from '../components/Header';
import AuthModal from '../components/auth/AuthModal';
import { cloudDBManager } from '../lib/cloudDB';
import { Book, Note } from '../lib/types';
import { useAuth } from '../lib/auth';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [currentBook, setCurrentBook] = useState<string>('');
  const [showBookPrompt, setShowBookPrompt] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [currentBookNotes, setCurrentBookNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');
  const [swipedNoteId, setSwipedNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationMessage, setConfirmationMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      initializeApp();
      // Reset cloudDBManager when user changes
      cloudDBManager.reset();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (currentBook && user) {
      loadCurrentBookNotes();
    }
  }, [currentBook, user]);

  useEffect(() => {
    // Handle email confirmation and error messages from URL
    const confirmed = searchParams.get('confirmed');
    const error = searchParams.get('error');
    
    if (confirmed === 'true') {
      setConfirmationMessage('Email confirmed successfully! You are now signed in.');
      // Clear the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('confirmed');
      window.history.replaceState({}, '', newUrl.pathname);
      
      // Clear message after 5 seconds
      setTimeout(() => setConfirmationMessage(''), 5000);
    }
    
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      // Clear the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.pathname);
      
      // Clear message after 8 seconds
      setTimeout(() => setErrorMessage(''), 8000);
    }
  }, [searchParams]);

  const initializeApp = async () => {
    try {
      await cloudDBManager.initDB();
      
      // Load recent books
      const books = await cloudDBManager.getAllBooks();
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
      const notes = await cloudDBManager.getNotesByBook(currentBook);
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
    await cloudDBManager.updateBookLastUsed(bookTitle);
    setShowBookPrompt(false);
    
    // Load notes for the selected book
    try {
      const notes = await cloudDBManager.getNotesByBook(bookTitle);
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

      await cloudDBManager.saveBook(book);
      setCurrentBook(newBookTitle.trim());
      localStorage.setItem('currentBook', newBookTitle.trim());
      setNewBookTitle('');
      setShowBookPrompt(false);
      
      // Refresh recent books
      const books = await cloudDBManager.getAllBooks();
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
      
      await cloudDBManager.updateNote(updatedNote);
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
      await cloudDBManager.deleteNote(noteId);
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <Header onGoToBooks={handleGoToBooks} />

      {/* Confirmation Message */}
      {confirmationMessage && (
        <div className="mx-4 mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {confirmationMessage}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-4 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-6">
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

