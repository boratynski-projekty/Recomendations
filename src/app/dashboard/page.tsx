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

  // Favorites
  const { data: favorites } = await supabase
    .from("list_favorites")
    .select("list_id, lists(id, slug, title, description, owner_id)")
    .eq("user_id", user.id);

  type FavoriteRow = {
    list_id: string;
    lists: {
      id: string;
      slug: string;
      title: string;
      description: string | null;
      owner_id: string;
    } | null;
  };

  const favoriteLists = ((favorites as FavoriteRow[] | null) ?? [])
    .filter((f) => f.lists)
    .map((f) => f.lists!);

  // Owners of favorite lists (for URL building)
  const favoriteOwnerIds = Array.from(new Set(favoriteLists.map((l) => l.owner_id)));
  const { data: favoriteOwners } = favoriteOwnerIds.length
    ? await supabase
        .from("profiles")
        .select("id, slug, display_name")
        .in("id", favoriteOwnerIds)
    : { data: [] };
  const ownerMap = new Map(
    ((favoriteOwners as { id: string; slug: string; display_name: string }[]) ?? []).map(
      (o) => [o.id, o]
    )
  );

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px] md:gap-8">
      <section className="order-2 md:order-1">
        {favoriteLists.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">⭐ Favorites</h2>
            <ul className="grid gap-3">
              {favoriteLists.map((l) => {
                const owner = ownerMap.get(l.owner_id);
                if (!owner) return null;
                return (
                  <li key={l.id} className="card p-4">
                    <Link href={`/u/${owner.slug}/${l.slug}`} className="block">
                      <span className="text-base font-semibold hover:text-accent">
                        {l.title}
                      </span>
                      <p className="mt-1 text-xs text-muted">by {owner.display_name}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <h1 className="mb-1 text-2xl font-bold">My lists</h1>
        <p className="mb-6 text-sm text-muted">
          Hi {profile?.display_name}! Manage your lists here.
        </p>

        {!lists || lists.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            No lists yet. Create your first one — the form is above on mobile, on
            the right on desktop.
          </div>
        ) : (
          <ul className="grid gap-3">
            {lists.map((l) => (
              <li key={l.id} className="card p-4">
                <Link href={`/u/${profile?.slug}/${l.slug}`} className="block">
                  <span className="text-lg font-semibold hover:text-accent">
                    {l.title}
                  </span>
                  {l.description && (
                    <p className="mt-1 text-sm text-muted">{l.description}</p>
                  )}
                  <p className="mt-2 break-all text-xs text-muted">
                    /u/{profile?.slug}/{l.slug} · created {formatDate(l.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="order-1 md:order-2">
        <div className="card p-5 md:sticky md:top-4">
          <h2 className="mb-1 text-lg font-semibold">New list</h2>
          <p className="mb-4 text-xs text-muted">
            Leave the URL empty and we&apos;ll generate one. You can change it later.
          </p>
          <NewListForm />
        </div>
      </aside>
    </div>
  );
}
