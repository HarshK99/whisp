import { Note, Book } from './types';

const DB_NAME = 'WhispNotesDB';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';
const BOOKS_STORE = 'books';

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create notes store
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          const notesStore = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
          notesStore.createIndex('bookTitle', 'bookTitle', { unique: false });
          notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create books store
        if (!db.objectStoreNames.contains(BOOKS_STORE)) {
          const booksStore = db.createObjectStore(BOOKS_STORE, { keyPath: 'title' });
          booksStore.createIndex('lastUsed', 'lastUsed', { unique: false });
        }
      };
    });
  }

  async saveNote(note: Note): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([NOTES_STORE], 'readwrite');
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.add(note);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save note'));
    });
  }

  async getNotesByBook(bookTitle: string): Promise<Note[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([NOTES_STORE], 'readonly');
      const store = transaction.objectStore(NOTES_STORE);
      const index = store.index('bookTitle');
      const request = index.getAll(bookTitle);

      request.onsuccess = () => {
        const notes = request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(notes);
      };
      request.onerror = () => reject(new Error('Failed to get notes'));
    });
  }

  async updateNote(note: Note): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([NOTES_STORE], 'readwrite');
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.put(note);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to update note'));
    });
  }

  async deleteNote(noteId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([NOTES_STORE], 'readwrite');
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.delete(noteId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete note'));
    });
  }

  async saveBook(book: Book): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BOOKS_STORE], 'readwrite');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.put(book);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save book'));
    });
  }

  async getAllBooks(): Promise<Book[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BOOKS_STORE], 'readonly');
      const store = transaction.objectStore(BOOKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const books = request.result.sort((a, b) => 
          new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        );
        resolve(books);
      };
      request.onerror = () => reject(new Error('Failed to get books'));
    });
  }

  async updateBookLastUsed(bookTitle: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const book: Book = {
      title: bookTitle,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    await this.saveBook(book);
  }
}

export const dbManager = new IndexedDBManager();