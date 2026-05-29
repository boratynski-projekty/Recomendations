"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequestForm from "./RequestForm";

export default function MobileAddRequest({
  listId,
  isLoggedIn
}: {
  listId: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-accent bg-accent px-5 py-3 font-semibold text-black shadow-lg shadow-black/40 md:hidden"
      >
        <span className="text-lg leading-none">＋</span>
        <span>Dodaj rekomendację</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/70 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Dodaj rekomendację</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl text-muted"
                aria-label="Zamknij"
              >
                ✕
              </button>
            </div>
            {isLoggedIn ? (
              <RequestForm listId={listId} onSubmitted={() => setOpen(false)} />
            ) : (
              <p className="text-sm text-muted">
                <Link href="/login" className="text-accent hover:underline">
                  Zaloguj się
                </Link>{" "}
                by dodać swój request.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
