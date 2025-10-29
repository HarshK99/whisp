import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    // Instead of redirecting, show an error page
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Email Verification Failed</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; }
            .error { color: #dc2626; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #374151; margin: 0 0 16px 0; font-size: 24px; }
            p { color: #6b7280; margin: 0 0 24px 0; line-height: 1.5; }
            .close-btn { background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; }
            .close-btn:hover { background: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon error">✗</div>
            <h1>Verification Failed</h1>
            <p>There was an error verifying your email: ${errorDescription || error}</p>
            <button class="close-btn" onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>`,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      // Show error page instead of redirecting
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Email Verification Failed</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
              .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; }
              .error { color: #dc2626; }
              .icon { font-size: 48px; margin-bottom: 20px; }
              h1 { color: #374151; margin: 0 0 16px 0; font-size: 24px; }
              p { color: #6b7280; margin: 0 0 24px 0; line-height: 1.5; }
              .close-btn { background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; }
              .close-btn:hover { background: #374151; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon error">✗</div>
              <h1>Verification Failed</h1>
              <p>There was an error verifying your email. Please try again.</p>
              <button class="close-btn" onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>`,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      )
    }

    if (data.session) {
      // Show success page instead of redirecting
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Email Verified Successfully</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
              .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; }
              .success { color: #059669; }
              .icon { font-size: 48px; margin-bottom: 20px; }
              h1 { color: #374151; margin: 0 0 16px 0; font-size: 24px; }
              p { color: #6b7280; margin: 0 0 24px 0; line-height: 1.5; }
              .close-btn { background: #059669; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; }
              .close-btn:hover { background: #047857; }
              .app-btn { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-left: 8px; text-decoration: none; display: inline-block; }
              .app-btn:hover { background: #2563eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon success">✓</div>
              <h1>Email Verified!</h1>
              <p>Your email has been successfully verified. You can now sign in to Whisp.</p>
              <div>
                <button class="close-btn" onclick="window.close()">Close Window</button>
                <a href="${requestUrl.origin}" class="app-btn">Go to Whisp</a>
              </div>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      )
    }
  }

  // No code or session - show generic message
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Email Verification</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
          .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; }
          .icon { font-size: 48px; margin-bottom: 20px; color: #6b7280; }
          h1 { color: #374151; margin: 0 0 16px 0; font-size: 24px; }
          p { color: #6b7280; margin: 0 0 24px 0; line-height: 1.5; }
          .close-btn { background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; }
          .close-btn:hover { background: #374151; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📧</div>
          <h1>Email Verification</h1>
          <p>Please check your email for a verification link.</p>
          <button class="close-btn" onclick="window.close()">Close Window</button>
        </div>
      </body>
    </html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  )
}