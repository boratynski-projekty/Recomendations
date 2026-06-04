"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateList } from "@/app/actions";

export default function EditListModal({
  open,
  onClose,
  list
}: {
  open: boolean;
  onClose: () => void;
  list: { id: string; slug: string; title: string; description: string | null };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description ?? "");
  const [slug, setSlug] = useState(list.slug);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTitle(list.title);
      setDescription(list.description ?? "");
      setSlug(list.slug);
      setError(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, list]);

  if (!open) return null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (slug !== list.slug) {
      const confirmed = confirm(
        "You're changing the list URL. The old URL will return 404 and any existing links will break. Continue?"
      );
      if (!confirmed) return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("listId", list.id);

    startTransition(async () => {
      const res = await updateList(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      const { newSlug, profileSlug } = res as {
        newSlug?: string;
        profileSlug?: string | null;
      };
      onClose();
      if (newSlug && profileSlug) {
        router.push(`/u/${profileSlug}/${newSlug}`);
      } else {
        router.refresh();
      }
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
          <h2 className="text-lg font-semibold">Edit list</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">Title</span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            className="input"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Description (optional)
          </span>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={400}
            className="input"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-muted">URL (slug)</span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            pattern="[a-z0-9-]+"
            minLength={2}
            maxLength={48}
            className="input"
          />
          <p className="mt-1 text-[11px] text-muted">
            Changing this will break any existing links to this list.
          </p>
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
