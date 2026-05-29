"use client";

import { useState, useTransition } from "react";
import { toggleVote } from "@/app/actions";

export default function VoteButton({
  requestId,
  initialCount,
  initialVoted,
  canVote
}: {
  requestId: string;
  initialCount: number;
  initialVoted: boolean;
  canVote: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [pending, startTransition] = useTransition();

  async function onClick() {
    if (!canVote) return;
    // Optimistic update
    const nextVoted = !voted;
    setVoted(nextVoted);
    setCount((c) => c + (nextVoted ? 1 : -1));
    startTransition(async () => {
      const res = await toggleVote(requestId);
      if (res && "error" in res) {
        // Rollback
        setVoted(!nextVoted);
        setCount((c) => c + (nextVoted ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canVote || pending}
      title={
        canVote
          ? voted
            ? "Cofnij głos"
            : "Zagłosuj"
          : "Nie możesz głosować na ten request"
      }
      className={`flex min-w-[56px] flex-col items-center justify-center rounded-lg border px-3 py-2 text-sm transition ${
        voted
          ? "border-accent bg-accent text-black"
          : "border-border bg-bg text-white hover:border-accent"
      } ${!canVote ? "opacity-50" : ""}`}
    >
      <span className="text-lg leading-none">▲</span>
      <span className="font-semibold">{count}</span>
    </button>
  );
}
