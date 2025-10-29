export interface Note {
  id: string;
  bookTitle: string;
  text: string;
  createdAt: Date;
}

export interface Book {
  title: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface RecordingState {
  isRecording: boolean;
  isListening: boolean;
  liveTranscript: string;
  error: string | null;
}