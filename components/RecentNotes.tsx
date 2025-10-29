'use client';

import { Note } from '../lib/types';
import NoteItem from './NoteItem';

interface RecentNotesProps {
  currentBook: string;
  notes: Note[];
  swipedNoteId: string | null;
  onSwipeStart: (e: React.TouchEvent, noteId: string) => void;
  onSwipeCancel: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onViewAll: () => void;
}

export default function RecentNotes({
  currentBook,
  notes,
  swipedNoteId,
  onSwipeStart,
  onSwipeCancel,
  onEdit,
  onDelete,
  onViewAll,
}: RecentNotesProps) {
  if (!currentBook || notes.length === 0) return null;

  return (
    <div className="mt-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Notes</h3>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </button>
      </div>
      <div className="space-y-3">
        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            swipedNoteId={swipedNoteId}
            onSwipeStart={onSwipeStart}
            onSwipeCancel={onSwipeCancel}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}