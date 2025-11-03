'use client';

import { useState, useRef, useEffect } from 'react';
import { Note } from '../lib/types';
import { Button, BottomSheet } from './ui';
import { formatDateTime } from '../lib/dateUtils';

interface EditNoteModalProps {
  note: Note | null;
  editText: string;
  onEditTextChange: (text: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EditNoteModal({
  note,
  editText,
  onEditTextChange,
  onSave,
  onCancel,
  isLoading = false,
}: EditNoteModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && note) {
      const textarea = textareaRef.current;
      textarea.focus();
      // Set cursor position to the end
      const length = editText.length;
      textarea.setSelectionRange(length, length);
    }
  }, [note, editText]);

  const handleSave = async () => {
    if (!editText.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSaving) return; // Prevent cancel during save
    onCancel();
  };

  if (!note) return null;

  return (
    <BottomSheet
      isOpen={!!note}
      title="Edit Note"
      subtitle={formatDateTime(note.createdAt)}
      actions={
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!editText.trim() || isSaving}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      }
    >
      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => onEditTextChange(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Edit your note..."
        />
      </div>
    </BottomSheet>
  );
}