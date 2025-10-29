import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
})

// Database schema types
export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          title: string
          user_id: string
          created_at: string
          last_used: string
        }
        Insert: {
          id?: string
          title: string
          user_id: string
          created_at?: string
          last_used?: string
        }
        Update: {
          id?: string
          title?: string
          user_id?: string
          created_at?: string
          last_used?: string
        }
      }
      notes: {
        Row: {
          id: string
          book_id: string
          text: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          text: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          text?: string
          user_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
    }
  }
}