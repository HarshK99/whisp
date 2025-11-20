"use client";

import { useState } from 'react';

type UseSpeechReturn = {
  isSupported: boolean;
  isRecording: boolean;
  isListening: boolean;
  liveTranscript: string;
  finalTranscript: string;
  error: string | null;
  isSafari: boolean;
  startRecording: () => void;
  stopRecording: () => Promise<string>;
  clearTranscript: () => void;
  getBrowserInfo: () => string;
};

export const useSpeechRecognition = (): UseSpeechReturn => {
  const [liveTranscript] = useState('');
  const [finalTranscript] = useState('');
  return {
    isSupported: false,
    isRecording: false,
    isListening: false,
    liveTranscript,
    finalTranscript,
    error: null,
    isSafari: false,
    startRecording: () => {},
    stopRecording: async () => '',
    clearTranscript: () => {},
    getBrowserInfo: () => 'speech-removed',
  };
};
