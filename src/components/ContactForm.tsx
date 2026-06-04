"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "@/app/actions";

export default function ContactForm({
  isLoggedIn,
  userEmail
}: {
  isLoggedIn: boolean;
  userEmail: string | null;
}) {
  const [kind, setKind] = useState<"bug" | "suggestion" | "other">("suggestion");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("kind", kind);
    startTransition(async () => {
      const res = await submitFeedback(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSent(true);
      setSubject("");
      setBody("");
    });
  }

  if (sent) {
    return (
      <div className="card p-6 text-center">
        <div className="mb-2 text-3xl">✓</div>
        <h2 className="mb-1 text-lg font-semibold">Thanks!</h2>
        <p className="text-sm text-muted">
          Your message landed in our inbox. We&apos;ll get back to you if needed.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="btn mt-4"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="card p-5">
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">Type</span>
          <div className="flex gap-2">
            {(
              [
                ["bug", "🐛 Bug"],
                ["suggestion", "💡 Suggestion"],
                ["other", "💬 Other"]
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                  kind === value
                    ? "border-accent bg-accent text-black"
                    : "border-border bg-bg text-white hover:border-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">Subject</span>
          <input
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={120}
            placeholder="One-line summary"
            className="input"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">Message</span>
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            maxLength={4000}
            placeholder="Describe what happened or what you'd like to see"
            className="input"
          />
        </label>

        {!isLoggedIn && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Your email (so we can reply)
            </span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!isLoggedIn}
              maxLength={200}
              placeholder="you@example.com"
              className="input"
            />
          </label>
        )}

        {isLoggedIn && userEmail && (
          <p className="text-xs text-muted">
            Sending as <span className="text-white">{userEmail}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
