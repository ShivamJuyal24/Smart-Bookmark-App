# Smart Bookmarks

A bookmark manager that lets users save, organize, and manage their bookmarks with real-time sync across tabs — all behind Google authentication.

**Live URL:** https://smart-bookmark-app-six-jet.vercel.app  
**GitHub:** https://github.com/ShivamJuyal24/smart-bookmarks

---

## Tech Stack

- **Framework:** Next.js 15+ with App Router
- **Backend / Auth:** Supabase (PostgreSQL + Auth + Realtime)
- **AI Tagging:** Groq API (llama-3.1-8b-instant)
- **Styling:** Tailwind CSS + CSS Variables
- **Deployment:** Vercel

---

## Features

- Google OAuth login — seamless, no email/password
- Add bookmarks with URL and title
- Auto-fetches page title from URL on blur
- AI-powered auto-tagging using Groq — bookmarks are categorized automatically
- Filter bookmarks by tag
- Delete bookmarks with a confirmation step
- Real-time sync across tabs using Supabase Realtime
- Private bookmarks enforced at the database level with RLS
- Fully responsive, polished UI

---

## Supabase Auth & Row Level Security

### How Auth Works

Authentication is handled entirely by Supabase using Google OAuth. The flow works like this:

1. User clicks "Continue with Google" on the login page
2. Supabase redirects to Google's OAuth consent screen
3. Google returns an authorization code to `/auth/callback`
4. The Route Handler at `app/auth/callback/route.ts` exchanges the code for a Supabase session
5. The session is stored in a cookie and the user is redirected to `/bookmarks`

Session management is handled by `proxy.ts` (middleware) which runs on every request, refreshes the session cookie if needed, and redirects unauthenticated users away from protected routes.

### Row Level Security Policies

RLS is enabled on the `bookmarks` table with three policies:

```sql
-- SELECT: users can only read their own bookmarks
create policy "Users can select own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

-- INSERT: users can only insert bookmarks for themselves
create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

-- DELETE: users can only delete their own bookmarks
create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
```

### Why These Policies Are Correct

- `using()` on SELECT and DELETE filters rows **at the database level** — even if someone bypasses the frontend, they cannot read or delete another user's bookmarks
- `with check()` on INSERT ensures a user cannot insert a bookmark with a different `user_id` — prevents privilege escalation
- `auth.uid()` is provided by Supabase from the verified JWT — it cannot be spoofed from the client

This means privacy is enforced at the database level, not just in the UI.

---

## Real-Time Sync

### How It Works

Real-time sync is implemented using Supabase's `postgres_changes` feature, which listens to Postgres WAL (Write-Ahead Log) events over a WebSocket connection.

In `BookmarkList.tsx`:

```ts
const channel = supabase
  .channel("bookmarks-realtime")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "bookmarks" },
    () => {
      fetchBookmarks(); // refetch on any change
    }
  )
  .subscribe();
```

### Two Communication Paths

I use two separate paths intentionally:

1. **Same-tab updates** — When a bookmark is added, `AddBookmarkForm` fires a custom `window` event (`bookmark-added`). `BookmarkList` listens for this and refetches immediately. This avoids race conditions between the INSERT and the Groq UPDATE that follows.

2. **Cross-tab sync** — Supabase Realtime handles all changes from other tabs. Any INSERT, UPDATE, or DELETE triggers a refetch in all connected tabs.

### Subscription Cleanup

The channel is cleaned up on component unmount to prevent memory leaks:

```ts
return () => {
  window.removeEventListener("bookmark-added", fetchBookmarks);
  supabase.removeChannel(channel);
};
```

---

## Bonus Feature — AI Auto-Tagging with Groq

### What It Does

When a bookmark is saved, the app automatically sends the title and URL to Groq's API (using `llama-3.1-8b-instant`) to generate 1–3 relevant tags like `ai`, `productivity`, `design`, `tools`, etc. These tags appear as colored pills on each bookmark card. A filter bar at the top lets users filter their bookmarks by tag.

### Why I Built This

Most bookmark managers fail because organizing links manually is friction. People save things with good intentions and never find them again. Auto-tagging removes that friction entirely — the AI does the organizing so the user doesn't have to.

It also felt like the right bonus feature for a company that builds AI-enabled systems. It shows I naturally reach for AI to solve real UX problems, not just as a gimmick.

### How It Works

1. Bookmark is inserted into the database immediately (appears in list right away)
2. In the background, `AddBookmarkForm` calls `/api/autotag` with the title, URL, and bookmark ID
3. The API route sends the data to Groq and parses the returned JSON array of tags
4. Groq's response is used to update the bookmark row in Supabase directly from the server using the service role key
5. `notifyRefetch()` fires and the tags appear on the card

The tagging is non-blocking — if Groq fails, the bookmark is still saved cleanly without tags.

---

## Problems I Ran Into

**1. Bookmarks not appearing after insert**

After adding a bookmark, it wasn't showing in the list. The root cause was a race condition — Supabase Realtime's `UPDATE` event (from Groq writing tags back) was firing before the `INSERT` fully settled, causing state to get out of sync. I fixed this by separating same-tab communication (custom `window` events + refetch) from cross-tab sync (Realtime), making the data flow predictable.

**2. Groq model decommissioned**

The `llama3-8b-8192` model I was using was decommissioned by Groq mid-development. Tags were returning empty silently. I found the issue by adding server-side console logs to the API route, then updated the model to `llama-3.1-8b-instant`.

**3. `@import` must be first in CSS**

When updating `globals.css`, the `@import` for Google Fonts was getting appended after Tailwind directives instead of replacing the file, causing a PostCSS parse error. Fixed by selecting all and replacing the entire file contents.

**4. Supabase client vs server**

Early on I tried using the browser Supabase client inside a Server Component which threw errors. I learned to always use `lib/supabase/server.ts` in Server Components and Route Handlers, and `lib/supabase/client.ts` only in Client Components marked with `"use client"`.

---

## What I'd Improve With More Time

**Search** — A live search bar filtering by title or URL as you type. Every bookmark manager needs it and it's the most common action after saving links.

The current tag filter is useful but searching by keyword would be faster for power users. I'd implement it client-side using a simple `.filter()` on the bookmarks array — no extra DB query needed.

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/ShivamJuyal24/smart-bookmarks.git
cd smart-bookmarks

# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local
# Fill in your Supabase and Groq keys

# Run dev server
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_api_key
```

---

## Project Structure

```
smart-bookmarks/
├── app/
│   ├── api/
│   │   ├── autotag/route.ts       # Groq AI tagging endpoint
│   │   └── metadata/route.ts      # Auto-fetch page title from URL
│   ├── auth/callback/route.ts     # OAuth callback handler
│   ├── bookmarks/
│   │   ├── page.tsx               # Main bookmarks page (Server Component)
│   │   ├── AddBookmarkForm.tsx    # Add bookmark form (Client Component)
│   │   ├── BookmarkList.tsx       # Bookmark list + Realtime (Client Component)
│   │   ├── DeleteConfirmModal.tsx # Delete confirmation dialog
│   │   └── SignOutButton.tsx      # Sign out button
│   ├── login/
│   │   ├── page.tsx               # Login page (Server Component)
│   │   └── SignInButton.tsx       # Google OAuth button
│   ├── globals.css                # Global styles + CSS variables
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Root redirect
├── lib/
│   └── supabase/
│       ├── client.ts              # Browser Supabase client
│       └── server.ts             # Server Supabase client
├── proxy.ts                       # Middleware — session refresh + route protection
└── supabase/
    └── schema.sql                 # Full DB schema + RLS policies
```