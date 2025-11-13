"use client";

import { useEffect, useRef, useState } from 'react';

type UseSpeechReturn = {
  isSupported: boolean;
  isRecording: boolean;
  isListening: boolean;
  liveTranscript: string; // debounced interim OR final on stop (keeps existing UI)
  finalTranscript: string; // accumulated final transcript (explicit)
  error: string | null;
  isSafari: boolean;
  startRecording: () => void;
  stopRecording: () => Promise<string>;
  clearTranscript: () => void;
  getBrowserInfo: () => string;
};

export const useSpeechRecognition = (): UseSpeechReturn => {
  const SpeechRecognitionClass: any =
    typeof window !== 'undefined'
      ? // @ts-ignore
        window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognitionClass);
  const isSafari = typeof navigator !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

  const recognitionRef = useRef<any | null>(null);
  const isRecordingRequestedRef = useRef(false);
  const restartCountRef = useRef(0);
  const lastRestartAtRef = useRef<number | null>(null);

  const accumulatedTranscriptRef = useRef<string>('');
  const interimRef = useRef<string>('');
  const interimDebounceTimeout = useRef<number | null>(null);

  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceInterimToUI = (value: string) => {
    if (interimDebounceTimeout.current) {
      window.clearTimeout(interimDebounceTimeout.current);
    }
    interimDebounceTimeout.current = window.setTimeout(() => {
      setLiveTranscript(value);
    }, 150);
  };

  const createRecognition = () => {
    if (!SpeechRecognitionClass) return null;
    const r = new SpeechRecognitionClass();
    r.lang = 'en-US';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setIsListening(true);
      setError(null);
      // Successful start -- reset restart counters so subsequent onend restarts are fresh
      restartCountRef.current = 0;
      lastRestartAtRef.current = Date.now();
      console.debug('[useSpeech] onstart - reset restartCount');
    };

    r.onresult = (ev: any) => {
      let interimText = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          accumulatedTranscriptRef.current = `${accumulatedTranscriptRef.current}${accumulatedTranscriptRef.current ? ' ' : ''}${res[0].transcript}`;
        } else {
          interimText += res[0].transcript;
        }
      }
      interimRef.current = interimText;
      debounceInterimToUI(interimText);
    };

    r.onerror = (ev: any) => {
      const name = ev?.error || 'unknown';
      console.warn('SpeechRecognition error', name, ev);
      if (name === 'not-allowed' || name === 'denied') {
        setError('Microphone permission denied. Please allow microphone access.');
        stopRecognitionInstance(r);
        return;
      }
      if (name === 'no-speech') {
        // not fatal — try restart
        attemptRestartWithBackoff('no-speech');
        return;
      }
      if (name === 'network' || name === 'aborted') {
        attemptRestartWithBackoff(name);
        return;
      }
      setError(String(name));
      stopRecognitionInstance(r);
    };

    r.onend = () => {
      setIsListening(false);
      console.debug('[useSpeech] onend - isRecordingRequested=', isRecordingRequestedRef.current);
      if (isRecordingRequestedRef.current) {
        // Ensure we clear the current ref before attempting a fresh restart
        try { stopRecognitionInstance(r); } catch (e) {}
        recognitionRef.current = null;
        attemptRestartWithBackoff('onend');
      } else {
        setIsRecording(false);
      }
    };

    return r;
  };

  const stopRecognitionInstance = (instance: any) => {
    try {
      instance.onresult = null;
      instance.onend = null;
      instance.onerror = null;
      instance.onstart = null;
      instance.stop && instance.stop();
    } catch (e) {
      // ignore
    }
  };

  const attemptRestartWithBackoff = (reason: string) => {
    const now = Date.now();
    if (lastRestartAtRef.current && now - lastRestartAtRef.current > 30000) {
      restartCountRef.current = 0;
    }
    lastRestartAtRef.current = now;
    const maxRestarts = 10;
    if (restartCountRef.current >= maxRestarts) {
      setError('Speech recognition repeatedly failed. Please try again later or use the keyboard.');
      isRecordingRequestedRef.current = false;
      setIsRecording(false);
      setIsListening(false);
      return;
    }
    restartCountRef.current += 1;
    const backoffMs = Math.min(1000 * 2 ** (restartCountRef.current - 1), 8000);
    console.debug(`[useSpeech] attemptRestartWithBackoff reason=${reason} count=${restartCountRef.current} backoff=${backoffMs}`);
    setTimeout(() => {
      if (!isRecordingRequestedRef.current) return;
      try {
        // Clear any stale instance and create a fresh recognition before starting
        if (recognitionRef.current) {
          try { stopRecognitionInstance(recognitionRef.current); } catch (e) {}
          recognitionRef.current = null;
        }
        recognitionRef.current = createRecognition();
        recognitionRef.current.start();
        // if start succeeded, reset restart counters
        restartCountRef.current = 0;
        lastRestartAtRef.current = Date.now();
        console.debug('[useSpeech] restart succeeded, reset restartCount');
      } catch (e) {
        console.warn('[useSpeech] restart failed, scheduling another retry', e);
        attemptRestartWithBackoff('restart-failed');
      }
    }, backoffMs);
  };

  const startRecording = () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    restartCountRef.current = 0;
    lastRestartAtRef.current = null;
    accumulatedTranscriptRef.current = '';
    interimRef.current = '';
    setLiveTranscript('');
    setFinalTranscript('');
    setError(null);

    isRecordingRequestedRef.current = true;
    setIsRecording(true);

    recognitionRef.current = createRecognition();
    try {
      recognitionRef.current.start();
    } catch (e) {
      attemptRestartWithBackoff('start-exception');
    }
  };

  const stopRecording = async (): Promise<string> => {
    isRecordingRequestedRef.current = false;
    if (recognitionRef.current) {
      try {
        stopRecognitionInstance(recognitionRef.current);
      } catch (e) {}
      recognitionRef.current = null;
    }

    const finalText = accumulatedTranscriptRef.current.trim();
    // Publish final into both finalTranscript and liveTranscript so existing UI saves
    setFinalTranscript(finalText);
    setLiveTranscript(finalText);
    setIsRecording(false);
    setIsListening(false);
    return finalText;
  };

  const clearTranscript = () => {
    accumulatedTranscriptRef.current = '';
    interimRef.current = '';
    setLiveTranscript('');
    setFinalTranscript('');
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          stopRecognitionInstance(recognitionRef.current);
        } catch (e) {}
        recognitionRef.current = null;
      }
      if (interimDebounceTimeout.current) {
        window.clearTimeout(interimDebounceTimeout.current);
      }
    };
  }, []);

  const getBrowserInfo = () => {
    if (typeof window === 'undefined') return 'unknown';
    if (isSafari) return 'Safari (limited speech recognition support)';
    if (navigator.userAgent.includes('Chrome')) return 'Chrome (optimal speech recognition)';
    if (navigator.userAgent.includes('Firefox')) return 'Firefox (limited speech recognition support)';
    return 'Other browser';
  };

  return {
    isSupported,
    isRecording,
    isListening,
    liveTranscript,
    finalTranscript,
    error,
    isSafari,
    startRecording,
    stopRecording,
    clearTranscript,
    getBrowserInfo,
  };
};

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}
