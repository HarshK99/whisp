 'use client';

import { useState, useEffect, Suspense } from 'react';
import RecorderBar from '../components/RecorderBar';
import { useBookSelection } from '../components/BookSelectionProvider';
import { useRouter } from 'next/navigation';
import RecentNotes from '../components/RecentNotes';
import EditNoteModal from '../components/EditNoteModal';
import BookSelectionModal from '../components/BookSelectionModal';
import ReadyToRecord from '../components/ReadyToRecord';
import SelectBookPrompt from '../components/SelectBookPrompt';
import LoadingScreen from '../components/LoadingScreen';
import Header from '../components/Header';
import AuthModal from '../components/auth/AuthModal';
import NotificationHandler from '../components/NotificationHandler';
import { Alert } from '../components/ui';
import PageLayout from '../components/ui/PageLayout';
import { cloudDBManager } from '../lib/cloudDB';
import { Book, Note } from '../lib/types';
import { useAuth } from '../lib/auth';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [currentBook, setCurrentBook] = useState<string>('');
  const { showBookPrompt, setShowBookPrompt } = useBookSelection();
  const [newBookTitle, setNewBookTitle] = useState('');
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [currentBookNotes, setCurrentBookNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');
  const [swipedNoteId, setSwipedNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isNotesLoaded, setIsNotesLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Load saved current book on component mount
  useEffect(() => {
    const savedBook = localStorage.getItem('currentBook');
    if (savedBook) {
      setCurrentBook(savedBook);
    }
  }, []);

  useEffect(() => {
    if (user && !isInitialized) {
      const run = () => {
        // mark DB init as running
        initializeApp();
        // Reset cloudDBManager when user changes
        cloudDBManager.reset();
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const id = (window as any).requestIdleCallback(run, { timeout: 1000 });
        return () => (window as any).cancelIdleCallback(id);
      } else {
        const t = setTimeout(run, 500);
        return () => clearTimeout(t);
      }
    } else if (!user) {
      setIsLoading(false);
    }
  }, [user, isInitialized]);

  // input focus is handled inside the RecorderBar component

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      await cloudDBManager.initDB();
      
      // Load recent books
      const books = await cloudDBManager.getAllBooks();
      
      let finalCurrentBook = '';
      
      // If no books exist, create a default "My Thoughts" book
      if (books.length === 0) {
        const defaultBook = {
          id: crypto.randomUUID(),
          title: 'My Thoughts',
          createdAt: new Date(),
          lastUsed: new Date(),
        };
        
        await cloudDBManager.saveBook(defaultBook);
        setRecentBooks([defaultBook]);
        
        // Only set current book if none is already set from localStorage
        if (!currentBook) {
          finalCurrentBook = 'My Thoughts';
          setCurrentBook('My Thoughts');
          localStorage.setItem('currentBook', 'My Thoughts');
        } else {
          finalCurrentBook = currentBook;
        }
      } else {
        setRecentBooks(books);
        
        // Check if the saved current book still exists in the books list
        const savedBook = currentBook || localStorage.getItem('currentBook');
        const bookExists = books.some(book => book.title === savedBook);
        
        if (savedBook && bookExists) {
          // Keep the saved book and update its last used time
          finalCurrentBook = savedBook;
          setCurrentBook(savedBook);
          await cloudDBManager.updateBookLastUsed(savedBook);
        } else {
          // Fall back to most recent book if saved book doesn't exist
          finalCurrentBook = books[0].title;
          setCurrentBook(books[0].title);
          localStorage.setItem('currentBook', books[0].title);
        }
      }
      
      // Load notes for the final current book immediately
      if (finalCurrentBook) {
        const notes = await cloudDBManager.getNotesByBook(finalCurrentBook);
        setCurrentBookNotes(notes.slice(0, 10));
        setIsNotesLoaded(true);
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const handleConfirmation = (message: string) => {
    setConfirmationMessage(message);
    setTimeout(() => setConfirmationMessage(''), 5000);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 8000);
  };

  const loadCurrentBookNotes = async () => {
    if (!currentBook) return;
    
    try {
      const notes = await cloudDBManager.getNotesByBook(currentBook);
      setCurrentBookNotes(notes.slice(0, 10)); // Show last 10 notes
      setIsNotesLoaded(true);
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
      setCurrentBookNotes(notes.slice(0, 10));
      setIsNotesLoaded(true);
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
      setIsNotesLoaded(true);
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

    const updatedNote: Note = {
      ...editingNote,
      text: editText.trim(),
    };

    try {
      // Optimistic update - update UI immediately
      setCurrentBookNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === updatedNote.id ? updatedNote : note
        )
      );
      
      // Close modal immediately for better UX
      setEditingNote(null);
      setEditText('');
      
      // Update in database
      await cloudDBManager.updateNote(updatedNote);
      
    } catch (error) {
      console.error('Failed to update note:', error);
      // Revert optimistic update on error
      await loadCurrentBookNotes();
      // Show error to user
      setErrorMessage('Failed to save changes. Please try again.');
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

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthModal />;
  }

  // Allow initial render even while initialization runs in the background

  return (
    <PageLayout>
      {/* URL Parameter Handler */}
      <Suspense fallback={null}>
        <NotificationHandler 
          onConfirmation={handleConfirmation}
          onError={handleError}
        />
      </Suspense>

  {/* Header */}
  <Header />

      {/* Top input was moved to a bottom-fixed bar so it behaves like the previous recorder */}

      {/* Confirmation Message */}
      {confirmationMessage && (
        <div className="mx-4 mt-4">
          <Alert 
            variant="success"
            onClose={() => setConfirmationMessage('')}
          >
            {confirmationMessage}
          </Alert>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-4 mt-4">
          <Alert 
            variant="error"
            onClose={() => setErrorMessage('')}
          >
            {errorMessage}
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-6 pb-28">
        {currentBook ? (
          <>
            {/* Show Ready to Record only when notes are loaded and there are none */}
            {isNotesLoaded && currentBookNotes.length === 0 && (
              <ReadyToRecord currentBook={currentBook} />
            )}
          </>
        ) : (
          <SelectBookPrompt onBookChange={handleBookChange} />
        )}

        {/* Recent Notes for Current Book */}
        {currentBook && isInitialized && (
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
        )}
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

      {/* Bottom input/recorder bar (component) */}
      <RecorderBar
        currentBook={currentBook}
        onBookChange={handleBookChange}
        onNoteSaved={async () => {
          await loadCurrentBookNotes();
          handleConfirmation('Note saved');
        }}
        voice={false}
      />
    </PageLayout>
  );
}

