'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState } from './types';

// TypeScript declarations for Speech Recognition API
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export const useSpeechRecognition = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isListening: false,
    liveTranscript: '',
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported in this browser' }));
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        liveTranscript: finalTranscript + interimTranscript,
      }));

      // Reset timeout for continuous listening
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && state.isRecording) {
          recognitionRef.current.stop();
          recognitionRef.current.start();
        }
      }, 2000);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setState(prev => ({ 
        ...prev, 
        error: `Recognition error: ${event.error}`,
        isListening: false 
      }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      
      // Auto-restart if still recording (to handle browser timeout)
      if (state.isRecording && !state.error) {
        setTimeout(() => {
          if (recognitionRef.current && state.isRecording) {
            recognitionRef.current.start();
          }
        }, 100);
      }
    };

    return recognition;
  }, [state.isRecording, state.error]);

  const startRecording = useCallback(() => {
    setState(prev => ({ ...prev, error: null, liveTranscript: '' }));
    
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      setState(prev => ({ ...prev, isRecording: true }));
      recognitionRef.current.start();
    }
  }, [initRecognition]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      isListening: false 
    }));
  }, []);

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, liveTranscript: '', error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported: typeof window !== 'undefined' && 
                 (window.SpeechRecognition || window.webkitSpeechRecognition),
  };
};

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}