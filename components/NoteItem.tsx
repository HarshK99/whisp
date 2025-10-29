'use client';

import { Note } from '../lib/types';
import { useState } from 'react';

interface NoteItemProps {
  note: Note;
  swipedNoteId: string | null;
  onSwipeStart: (e: React.TouchEvent, noteId: string) => void;
  onSwipeCancel: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export default function NoteItem({
  note,
  swipedNoteId,
  onSwipeStart,
  onSwipeCancel,
  onEdit,
  onDelete,
}: NoteItemProps) {
  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border border-gray-200 transition-transform duration-200 ${
        swipedNoteId === note.id ? '-translate-x-20' : ''
      }`}
      onTouchStart={(e) => onSwipeStart(e, note.id)}
      onClick={() => swipedNoteId === note.id && onSwipeCancel()}
    >
      <div className="p-4 flex items-start justify-between">
        <p className="text-gray-900 text-sm leading-relaxed overflow-hidden flex-1 mr-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {note.text}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
      </div>
      
      {/* Delete button that appears on swipe */}
      {swipedNoteId === note.id && (
        <div className="absolute right-0 top-0 h-full flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="bg-red-500 text-white px-4 h-full rounded-r-xl hover:bg-red-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}