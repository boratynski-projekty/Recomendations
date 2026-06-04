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

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
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
        <div className="fixed inset-0 z-50 flex flex-col bg-bg sm:hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-accent">REQUEST</span>ube
            </span>
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-2xl text-white"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-1 flex-col">
            <Link
              href="/dashboard"
              onClick={close}
              className="flex items-center justify-between border-b border-border px-5 py-4 text-lg text-white active:bg-surface"
            >
              <span>My lists</span>
              <span className="text-muted">→</span>
            </Link>
            <Link
              href="/my-requests"
              onClick={close}
              className="flex items-center justify-between border-b border-border px-5 py-4 text-lg text-white active:bg-surface"
            >
              <span>My requests</span>
              <span className="text-muted">→</span>
            </Link>
            {profileSlug && (
              <Link
                href={`/u/${profileSlug}`}
                onClick={close}
                className="flex items-center justify-between border-b border-border px-5 py-4 text-lg text-white active:bg-surface"
              >
                <span>My profile</span>
                <span className="text-muted">→</span>
              </Link>
            )}
            <Link
              href="/settings"
              onClick={close}
              className="flex items-center justify-between border-b border-border px-5 py-4 text-lg text-white active:bg-surface"
            >
              <span>Settings</span>
              <span className="text-muted">→</span>
            </Link>
            <Link
              href="/contact"
              onClick={close}
              className="flex items-center justify-between border-b border-border px-5 py-4 text-lg text-white active:bg-surface"
            >
              <span>Contact</span>
              <span className="text-muted">→</span>
            </Link>
          </nav>

          <div className="border-t border-border bg-surface p-5">
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn w-full justify-center !py-3 !text-base">
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
