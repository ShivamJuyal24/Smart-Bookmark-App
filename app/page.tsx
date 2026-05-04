// ROOT PAGE — handles the "/" route (homepage)
// This page never actually renders anything visible
// It just checks auth state and redirects accordingly:
//   - logged in  → /bookmarks
//   - logged out → /login
// Note: proxy.ts handles this redirect too, but this is a fallback

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  // Create server-side Supabase client
  const supabase = await createClient()

  // Check if there is a logged in user
  // getUser() verifies the session token with Supabase server
  // It does NOT just read from cookie — it actually validates it
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // User is logged in — send to bookmarks
    redirect('/bookmarks')
  } else {
    // User is not logged in — send to login
    redirect('/login')
  }
}