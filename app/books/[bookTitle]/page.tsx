'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Note } from '../../../lib/types';
import { cloudDBManager } from '../../../lib/cloudDB';
import { useAuth } from '../../../lib/auth';
import AuthModal from '../../../components/auth/AuthModal';
import LoadingScreen from '../../../components/LoadingScreen';
import NoteItem from '../../../components/NoteItem';
import EditNoteModal from '../../../components/EditNoteModal';
import { PageHeader } from '../../../components/ui';

export default function BookNotesPage() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');
  const [swipedNoteId, setSwipedNoteId] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  
  const bookTitle = decodeURIComponent(params.bookTitle as string);

  useEffect(() => {
    if (user && bookTitle) {
      loadNotes();
      cloudDBManager.reset();
    } else {
      setIsLoading(false);
    }
  }, [user, bookTitle]);

  const loadNotes = async () => {
    try {
      await cloudDBManager.initDB();
      const bookNotes = await cloudDBManager.getNotesByBook(bookTitle);
      setNotes(bookNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
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
      setNotes(prevNotes => 
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
      await loadNotes();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await cloudDBManager.deleteNote(noteId);
      await loadNotes();
      setSwipedNoteId(null); // Reset swipe state after deletion
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleSwipeStart = (e: React.TouchEvent, noteId: string) => {
    setSwipedNoteId(noteId);
  };

  const handleSwipeCancel = () => {
    setSwipedNoteId(null);
  };

  const handleSelectBook = () => {
    localStorage.setItem('currentBook', bookTitle);
    router.push('/');
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
        title={bookTitle}
        subtitle={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
        leftAction={{
          icon: (
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z"/>
            </svg>
          ),
          label: "Books",
          onClick: () => router.push('/books'),
        }}
        rightAction={{
          label: "Select & Record",
          onClick: handleSelectBook,
        }}
      />

      {/* Notes List */}
      <div className="px-4 py-6">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes Yet</h3>
            <p className="text-gray-600 mb-6">Start recording to add your first note for this book</p>
            <button
              onClick={handleSelectBook}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Recording
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                swipedNoteId={swipedNoteId}
                onSwipeStart={handleSwipeStart}
                onSwipeCancel={handleSwipeCancel}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                showTimestamp={true}
              />
            ))}
          </div>
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
    </div>
  );
}