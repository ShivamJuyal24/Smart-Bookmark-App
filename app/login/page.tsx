import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignInButton from "./SignInButton";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/bookmarks");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #faf5ff 100%)" }}
    >
      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 40px rgba(124, 58, 237, 0.08)",
        }}
      >
        {/* Logo */}
        <div className="mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
            style={{ backgroundColor: "var(--accent-light)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4z"
                fill="var(--accent)"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: "var(--text)" }}
          >
            Smart Bookmarks
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Save links. Let AI organize them.
          </p>
        </div>

        <div className="w-full h-px mb-6" style={{ backgroundColor: "var(--border)" }} />

        <SignInButton />

        <p className="text-xs text-center mt-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Your bookmarks are private and secure.
          <br />
          Only you can see them.
        </p>
      </div>

      <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        Built with Next.js · Supabase · Groq AI
      </p>
    </div>
  );
}