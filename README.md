# Whisp - Voice-Based Book Notes App

A modern web application that allows users to record voice notes while reading books, with automatic speech-to-text transcription and cloud synchronization.

## Features

- 🎤 **Voice Recording**: Record spoken lines from books with real-time transcription
- 📚 **Book Organization**: Organize notes by book titles
- 🔄 **Auto-Save**: Automatic saving without confirmation prompts
- ✏️ **Edit Notes**: Edit transcribed text after recording
- 📱 **Mobile-Friendly**: Touch gestures for deleting notes (swipe left)
- ☁️ **Cloud Sync**: Data stored in Supabase with user isolation
- 🔐 **User Privacy**: Each user sees only their own data

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript and TailwindCSS 4
- **Speech Recognition**: Web Speech API
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth (Anonymous users)
- **Deployment**: Vercel-ready

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd whisp
npm install
```

### 2. Setup Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **Settings > API** in your Supabase dashboard
4. Copy your Project URL and anon key

### 3. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here
   ```

### 4. Database Setup

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase_schema.sql` and run it
3. This will create:
   - `books` and `notes` tables
   - Row Level Security policies
   - Proper indexes for performance
   - User isolation (each user sees only their data)

### 5. Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using the app.

## How to Use

1. **First Time Setup**: 
   - App will prompt you to create your first book
   - Enter a book title to get started

2. **Recording Notes**:
   - Click the microphone button to start recording
   - Speak your note clearly
   - The app will automatically transcribe and save when you stop

3. **Managing Notes**:
   - View recent notes on the home page
   - Click on a book to see all notes for that book
   - Edit notes by clicking the edit button
   - Delete notes by swiping left (mobile) or clicking delete

4. **Managing Books**:
   - Add new books from the books page
   - Switch between books easily
   - View all books and their notes

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support (iOS 14.5+)
- **Mobile browsers**: Optimized for touch interactions

## Data Privacy

- Each user gets an anonymous account automatically
- All data is isolated per user using Row Level Security
- Data syncs across devices when using the same browser session
- No personal information is collected beyond voice transcriptions

## Deployment

This app is ready for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add your environment variables in Vercel dashboard
3. Deploy automatically on each push

## Development

### Project Structure

```
whisp/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── books/             # Books pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── RecorderBar.tsx    # Voice recording interface
│   ├── NoteItem.tsx       # Individual note display
│   └── ...               # Other UI components
├── lib/                   # Utilities and services
│   ├── types.ts          # TypeScript interfaces
│   ├── cloudDB.ts        # Supabase database manager
│   ├── supabase.ts       # Supabase configuration
│   └── useSpeechRecognition.ts # Speech API hook
└── supabase_schema.sql    # Database schema
```

### Key Components

- **CloudDBManager**: Handles all database operations with user isolation
- **useSpeechRecognition**: Custom hook for Web Speech API
- **RecorderBar**: Main recording interface with auto-save
- **Note Management**: Full CRUD operations for notes and books

## Troubleshooting

### Speech Recognition Issues
- Ensure you're using HTTPS (required for Web Speech API)
- Check browser permissions for microphone access
- Verify browser compatibility

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Check that RLS policies are properly set up
- Ensure anonymous auth is enabled in Supabase

### Performance Issues
- Database queries are optimized with proper indexes
- Consider implementing pagination for large note collections
- Use React DevTools to identify rendering bottlenecks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
