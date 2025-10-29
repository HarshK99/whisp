# Quick Setup Guide for Whisp

## 🚀 Getting Started (5 minutes)

### Step 1: Setup Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project creation (2-3 minutes)
3. Go to **Settings > API** and copy:
   - Project URL
   - anon/public key

### Step 2: Configure Environment
1. Open `.env.local` in this folder
2. Replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here
   ```

### Step 3: Setup Database
1. In Supabase dashboard, go to **SQL Editor**
2. Copy all content from `supabase_schema.sql` 
3. Paste and run the SQL commands
4. ✅ This creates tables and security policies

### Step 4: Run the App
```bash
npm run dev
```

### Step 5: Test
1. Open [http://localhost:3000](http://localhost:3000)
2. Create your first book
3. Record a voice note
4. ✅ Data should save to cloud!

## 🔧 Verification

### Check if it's working:
- [ ] App loads without errors
- [ ] Can create a book
- [ ] Voice recording works (need HTTPS for production)
- [ ] Notes save and persist on refresh
- [ ] Each browser gets its own data

### If something's wrong:
1. Check browser console for errors
2. Verify Supabase credentials in `.env.local`
3. Ensure SQL schema was run completely
4. Check Supabase dashboard for data

## 📱 Next Steps

### For Production:
1. Deploy to Vercel
2. Add environment variables in Vercel dashboard
3. Test HTTPS speech recognition
4. Configure custom domain (optional)

### For Development:
- Data is isolated per user automatically
- No login required (anonymous auth)
- Local development uses localhost (limited speech API)
- Production needs HTTPS for full functionality

## 🆘 Need Help?

**Common Issues:**
- "Speech not supported": Need HTTPS or compatible browser
- "Database error": Check Supabase credentials and schema
- "No data persisting": Verify RLS policies are active

**Database Reset:**
If you need to reset data, run this in Supabase SQL Editor:
```sql
DELETE FROM notes;
DELETE FROM books;
```

You're all set! 🎉