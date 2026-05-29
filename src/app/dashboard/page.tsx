import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import NewListForm from "@/components/NewListForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug, display_name")
    .eq("id", user.id)
    .single();

  const { data: lists } = await supabase
    .from("lists")
    .select("id, slug, title, description, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <section>
        <h1 className="mb-1 text-2xl font-bold">Moje listy</h1>
        <p className="mb-6 text-sm text-muted">
          Cześć, {profile?.display_name}! Tu zarządzasz swoimi listami.
        </p>

        {!lists || lists.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            Jeszcze nie masz żadnej listy. Załóż pierwszą po prawej →
          </div>
        ) : (
          <ul className="grid gap-3">
            {lists.map((l) => (
              <li key={l.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/u/${profile?.slug}/${l.slug}`}
                      className="text-lg font-semibold hover:text-accent"
                    >
                      {l.title}
                    </Link>
                    {l.description && (
                      <p className="mt-1 text-sm text-muted">{l.description}</p>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      /u/{profile?.slug}/{l.slug} · założona {formatDate(l.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside>
        <div className="card p-5">
          <h2 className="mb-1 text-lg font-semibold">Nowa lista</h2>
          <p className="mb-4 text-xs text-muted">
            Adres możesz zostawić pusty — wygenerujemy losowy. Można zmienić
            później.
          </p>
          <NewListForm />
        </div>
      </aside>
    </div>
  );
}
