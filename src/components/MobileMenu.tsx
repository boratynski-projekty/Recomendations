"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";

const linkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #24242f",
  padding: "16px 20px",
  fontSize: 18,
  color: "#fff",
  backgroundColor: "#0b0b10",
  textDecoration: "none",
  cursor: "pointer"
};

const arrowStyle: React.CSSProperties = { color: "#9ca3af" };

const disabledLinkStyle: React.CSSProperties = {
  ...linkStyle,
  opacity: 0.45,
  pointerEvents: "none"
};

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid #4b4b58",
        borderTopColor: "#a78bfa",
        borderRadius: "50%",
        animation: "rmMenuSpin 0.7s linear infinite"
      }}
    />
  );
}

type MenuLink = { href: string; label: string };

export default function MobileMenu({ profileSlug }: { profileSlug: string | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [navHref, setNavHref] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const wasPending = useRef(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Zamknij menu dopiero gdy transition się skończy (tj. po pełnym RSC fetchu)
  useEffect(() => {
    if (wasPending.current && !pending) {
      setOpen(false);
      setNavHref(null);
    }
    wasPending.current = pending;
  }, [pending]);

  // Safety net: jak pathname się zmienił z innego powodu (np. swipe back), zamknij
  useEffect(() => {
    setOpen(false);
    setNavHref(null);
  }, [pathname]);

  function close() {
    setOpen(false);
  }

  function go(href: string) {
    if (pathname === href) {
      setOpen(false);
      return;
    }
    setNavHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  const links: MenuLink[] = [
    { href: "/dashboard", label: "My lists" },
    { href: "/my-requests", label: "My requests" },
    ...(profileSlug ? [{ href: `/u/${profileSlug}`, label: "My profile" }] : []),
    { href: "/settings", label: "Settings" },
    { href: "/contact", label: "Contact" }
  ];

  const dialog = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
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
          padding: "12px 16px",
          flex: "0 0 auto"
        }}
      >
        <span className="text-lg font-bold tracking-tight">
          <span className="text-accent">REQUEST</span>ube
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Close menu"
          disabled={pending}
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
            backgroundColor: "transparent",
            opacity: pending ? 0.5 : 1
          }}
        >
          ✕
        </button>
      </div>

      <nav
        style={{
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          backgroundColor: "#0b0b10",
          overflowY: "auto"
        }}
      >
        {links.map((l) => {
          const isActive = navHref === l.href;
          const isDimmed = pending && !isActive;
          return (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                if (pending) return;
                go(l.href);
              }}
              style={isDimmed ? disabledLinkStyle : linkStyle}
            >
              <span>{l.label}</span>
              {isActive ? <Spinner /> : <span style={arrowStyle}>→</span>}
            </a>
          );
        })}
      </nav>

      <div
        style={{
          borderTop: "1px solid #24242f",
          backgroundColor: "#15151d",
          padding: 20,
          flex: "0 0 auto"
        }}
      >
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            disabled={pending}
            className="btn w-full justify-center !py-3 !text-base"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

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
        @keyframes rmMenuSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {open && mounted && createPortal(dialog, document.body)}
    </>
  );
}
