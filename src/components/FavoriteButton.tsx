"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions";

export default function FavoriteButton({
  listId,
  initialFavorited,
  canFavorite
}: {
  listId: string;
  initialFavorited: boolean;
  canFavorite: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  async function onClick() {
    if (!canFavorite) {
      router.push("/login");
      return;
    }
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const res = await toggleFavorite(listId);
      if (res?.error) setFavorited(!next);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={
        canFavorite
          ? favorited
            ? "Remove from favorites"
            : "Add to favorites"
          : "Sign in to add favorites"
      }
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
        favorited
          ? "border-accent bg-accent text-black"
          : "border-border bg-surface text-muted hover:border-accent hover:text-white"
      }`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}
