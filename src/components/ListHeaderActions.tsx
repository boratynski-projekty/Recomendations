"use client";

import { useState } from "react";
import EditListModal from "./EditListModal";
import FavoriteButton from "./FavoriteButton";

export default function ListHeaderActions({
  list,
  isOwner,
  isLoggedIn,
  initialFavorited
}: {
  list: { id: string; slug: string; title: string; description: string | null };
  isOwner: boolean;
  isLoggedIn: boolean;
  initialFavorited: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <FavoriteButton
        listId={list.id}
        initialFavorited={initialFavorited}
        canFavorite={isLoggedIn}
      />
      {isOwner && (
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:border-accent hover:text-white"
          aria-label="Edit list"
          title="Edit list"
        >
          ✎
        </button>
      )}
      <EditListModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        list={list}
      />
    </div>
  );
}
