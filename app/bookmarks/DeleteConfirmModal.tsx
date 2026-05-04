"use client";

type Props = {
  bookmarkTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
};

export default function DeleteConfirmModal({ bookmarkTitle, onConfirm, onCancel, loading }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          Delete bookmark?
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--text)", fontWeight: 500 }}>"{bookmarkTitle}"</span> will be permanently removed.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              backgroundColor: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: loading ? "var(--border)" : "var(--danger)",
              color: loading ? "var(--text-muted)" : "white",
              border: "none",
            }}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}