"use client";

import { useState, useTransition } from "react";
import { createList } from "@/app/actions";

export default function NewListForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createList(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form action={onSubmit} className="grid gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Tytuł listy</label>
        <input
          name="title"
          required
          maxLength={120}
          placeholder="np. Reakcje muzyczne 2026"
          className="input"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Opis (opcjonalny)</label>
        <textarea
          name="description"
          rows={2}
          maxLength={400}
          placeholder="Krótki opis, co tu wrzucać"
          className="input"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Adres (slug)</label>
        <input
          name="slug"
          placeholder="opcjonalny — zostaw puste"
          pattern="[a-z0-9-]*"
          className="input"
        />
        <p className="mt-1 text-[11px] text-muted">
          a-z, 0-9, myślniki. Możesz zmienić później.
        </p>
      </div>
      <button type="submit" className="btn-primary justify-center" disabled={pending}>
        {pending ? "Tworzę…" : "Utwórz listę"}
      </button>
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
