// This is the OAUTH CALLBACK ROUTE — handles /auth/callback
// This is NOT a page — it's a server-side API endpoint (Route Handler)
//
// Full flow:
//   1. User clicks "Continue with Google" on login page
//   2. Browser redirects to Google login page
//   3. User signs in with Google
//   4. Google redirects back to THIS URL with a ?code=xxx parameter
//   5. We take that code and exchange it for a real Supabase session
//   6. Supabase sets the auth cookie in the browser
//   7. We redirect user to /bookmarks
//
// If anything goes wrong → redirect back to /login with error param

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Parse the full URL of this request
  const requestUrl = new URL(request.url)

  // Google sends back a one-time "code" in the URL query params
  // Example URL: /auth/callback?code=4/0AX4XfWj...
  // This code can only be used once and expires quickly
  const code = requestUrl.searchParams.get('code')

  // Optional: where to redirect after successful login
  // Defaults to /bookmarks if not provided
  const next = requestUrl.searchParams.get('next') ?? '/bookmarks'

  if (code) {
    // Get the cookie store so we can save the session
    const cookieStore = await cookies()

    // Create a Supabase server client
    // We need to manually handle cookies here because this is server-side
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Read all cookies from the incoming request
          getAll() {
            return cookieStore.getAll()
          },
          // Write cookies to the response
          // This is how the auth session gets saved in the browser
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // THE KEY LINE — exchange the Google code for a Supabase session
    // After this runs successfully:
    //   - Supabase creates a session for this user
    //   - Sets auth cookies in the browser
    //   - User is now officially logged in
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Everything worked — send user to bookmarks page
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // If we reach here something went wrong:
  //   - No code in the URL
  //   - Code exchange failed (expired, already used, etc.)
  // Send back to login with an error flag
  // You can read this ?error param on the login page to show an error message
  return NextResponse.redirect(
    new URL('/login?error=auth_failed', requestUrl.origin)
  )
}