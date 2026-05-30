"use client";

import { useState, useTransition } from "react";
import {
  deleteRequest,
  markRequestCompleted,
  unmarkRequestCompleted
} from "@/app/actions";

export default function OwnerControls({
  requestId,
  isCompleted
}: {
  requestId: string;
  isCompleted: boolean;
}) {
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completionUrl, setCompletionUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("Na pewno usunąć tę pozycję?")) return;
    startTransition(async () => {
      const res = await deleteRequest(requestId);
      if (res?.error) setError(res.error);
    });
  }

  function onMarkCompleted() {
    setError(null);
    startTransition(async () => {
      const res = await markRequestCompleted(requestId, completionUrl);
      if (res?.error) setError(res.error);
      else {
        setShowCompleteForm(false);
        setCompletionUrl("");
      }
    });
  }

  function onUnmark() {
    startTransition(async () => {
      const res = await unmarkRequestCompleted(requestId);
      if (res?.error) setError(res.error);
    });
  }

  if (isCompleted) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUnmark}
          disabled={pending}
          className="btn !py-1 !text-xs"
        >
          Cofnij realizację
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="btn !py-1 !text-xs text-red-300 hover:!border-red-400"
        >
          Usuń
        </button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {!showCompleteForm && (
          <button
            type="button"
            onClick={() => setShowCompleteForm(true)}
            disabled={pending}
            className="btn !py-1 !text-xs"
          >
            ✓ Zrealizowane
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="btn !py-1 !text-xs text-red-300 hover:!border-red-400"
        >
          Usuń
        </button>
      </div>
      {showCompleteForm && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-bg p-2">
          <input
            value={completionUrl}
            onChange={(e) => setCompletionUrl(e.target.value)}
            placeholder="Link YouTube do twojej reakcji"
            className="input !py-1 !text-xs"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onMarkCompleted}
              disabled={pending || !completionUrl}
              className="btn-primary !py-1 !text-xs"
            >
              Zapisz
            </button>
            <button
              type="button"
              onClick={() => setShowCompleteForm(false)}
              disabled={pending}
              className="btn !py-1 !text-xs"
            >
              Anuluj
            </button>
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      )}
    </div>
  );
}
