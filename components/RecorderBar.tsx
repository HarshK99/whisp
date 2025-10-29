'use client';

import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';
import { cloudDBManager } from '../lib/cloudDB';
import { Note } from '../lib/types';

interface RecorderBarProps {
  currentBook: string;
  onBookChange: () => void;
  onNoteSaved?: () => void;
}

export default function RecorderBar({ currentBook, onBookChange, onNoteSaved }: RecorderBarProps) {
  const {
    isRecording,
    isListening,
    liveTranscript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
  } = useSpeechRecognition();

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isRecording && liveTranscript.trim()) {
      // Auto-save the note immediately when recording stops
      handleAutoSaveNote(liveTranscript.trim());
    }
  }, [isRecording, liveTranscript]);

  const handleToggleRecording = () => {
    if (!currentBook) {
      onBookChange();
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      clearTranscript();
      startRecording();
    }
  };

  const handleAutoSaveNote = async (text: string) => {
    if (!text.trim() || !currentBook) return;

    setIsSaving(true);
    try {
      const note = {
        bookTitle: currentBook,
        text: text.trim(),
        createdAt: new Date(),
      };

      await cloudDBManager.saveNote(note);
      await cloudDBManager.updateBookLastUsed(currentBook);
      
      clearTranscript();
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Notify parent component
      if (onNoteSaved) {
        onNoteSaved();
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-50 border-t border-red-200 p-4">
        <div className="text-center text-red-600 text-sm">
          Speech recognition is not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Live transcription overlay */}
      {isRecording && liveTranscript && (
        <div className="fixed bottom-40 left-4 right-4 bg-white rounded-xl shadow-lg border p-4 max-h-32 overflow-y-auto z-40">
          <div className="text-sm text-gray-600 mb-2">Live transcription:</div>
          <div className="text-gray-900">{liveTranscript}</div>
        </div>
      )}

      {/* Success indicator */}
      {showSuccess && (
        <div className="fixed bottom-40 left-4 right-4 bg-green-50 border border-green-200 rounded-xl p-4 z-40">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span className="text-sm text-green-600 font-medium">Note saved successfully!</span>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-40 left-4 right-4 bg-blue-50 border border-blue-200 rounded-xl p-4 z-40">
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-blue-600">Saving note...</span>
          </div>
        </div>
      )}

      {/* Recorder Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="px-4 py-4">
          {/* Current book info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Current Book</div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {currentBook || 'No book selected'}
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Recording controls */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleToggleRecording}
              disabled={!currentBook}
              className={`
                relative w-16 h-16 rounded-full transition-all duration-200 transform
                ${!currentBook 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : isRecording
                    ? 'bg-red-500 hover:bg-red-600 scale-110' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                }
                ${isListening ? 'animate-pulse' : ''}
                disabled:scale-100 disabled:hover:scale-100
              `}
            >
              {/* Pulse animation ring for listening state */}
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
              )}
              
              {/* Microphone icon */}
              <div className="relative flex items-center justify-center w-full h-full">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
            </button>
          </div>

          {/* Recording status */}
          <div className="text-center mt-2">
            <div className="text-xs text-gray-600">
              {!currentBook 
                ? 'Select a book to start recording'
                : isRecording 
                  ? isListening 
                    ? 'Listening...' 
                    : 'Starting...'
                  : 'Tap to record'
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

