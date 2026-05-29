import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
        Twoja lista <span className="text-accent">rekomendacji</span>
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-muted">
        Załóż swoją listę i przyjmuj zgłoszenia od widzów. Oni głosują na
        propozycje, Ty wybierasz co zrobić na żywo lub na kanale.
      </p>
      <Link href="/login" className="btn-primary">
        Zaczynamy — zaloguj przez Google
      </Link>

      <div className="mt-16 grid gap-4 text-left md:grid-cols-3">
        <div className="card p-5">
          <div className="mb-2 text-2xl">📝</div>
          <h3 className="mb-1 font-semibold">Załóż listę</h3>
          <p className="text-sm text-muted">
            Każda lista ma swój adres, który możesz wrzucić na strim lub do
            opisu filmu.
          </p>
        </div>
        <div className="card p-5">
          <div className="mb-2 text-2xl">🎶</div>
          <h3 className="mb-1 font-semibold">Widzowie zgłaszają</h3>
          <p className="text-sm text-muted">
            Wklejają link do YouTube, dopisują artystę i komentarz. Tytuł
            uzupełnia się automatycznie.
          </p>
        </div>
        <div className="card p-5">
          <div className="mb-2 text-2xl">🏆</div>
          <h3 className="mb-1 font-semibold">Głosowanie i realizacja</h3>
          <p className="text-sm text-muted">
            Społeczność głosuje, Ty wybierasz i oznaczasz pozycję jako
            zrealizowaną, dodając link do swojej reakcji.
          </p>
        </div>
      </div>
    </div>
  );
}
