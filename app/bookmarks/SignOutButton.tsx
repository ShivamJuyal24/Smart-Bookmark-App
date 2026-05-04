"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all active:scale-95"
      style={{
        backgroundColor: loading ? "var(--accent-light)" : "var(--accent)",
        color: loading ? "var(--accent-text)" : "white",
        cursor: loading ? "not-allowed" : "pointer",
        border: "none",
        boxShadow: loading ? "none" : "0 4px 14px rgba(124, 58, 237, 0.25)",
      }}
      onMouseEnter={(e) => {
        if (!loading)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)";
      }}
      onMouseLeave={(e) => {
        if (!loading)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)";
      }}
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}