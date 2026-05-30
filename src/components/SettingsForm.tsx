"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, deleteAvatar } from "@/app/actions";

export default function SettingsForm({
  slug,
  displayName,
  avatarUrl
}: {
  slug: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [name, setName] = useState(displayName);
  const [slugInput, setSlugInput] = useState(slug);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function onRemoveAvatar() {
    if (!confirm("Usunąć avatar? Wróci domyślny inicjał.")) return;
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await deleteAvatar();
      if (res?.error) {
        setError(res.error);
        return;
      }
      setPreview(null);
      if (fileInput.current) fileInput.current.value = "";
      setOk(true);
      router.refresh();
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setError("Plik większy niż 2 MB.");
      e.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Wybierz JPG, PNG lub WebP.");
      e.target.value = "";
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfile(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOk(true);
      // Jeśli slug się zmienił — przekieruj do nowego profilu
      const newSlug = (res as { newSlug?: string }).newSlug;
      if (newSlug) {
        router.push(`/u/${newSlug}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Avatar
        </h2>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border border-border bg-bg">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-muted">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInput}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFile}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="btn"
              >
                {preview ? "Zmień plik" : "Wybierz plik"}
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  disabled={pending}
                  className="btn !text-red-300 hover:!border-red-400"
                >
                  Usuń avatar
                </button>
              )}
            </div>
            <p className="text-xs text-muted">JPG / PNG / WebP, max 2 MB.</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Dane podstawowe
        </h2>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Wyświetlana nazwa
          </span>
          <input
            name="display_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Adres profilu (slug)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">/u/</span>
            <input
              name="slug"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              pattern="[a-z0-9-]+"
              minLength={2}
              maxLength={48}
              className="input"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            a-z, 0-9, myślniki. Zmiana sluga przekieruje Cię na nowy adres profilu.
          </p>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Zapisuję…" : "Zapisz zmiany"}
        </button>
        {ok && <span className="text-sm text-green-300">✓ Zapisano</span>}
      </div>
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
