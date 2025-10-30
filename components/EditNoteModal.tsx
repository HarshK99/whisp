'use client';

import { Note } from '../lib/types';
import { Button } from './ui';

interface EditNoteModalProps {
  note: Note | null;
  editText: string;
  onEditTextChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditNoteModal({
  note,
  editText,
  onEditTextChange,
  onSave,
  onCancel,
}: EditNoteModalProps) {
  if (!note) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-[60]">
      <div className="bg-white rounded-t-xl w-full max-h-96 flex flex-col mb-20">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Edit Note</h3>
          <p className="text-sm text-gray-600">
            {new Date(note.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex-1 p-4">
          <textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Edit your note..."
            autoFocus
          />
        </div>
        <div className="p-4 border-t flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!editText.trim()}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}