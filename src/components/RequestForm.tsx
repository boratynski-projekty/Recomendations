"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "@/app/actions";
import { extractYoutubeId, fetchYoutubeMeta } from "@/lib/youtube";

export default function RequestForm({
  listId,
  basePath,
  onSubmitted
}: {
  listId: string;
  /** np. /u/jan/list-x — używane do redirectu przy duplikacie */
  basePath: string;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onUrlBlur() {
    const id = extractYoutubeId(url);
    if (!id) return;
    setFetching(true);
    const meta = await fetchYoutubeMeta(url);
    setFetching(false);
    if (meta) {
      if (!title) setTitle(meta.title);
      if (!artist) setArtist(meta.author);
    }
  }

  async function onSubmit(formData: FormData) {
    setError(null);
    if (!extractYoutubeId(url)) {
      setError("Paste a valid YouTube link.");
      return;
    }
    formData.set("listId", listId);
    formData.set("youtube_url", url);
    formData.set("artist", artist);
    formData.set("title", title);
    formData.set("comment", comment);
    startTransition(async () => {
      const res = await createRequest(formData);
      if (res?.error) {
        // Duplicate handling — redirect to existing request
        if (res.duplicateRequestId) {
          router.push(`${basePath}/r/${res.duplicateRequestId}`);
          return;
        }
        setError(res.error);
        return;
      }
      setUrl("");
      setArtist("");
      setTitle("");
      setComment("");
      onSubmitted?.();
    });
  }

  return (
    <form action={onSubmit} className="grid gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">YouTube link *</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={onUrlBlur}
          required
          placeholder="https://youtu.be/…"
          className="input"
        />
        {fetching && (
          <p className="mt-1 text-[11px] text-muted">Fetching title from YouTube…</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Artist *</label>
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
          maxLength={120}
          className="input"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="input"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={400}
          placeholder="Why are you recommending this?"
          className="input"
        />
      </div>
      <button type="submit" className="btn-primary justify-center" disabled={pending}>
        {pending ? "Adding…" : "Add to list"}
      </button>
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
