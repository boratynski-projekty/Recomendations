"use client";

import { useEffect } from "react";

export default function YoutubeModal({
  videoId,
  onClose
}: {
  videoId: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (videoId) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videoId, onClose]);

  if (!videoId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-black shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black"
          aria-label="Zamknij"
        >
          ✕
        </button>
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
