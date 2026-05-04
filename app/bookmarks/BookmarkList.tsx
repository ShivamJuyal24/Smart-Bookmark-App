"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import DeleteConfirmModal from "./DeleteConfirmModal";

type Bookmark = {
  id: string;
  url: string;
  title: string;
  favicon_url: string | null;
  tags: string[];
  created_at: string;
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  design:             { bg: "#fce7f3", text: "#9d174d" },
  development:        { bg: "#dbeafe", text: "#1e40af" },
  productivity:       { bg: "#fef9c3", text: "#854d0e" },
  ai:                 { bg: "#ede9fe", text: "#6d28d9" },
  research:           { bg: "#cffafe", text: "#155e75" },
  news:               { bg: "#ffedd5", text: "#9a3412" },
  finance:            { bg: "#dcfce7", text: "#166534" },
  health:             { bg: "#d1fae5", text: "#065f46" },
  education:          { bg: "#e0e7ff", text: "#3730a3" },
  tools:              { bg: "#f1f5f9", text: "#475569" },
  entertainment:      { bg: "#fee2e2", text: "#991b1b" },
  science:            { bg: "#ccfbf1", text: "#134e4a" },
  marketing:          { bg: "#ffe4e6", text: "#9f1239" },
  devops:             { bg: "#f1f5f9", text: "#334155" },
  "open-source":      { bg: "#ecfccb", text: "#3f6212" },
  "machine-learning": { bg: "#f5f3ff", text: "#5b21b6" },
};

function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { bg: "#dcfce7", text: "#166534" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Bookmark | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchBookmarks = useCallback(async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setBookmarks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // 1. Initial fetch
    fetchBookmarks();

    // 2. Same-tab event listener
    window.addEventListener("bookmark-added", fetchBookmarks);

    // 3. Setup realtime with user filter
    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove existing channel if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`bookmarks-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchBookmarks();
          }
        )
        .subscribe((status) => {
          console.log("[realtime] status:", status);
        });

      channelRef.current = channel;
    }

    setupRealtime();

    return () => {
      window.removeEventListener("bookmark-added", fetchBookmarks);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchBookmarks]);

  async function handleDelete() {
  if (!deleteTarget) return;
  setDeleting(true);

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", deleteTarget.id);

  setDeleting(false);
  setDeleteTarget(null);

  // Optimistically remove from state immediately — don't wait for Realtime
  if (!error) {
    setBookmarks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
  }
}
  const allTags = Array.from(new Set(bookmarks.flatMap((b) => b.tags ?? []))).sort();
  const filtered = activeTag ? bookmarks.filter((b) => b.tags?.includes(activeTag)) : bookmarks;

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl animate-pulse"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div
        className="rounded-2xl py-16 flex flex-col items-center text-center"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="text-4xl mb-3">🔖</div>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>No bookmarks yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Save your first link above
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => setActiveTag(null)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: activeTag === null ? "var(--text)" : "var(--surface)",
              color: activeTag === null ? "var(--bg)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            All
          </button>
          {allTags.map((tag) => {
            const { bg, text } = tagStyle(tag);
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? null : tag)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: isActive ? "var(--text)" : bg,
                  color: isActive ? "var(--bg)" : text,
                  border: "1px solid transparent",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
            No bookmarks tagged "{activeTag}"
          </p>
        ) : (
          filtered.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-all"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "#c4b5fd")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")
              }
            >
              {/* Favicon */}
              <div
                className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
              >
                {bookmark.favicon_url ? (
                  <img
                    src={bookmark.favicon_url}
                    alt=""
                    width={16}
                    height={16}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>🌐</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium truncate transition-colors"
                  style={{ color: "var(--text)" }}
                  onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "var(--accent)")}
                  onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "var(--text)")}
                >
                  {bookmark.title}
                </a>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}
                >
                  {bookmark.url}
                </p>

                {/* Tags */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bookmark.tags.map((tag) => {
                      const { bg, text } = tagStyle(tag);
                      return (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: bg, color: text }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right side */}
              <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
                <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
                  {formatDate(bookmark.created_at)}
                </span>
                <button
                  onClick={() => setDeleteTarget(bookmark)}
                  className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--danger-light)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  }}
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          bookmarkTitle={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}