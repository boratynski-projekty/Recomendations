"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addComment, deleteComment } from "@/app/actions";
import { formatRelative } from "@/lib/format";
import Avatar from "./Avatar";

export type CommentItem = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: {
    slug: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  can_delete: boolean;
};

export default function CommentSection({
  requestId,
  comments,
  canComment
}: {
  requestId: string;
  comments: CommentItem[];
  canComment: boolean;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("body", body);
    startTransition(async () => {
      const res = await addComment(fd);
      if (res?.error) setError(res.error);
      else setBody("");
    });
  }

  function onDelete(id: string) {
    if (!confirm("Usunąć komentarz?")) return;
    startTransition(async () => {
      await deleteComment(id);
    });
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {comments.length > 0 && (
        <ul className="mb-3 grid gap-2">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-lg bg-bg p-3 text-sm">
              <div className="pt-0.5">
                <Avatar
                  url={c.author?.avatar_url ?? null}
                  name={c.author?.display_name ?? "?"}
                  size="md"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
                  <span className="truncate">
                    {c.author ? (
                      <Link
                        href={`/u/${c.author.slug}`}
                        className="font-medium text-white hover:text-accent"
                      >
                        {c.author.display_name}
                      </Link>
                    ) : (
                      "Nieznany"
                    )}
                    <span className="ml-2">{formatRelative(c.created_at)}</span>
                  </span>
                  {c.can_delete && (
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="flex-shrink-0 text-muted hover:text-red-300"
                      aria-label="Usuń komentarz"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-white/90">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {canComment ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={400}
            placeholder="Dodaj komentarz…"
            className="input flex-1 !py-1.5 !text-sm"
          />
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="btn !py-1.5 !text-sm"
          >
            Wyślij
          </button>
        </form>
      ) : (
        <p className="text-xs text-muted">Zaloguj się, aby dodać komentarz.</p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      )}
    </div>
  );
}
