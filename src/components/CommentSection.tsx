"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addComment, deleteComment } from "@/app/actions";
import { formatRelative } from "@/lib/format";

export type CommentItem = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: { slug: string; display_name: string } | null;
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
      if (res && "error" in res) setError(res.error);
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
            <li key={c.id} className="rounded-lg bg-bg p-2 text-sm">
              <div className="mb-0.5 flex items-center justify-between gap-2 text-xs text-muted">
                <span>
                  {c.author ? (
                    <Link
                      href={`/u/${c.author.slug}`}
                      className="hover:text-white"
                    >
                      {c.author.display_name}
                    </Link>
                  ) : (
                    "Nieznany"
                  )}{" "}
                  · {formatRelative(c.created_at)}
                </span>
                {c.can_delete && (
                  <button
                    type="button"
                    onClick={() => onDelete(c.id)}
                    className="text-muted hover:text-red-300"
                    aria-label="Usuń komentarz"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-white/90">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {canComment ? (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={400}
            placeholder="Dodaj komentarz…"
            className="input !py-1 !text-xs"
          />
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="btn !py-1 !text-xs"
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
