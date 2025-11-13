'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';
import { cloudDBManager } from '../lib/cloudDB';
import { Note } from '../lib/types';
import { useAuth } from '../lib/auth';
import { GradientHeader } from './ui';

interface RecorderBarProps {
  currentBook: string;
  onBookChange: () => void;
  onNoteSaved?: () => void;
}

export default function RecorderBar({ currentBook, onBookChange, onNoteSaved }: RecorderBarProps) {
  const { user } = useAuth();
  const {
    isRecording,
    isListening,
    liveTranscript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
    isSafari,
    getBrowserInfo,
  } = useSpeechRecognition();

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSavedTranscript, setLastSavedTranscript] = useState('');
  const [showSafariNotice, setShowSafariNotice] = useState(false);
  // Recorder UI was reset: keyboard-sheet and mobile heuristics removed

  // Check if we should show Safari notice - only after user is logged in
  useEffect(() => {
    if (user && isSafari) {
      // Check if notice was already shown for this user session
      const safariNoticeKey = `safariNoticeShown_${user.id}`;
      const safariNoticeShown = sessionStorage.getItem(safariNoticeKey);
      
      if (!safariNoticeShown) {
        setShowSafariNotice(true);
        // Use sessionStorage so it shows once per session, not once forever
        sessionStorage.setItem(safariNoticeKey, 'true');
        
        // Hide after 5 seconds
        const timer = setTimeout(() => {
          setShowSafariNotice(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, isSafari]);

  useEffect(() => {
    // Only save if recording stopped, we have a transcript, and it's different from the last saved one
    if (!isRecording && liveTranscript.trim() && liveTranscript.trim() !== lastSavedTranscript && !isSaving) {
      handleAutoSaveNote(liveTranscript.trim());
    }
  }, [isRecording, liveTranscript, lastSavedTranscript, isSaving]);

  const handleToggleRecording = () => {
    if (!currentBook) {
      onBookChange();
      return;
    }

    // Minimal start/stop recording flow using the web Speech hook.
    if (isRecording) {
      stopRecording();
    } else {
      setLastSavedTranscript('');
      clearTranscript();
      startRecording();
    }
  };

  const handleAutoSaveNote = async (text: string) => {
    if (!text.trim() || !currentBook || isSaving) return;

    setIsSaving(true);
    try {
      const note = {
        bookTitle: currentBook,
        text: text.trim(),
        createdAt: new Date(),
      };

      await cloudDBManager.saveNote(note);
      await cloudDBManager.updateBookLastUsed(currentBook);
      
      // Mark this transcript as saved to prevent duplicates
      setLastSavedTranscript(text.trim());
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

  // Removed previous keyboard sheet focus retry and handlers during recorder reset

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
      {/* Recording visual overlay while capturing audio (we transcribe on stop) */}
      {isRecording && (
        <div className="fixed bottom-28 left-4 right-4 bg-white rounded-xl shadow-lg border p-4 max-h-32 overflow-y-auto z-40">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" aria-hidden />
            <div className="text-sm text-gray-700 font-medium">Recording…</div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Transcription will appear after you stop recording.</div>
        </div>
      )}

      {/* Processing overlay: show after recording stops and we have a transcript that hasn't been saved yet */}
      {!isRecording && liveTranscript.trim() && liveTranscript.trim() !== lastSavedTranscript && !isSaving && (
        <div className="fixed bottom-28 left-4 right-4 bg-white rounded-xl shadow-lg border p-4 max-h-32 overflow-y-auto z-40">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <div className="text-sm text-gray-700 font-medium">Processing transcription…</div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Saving and finalizing your note.</div>
        </div>
      )}

      {/* Success indicator - positioned above the recorder bar */}
      {showSuccess && (
        <div className="fixed bottom-28 left-4 right-4 bg-green-50 border border-green-200 rounded-xl p-4 z-40">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span className="text-sm text-green-600 font-medium">Note saved successfully!</span>
          </div>
        </div>
      )}

      {/* Saving indicator - positioned above the recorder bar */}
      {isSaving && (
        <div className="fixed bottom-28 left-4 right-4 bg-blue-50 border border-blue-200 rounded-xl p-4 z-40">
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-blue-600">Saving note...</span>
          </div>
        </div>
      )}

      {/* Recorder UI reset: keyboard sheet removed */}

      {/* Recorder Bar - Fixed at bottom but not overlaying content */}
      <div className="fixed bottom-0 left-0 right-0 shadow-lg z-50">
        <GradientHeader variant="bottom">
          <div className="px-4 py-3">
            {/* Error message */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Safari Warning - Only show for 5 seconds on first login per session */}
          {showSafariNotice && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-xs text-yellow-700">
                  <span className="font-medium">Safari Notice:</span> For best transcription quality, try using Chrome. Safari's speech recognition has limitations.
                </div>
                <button
                  onClick={() => setShowSafariNotice(false)}
                  className="ml-2 text-yellow-600 hover:text-yellow-800 text-xs"
                  aria-label="Dismiss notice"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Horizontal layout: Book info on left, Record button on right */}
          <div className="flex items-center justify-between">
            {/* Current book info (clickable) */}
            <div className="flex-1 pr-4">
              <Link href="/books" className="block rounded-md hover:bg-slate-50 transition-colors px-2 py-1" aria-label="Open books">

                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Current Book</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {currentBook || 'No book selected'}
                    </div>
                  </div>

              </Link>
            </div>

            {/* Recording button with status below */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <button
                onClick={handleToggleRecording}
                disabled={!currentBook}
                className={`
                  relative w-14 h-14 rounded-full transition-all duration-200 transform
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
                
                {/* Microphone/Stop icon */}
                <div className="relative flex items-center justify-center w-full h-full">
                  {isRecording ? (
                    // Stop icon when recording
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                  ) : (
                    // Microphone icon when not recording
                    <svg
                      className="w-7 h-7 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  )}
                </div>
              </button>
              
              {/* Recording status below button */}
              <div className={`text-xs mt-1 text-center font-medium ${
                isRecording ? 'text-red-600' : 'text-gray-600'
              }`}>
                {!currentBook
                  ? 'Select book'
                  : isRecording
                    ? 'Tap to stop'
                    : 'Tap to record'
                }
              </div>
            </div>
          </div>
          </div>
        </GradientHeader>
      </div>
    </>
  );
}

