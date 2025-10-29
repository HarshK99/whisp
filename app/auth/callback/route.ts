import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent(exchangeError.message)}`)
    }

    if (data.session) {
      // Successful authentication - redirect to home page
      return NextResponse.redirect(`${requestUrl.origin}/?confirmed=true`)
    }
  }

  // No code or session - redirect to home
  return NextResponse.redirect(requestUrl.origin)
}