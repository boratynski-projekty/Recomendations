"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MobileMenu({ profileSlug }: { profileSlug: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Otwórz menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-white sm:hidden"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-[2px] w-4 bg-white" />
          <span className="block h-[2px] w-4 bg-white" />
          <span className="block h-[2px] w-4 bg-white" />
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 sm:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-64 border-l border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mb-6 text-2xl text-muted"
              aria-label="Zamknij menu"
            >
              ✕
            </button>
            <nav className="grid gap-3 text-base">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="text-white hover:text-accent"
              >
                Moje listy
              </Link>
              {profileSlug && (
                <Link
                  href={`/u/${profileSlug}`}
                  onClick={() => setOpen(false)}
                  className="text-white hover:text-accent"
                >
                  Mój profil
                </Link>
              )}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="text-white hover:text-accent"
              >
                Ustawienia
              </Link>
              <form action="/auth/signout" method="post" className="mt-4">
                <button type="submit" className="btn w-full justify-center">
                  Wyloguj
                </button>
              </form>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
