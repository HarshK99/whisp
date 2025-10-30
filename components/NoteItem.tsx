'use client';

import { Note } from '../lib/types';
import { useState, useRef } from 'react';
import { IconButton } from './ui';

interface NoteItemProps {
  note: Note;
  swipedNoteId: string | null;
  onSwipeStart: (e: React.TouchEvent, noteId: string) => void;
  onSwipeCancel: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  showTimestamp?: boolean; // Optional prop to control timestamp display
}

export default function NoteItem({
  note,
  swipedNoteId,
  onSwipeStart,
  onSwipeCancel,
  onEdit,
  onDelete,
  showTimestamp = false, // Default to false (don't show timestamp)
}: NoteItemProps) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const diffX = Math.abs(touchStartRef.current.x - touch.clientX);
    const diffY = Math.abs(touchStartRef.current.y - touch.clientY);
    
    // If significant horizontal movement, it's a swipe
    if (diffX > 10 || diffY > 10) {
      setIsDragging(true);
      // Only trigger swipe for horizontal movement
      if (diffX > diffY && diffX > 50) {
        onSwipeStart(e, note.id);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const timeDiff = Date.now() - touchStartRef.current.time;
    
    // If it was a quick tap without dragging, treat as click
    if (!isDragging && timeDiff < 300) {
      handleNoteClick();
    }
    setIsDragging(false);
  };

  const handleNoteClick = () => {
    // If note is swiped, cancel the swipe instead of editing
    if (swipedNoteId === note.id) {
      onSwipeCancel();
    } else {
      // Edit the note when clicked
      onEdit(note);
    }
  };

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border border-gray-200 transition-transform duration-200 cursor-pointer hover:shadow-md hover:border-gray-300 ${
        swipedNoteId === note.id ? '-translate-x-20' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleNoteClick}
    >
      <div className="p-4 flex items-start justify-between">
        <div className="flex-1 mr-3">
          <p className="text-gray-900 text-sm leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {note.text}
          </p>
          {showTimestamp && (
            <div className="mt-2 text-xs text-gray-500">
              {new Date(note.createdAt).toLocaleString()}
            </div>
          )}
        </div>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
          aria-label="Edit note"
          className="flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </IconButton>
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