"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const linkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #24242f",
  padding: "16px 20px",
  fontSize: 18,
  color: "#fff",
  backgroundColor: "#0b0b10",
  textDecoration: "none"
};

const arrowStyle: React.CSSProperties = {
  color: "#9ca3af"
};

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
        className="mobile-menu-trigger"
      >
        <span aria-hidden="true" className="mobile-menu-bars">
          <span />
          <span />
          <span />
        </span>
      </button>

      <style>{`
        .mobile-menu-trigger {
          display: none;
          align-items: center;
          justify-content: center;
          height: 36px;
          width: 36px;
          border: 1px solid #24242f;
          border-radius: 8px;
          background-color: #15151d;
          color: #fff;
        }
        .mobile-menu-bars {
          display: inline-flex;
          flex-direction: column;
          gap: 3px;
        }
        .mobile-menu-bars > span {
          display: block;
          height: 2px;
          width: 16px;
          background-color: #fff;
        }
        @media (max-width: 639.98px) {
          .mobile-menu-trigger { display: inline-flex; }
        }
      `}</style>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0b0b10",
            backdropFilter: "none"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #24242f",
              backgroundColor: "#15151d",
              padding: "12px 16px"
            }}
          >
            <span className="text-lg font-bold tracking-tight">
              <span className="text-accent">REQUEST</span>ube
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 36,
                width: 36,
                border: "1px solid #24242f",
                borderRadius: 8,
                color: "#fff",
                fontSize: 20,
                backgroundColor: "transparent"
              }}
            >
              ✕
            </button>
          </div>

          <nav
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              backgroundColor: "#0b0b10",
              overflowY: "auto"
            }}
          >
            <Link href="/dashboard" onClick={close} style={linkStyle}>
              <span>My lists</span>
              <span style={arrowStyle}>→</span>
            </Link>
            <Link href="/my-requests" onClick={close} style={linkStyle}>
              <span>My requests</span>
              <span style={arrowStyle}>→</span>
            </Link>
            {profileSlug && (
              <Link href={`/u/${profileSlug}`} onClick={close} style={linkStyle}>
                <span>My profile</span>
                <span style={arrowStyle}>→</span>
              </Link>
            )}
            <Link href="/settings" onClick={close} style={linkStyle}>
              <span>Settings</span>
              <span style={arrowStyle}>→</span>
            </Link>
            <Link href="/contact" onClick={close} style={linkStyle}>
              <span>Contact</span>
              <span style={arrowStyle}>→</span>
            </Link>
          </nav>

          <div
            style={{
              borderTop: "1px solid #24242f",
              backgroundColor: "#15151d",
              padding: 20
            }}
          >
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="btn w-full justify-center !py-3 !text-base"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
