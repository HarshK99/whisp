import { supabase } from './supabase';
import { Note, Book } from './types';

class CloudDBManager {
  private userId: string | null = null;
  private initPromise: Promise<void> | null = null;

  async initDB(): Promise<void> {
    // Prevent multiple simultaneous initialization calls
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initDB();
    return this.initPromise;
  }

  private async _initDB(): Promise<void> {
    try {
      // Get current authenticated user
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated. Please sign in.');
      }

      this.userId = user.id;
      
    } catch (error) {
      console.error('CloudDBManager: Initialization failed:', error);
      this.initPromise = null; // Reset so we can try again
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.userId) {
      await this.initDB();
    }
  }

  // Reset the manager when user signs out
  reset(): void {
    this.userId = null;
    this.initPromise = null;
  }

  async saveNote(note: Omit<Note, 'id'> & { bookTitle: string }): Promise<void> {
    await this.ensureInitialized();

    // First, get or create the book
    let book = await this.getBookByTitle(note.bookTitle);
    
    if (!book) {
      // Create book if it doesn't exist
      const { data: newBook, error: bookError } = await supabase
        .from('books')
        .insert({
          title: note.bookTitle,
          user_id: this.userId,
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
        })
        .select()
        .single();

      if (bookError) throw bookError;
      book = newBook;
    }

    if (!book) throw new Error('Failed to create or get book');

    // Generate a unique ID for the note
    const noteId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);

    // Insert the note
    const { error } = await supabase
      .from('notes')
      .insert({
        id: noteId,
        book_id: book.id,
        book_title: note.bookTitle,
        text: note.text,
        user_id: this.userId,
        created_at: note.createdAt.toISOString(),
      });

    if (error) throw error;

    // Update book's last_used timestamp
    await this.updateBookLastUsed(note.bookTitle);
  }

  async getNotesByBook(bookTitle: string): Promise<Note[]> {
    await this.ensureInitialized();

    const book = await this.getBookByTitle(bookTitle);
    if (!book) return [];

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('book_id', book.id)
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(note => ({
      id: note.id,
      bookTitle,
      text: note.text,
      createdAt: new Date(note.created_at),
    }));
  }

  async updateNote(note: Note): Promise<void> {
    await this.ensureInitialized();

    const { error } = await supabase
      .from('notes')
      .update({
        text: note.text,
      })
      .eq('id', note.id)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.ensureInitialized();

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  async getAllBooks(): Promise<Book[]> {
    await this.ensureInitialized();

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', this.userId)
      .order('last_used', { ascending: false });

    if (error) throw error;

    return data.map(book => ({
      title: book.title,
      createdAt: new Date(book.created_at),
      lastUsed: new Date(book.last_used),
    }));
  }

  async saveBook(book: Book): Promise<void> {
    await this.ensureInitialized();

    const bookData = {
      title: book.title,
      user_id: this.userId,
      created_at: book.createdAt.toISOString(),
      last_used: book.lastUsed.toISOString(),
    };

    const { error } = await supabase
      .from('books')
      .upsert(bookData, {
        onConflict: 'title,user_id'
      });

    if (error) {
      console.error('CloudDBManager: Database error:', error);
      throw error;
    }
  }

  async updateBookLastUsed(bookTitle: string): Promise<void> {
    await this.ensureInitialized();

    const { error } = await supabase
      .from('books')
      .update({
        last_used: new Date().toISOString(),
      })
      .eq('title', bookTitle)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  private async getBookByTitle(title: string): Promise<{ id: string; title: string } | null> {
    await this.ensureInitialized();

    const { data, error } = await supabase
      .from('books')
      .select('id, title')
      .eq('title', title)
      .eq('user_id', this.userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.userId;
  }

  // Sign out user
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.userId = null;
  }
}

export const cloudDBManager = new CloudDBManager();