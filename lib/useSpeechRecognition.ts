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
  const accumulatedTranscriptRef = useRef<string>(''); // Store accumulated final transcripts
  const isSafariRef = useRef<boolean>(false);
  const restartCountRef = useRef<number>(0);
  const maxRestartsRef = useRef<number>(10); // Limit restarts to prevent infinite loops

  // Detect Safari
  useEffect(() => {
    if (typeof window !== 'undefined') {
      isSafariRef.current = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
  }, []);

  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported in this browser' }));
      return null;
    }

    const recognition = new SpeechRecognition();
    
    // Safari-specific configuration
    if (isSafariRef.current) {
      recognition.continuous = false; // Safari works better with continuous: false
      recognition.interimResults = false; // Safari's interim results are unreliable
    } else {
      recognition.continuous = true;
      recognition.interimResults = true;
    }
    
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript;
        } else {
          // Only use interim results for non-Safari browsers
          if (!isSafariRef.current) {
            interimTranscript += transcript;
          }
        }
      }

      // Accumulate final transcripts
      if (newFinalTranscript) {
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + newFinalTranscript;
      }

      // For Safari, show accumulated + interim; for Chrome show accumulated + current interim
      const displayTranscript = isSafariRef.current 
        ? accumulatedTranscriptRef.current || newFinalTranscript
        : accumulatedTranscriptRef.current + (interimTranscript ? (accumulatedTranscriptRef.current ? ' ' : '') + interimTranscript : '');

      setState(prev => ({
        ...prev,
        liveTranscript: displayTranscript,
      }));

      // Handle restart logic differently for Safari
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (isSafariRef.current) {
        // For Safari, restart more frequently and with shorter timeout
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && state.isRecording && restartCountRef.current < maxRestartsRef.current) {
            restartCountRef.current++;
            try {
              recognitionRef.current.stop();
              // Wait a bit before restarting on Safari
              setTimeout(() => {
                if (recognitionRef.current && state.isRecording) {
                  recognitionRef.current.start();
                }
              }, 200);
            } catch (error) {
              console.error('Safari recognition restart error:', error);
            }
          }
        }, 1000); // Shorter timeout for Safari
      } else {
        // Chrome/other browsers
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && state.isRecording) {
            recognitionRef.current.stop();
            recognitionRef.current.start();
          }
        }, 2000);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle Safari-specific errors more gracefully
      if (isSafariRef.current && (event.error === 'network' || event.error === 'aborted')) {
        // These are common Safari errors that don't necessarily mean failure
        console.log('Safari recognition error (non-critical):', event.error);
        return;
      }
      
      setState(prev => ({ 
        ...prev, 
        error: `Recognition error: ${event.error}`,
        isListening: false 
      }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      
      // Auto-restart logic with Safari considerations
      if (state.isRecording && !state.error) {
        const restartDelay = isSafariRef.current ? 300 : 100; // Longer delay for Safari
        
        setTimeout(() => {
          if (recognitionRef.current && state.isRecording) {
            try {
              if (isSafariRef.current && restartCountRef.current >= maxRestartsRef.current) {
                console.log('Safari: Max restarts reached, stopping recognition');
                setState(prev => ({ ...prev, isRecording: false, isListening: false }));
                return;
              }
              recognitionRef.current.start();
            } catch (error) {
              console.error('Recognition restart error:', error);
              setState(prev => ({ 
                ...prev, 
                error: 'Failed to restart recognition',
                isRecording: false,
                isListening: false 
              }));
            }
          }
        }, restartDelay);
      }
    };

    return recognition;
  }, [state.isRecording, state.error]);

  const startRecording = useCallback(() => {
    setState(prev => ({ ...prev, error: null, liveTranscript: '' }));
    accumulatedTranscriptRef.current = ''; // Reset accumulated transcript
    restartCountRef.current = 0; // Reset restart counter
    
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      try {
        setState(prev => ({ ...prev, isRecording: true }));
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to start voice recognition. Please try again.',
          isRecording: false 
        }));
      }
    }
  }, [initRecognition]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    restartCountRef.current = 0; // Reset restart counter

    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      isListening: false 
    }));
  }, []);

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, liveTranscript: '', error: null }));
    accumulatedTranscriptRef.current = ''; // Reset accumulated transcript
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Add a browser detection helper for users
  const getBrowserInfo = useCallback(() => {
    if (typeof window === 'undefined') return 'unknown';
    
    if (isSafariRef.current) {
      return 'Safari (limited speech recognition support)';
    } else if (navigator.userAgent.includes('Chrome')) {
      return 'Chrome (optimal speech recognition)';
    } else if (navigator.userAgent.includes('Firefox')) {
      return 'Firefox (limited speech recognition support)';
    }
    return 'Other browser';
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearTranscript,
    getBrowserInfo,
    isSafari: isSafariRef.current,
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