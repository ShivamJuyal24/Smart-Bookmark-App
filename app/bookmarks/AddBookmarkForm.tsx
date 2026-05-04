"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function notifyRefetch() {
  window.dispatchEvent(new CustomEvent("bookmark-added"));
}

export default function AddBookmarkForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  function isValidUrl(value: string) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  // Auto-fetch title when user leaves URL field
  async function handleUrlBlur() {
    if (!url.trim() || !isValidUrl(url.trim())) return;
    if (title.trim()) return; // Don't overwrite if user already typed a title

    setFetchingTitle(true);
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data.title) setTitle(data.title);
    } catch {
      // Silent fail — user can type manually
    } finally {
      setFetchingTitle(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!url.trim() || !title.trim()) {
      setError("Both URL and title are required.");
      return;
    }
    if (!isValidUrl(url.trim())) {
      setError("Please enter a valid URL (e.g. https://example.com).");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("bookmarks")
      .insert({
        url: url.trim(),
        title: title.trim(),
        user_id: user.id,
        favicon_url: `https://www.google.com/s2/favicons?domain=${new URL(url.trim()).hostname}&sz=32`,
        tags: [],
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    notifyRefetch();
    setLoading(false);
    setUrl("");
    setTitle("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);

    if (inserted) {
      fetch("/api/autotag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: inserted.title, url: inserted.url, id: inserted.id }),
      })
        .then(() => notifyRefetch())
        .catch(() => {});
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 20px rgba(124, 58, 237, 0.06)",
      }}
    >
      <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
        Add bookmark
      </h2>

      <div className="flex flex-col gap-2.5">
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
          className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-all"
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            outline: "none",
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        />

        <div className="relative">
          <input
            type="text"
            placeholder={fetchingTitle ? "Fetching title..." : "Title"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={fetchingTitle}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-all"
            style={{
              backgroundColor: fetchingTitle ? "var(--bg)" : "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              outline: "none",
              opacity: fetchingTitle ? 0.6 : 1,
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          {fetchingTitle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div
                className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "var(--border)",
                  borderTopColor: "var(--accent)",
                }}
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ color: "var(--danger)", backgroundColor: "var(--danger-light)" }}>
            {error}
          </p>
        )}

        {success && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ color: "var(--accent-text)", backgroundColor: "var(--accent-light)" }}>
            ✓ Saved — AI is tagging it in the background
          </p>
        )}

        <button
          type="submit"
          disabled={loading || fetchingTitle}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: loading ? "var(--accent-light)" : "var(--accent)",
            color: loading ? "var(--accent-text)" : "white",
            cursor: loading || fetchingTitle ? "not-allowed" : "pointer",
            border: "none",
            boxShadow: loading ? "none" : "0 4px 14px rgba(124, 58, 237, 0.25)",
          }}
          onMouseEnter={(e) => {
            if (!loading && !fetchingTitle)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            if (!loading && !fetchingTitle)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)";
          }}
        >
          {loading ? "Saving..." : "Save bookmark"}
        </button>
      </div>
    </form>
  );
}