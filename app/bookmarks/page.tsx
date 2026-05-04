import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddBookmarkForm from "./AddBookmarkForm";
import BookmarkList from "./BookmarkList";
import SignOutButton from "./SignOutButton";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = user.user_metadata?.full_name?.split(" ")[0] ?? user.email;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #faf5ff 100%)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{
          backgroundColor: "rgba(245, 243, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-light)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z" fill="var(--accent)" />
              </svg>
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
              Smart Bookmarks
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
              {name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">
        <AddBookmarkForm />
        <BookmarkList />
      </main>
    </div>
  );
}