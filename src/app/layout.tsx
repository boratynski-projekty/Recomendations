import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MobileMenu from "@/components/MobileMenu";

export const metadata: Metadata = {
  title: "Recomendations",
  description: "Listy rekomendacji dla twórców reakcji i analiz muzycznych."
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let profileSlug: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("slug")
      .eq("id", user.id)
      .maybeSingle();
    profileSlug = data?.slug ?? null;
  }

  return (
    <html lang="pl">
      <body>
        <header className="border-b border-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-accent">Reco</span>mendations
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden text-muted hover:text-white sm:inline"
                  >
                    Moje listy
                  </Link>
                  {profileSlug && (
                    <Link
                      href={`/u/${profileSlug}`}
                      className="hidden text-muted hover:text-white sm:inline"
                    >
                      Mój profil
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    className="hidden text-muted hover:text-white sm:inline"
                  >
                    Ustawienia
                  </Link>
                  <form action="/auth/signout" method="post" className="hidden sm:block">
                    <button type="submit" className="btn">
                      Wyloguj
                    </button>
                  </form>
                  <MobileMenu profileSlug={profileSlug} />
                </>
              ) : (
                <Link href="/login" className="btn-primary">
                  Zaloguj przez Google
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:py-8 sm:pb-8">{children}</main>
      </body>
    </html>
  );
}
