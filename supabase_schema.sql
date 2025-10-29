-- Enable Row Level Security
ALTER TABLE IF EXISTS public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notes ENABLE ROW LEVEL SECURITY;

-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_used TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at_app TIMESTAMPTZ, -- For app-level created date
    last_used_app TIMESTAMPTZ,  -- For app-level last used date
    UNIQUE(user_id, title)
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY, -- Using TEXT to match app's string IDs
    book_title TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at_app TIMESTAMPTZ, -- For app-level created date
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS books_user_id_idx ON public.books(user_id);
CREATE INDEX IF NOT EXISTS books_last_used_idx ON public.books(user_id, last_used DESC);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_book_title_idx ON public.notes(user_id, book_title);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes(user_id, created_at DESC);

-- Row Level Security policies

-- Books policies
DROP POLICY IF EXISTS "Users can only see their own books" ON public.books;
CREATE POLICY "Users can only see their own books" ON public.books
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
CREATE POLICY "Users can insert their own books" ON public.books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
CREATE POLICY "Users can update their own books" ON public.books
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
CREATE POLICY "Users can delete their own books" ON public.books
    FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
DROP POLICY IF EXISTS "Users can only see their own notes" ON public.notes;
CREATE POLICY "Users can only see their own notes" ON public.notes
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;
CREATE POLICY "Users can insert their own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
CREATE POLICY "Users can delete their own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.books TO authenticated;
GRANT ALL ON public.notes TO authenticated;