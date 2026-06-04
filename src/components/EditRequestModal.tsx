"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRequest } from "@/app/actions";

export default function EditRequestModal({
  open,
  onClose,
  request
}: {
  open: boolean;
  onClose: () => void;
  request: {
    id: string;
    artist: string;
    title: string;
    comment: string | null;
  };
}) {
  const router = useRouter();
  const [artist, setArtist] = useState(request.artist);
  const [title, setTitle] = useState(request.title);
  const [comment, setComment] = useState(request.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setArtist(request.artist);
      setTitle(request.title);
      setComment(request.comment ?? "");
      setError(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, request]);

  if (!open) return null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("requestId", request.id);
    startTransition(async () => {
      const res = await updateRequest(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit your request</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-xs text-muted">
          The YouTube link can&apos;t be changed — delete and re-add if needed.
        </p>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">Artist</span>
          <input
            name="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
            maxLength={120}
            className="input"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">Title</span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="input"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-muted">Comment</span>
          <textarea
            name="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={400}
            className="input"
          />
        </label>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={onClose} className="btn">
            Cancel
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
