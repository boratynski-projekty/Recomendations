import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

type Filter = "all" | "active" | "done";

type RequestRow = {
  id: string;
  list_id: string;
  artist: string;
  title: string;
  youtube_id: string;
  completed_at: string | null;
  completion_url: string | null;
  created_at: string;
  vote_count: number;
  comment_count: number;
};

type ListRow = {
  id: string;
  slug: string;
  title: string;
  owner_id: string;
};

type OwnerRow = {
  id: string;
  slug: string;
  display_name: string;
};

export default async function MyRequestsPage({
  searchParams
}: {
  searchParams?: { filter?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter: Filter =
    searchParams?.filter === "active"
      ? "active"
      : searchParams?.filter === "done"
      ? "done"
      : "all";

  const { data: requests } = await supabase
    .from("requests_with_counts")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const rows = (requests as RequestRow[] | null) ?? [];

  // Filtrowanie
  const filtered = rows.filter((r) => {
    if (filter === "active") return !r.completed_at;
    if (filter === "done") return !!r.completed_at;
    return true;
  });

  // Pobierz listy i ownerów
  const listIds = Array.from(new Set(filtered.map((r) => r.list_id)));
  const { data: lists } = listIds.length
    ? await supabase
        .from("lists")
        .select("id, slug, title, owner_id")
        .in("id", listIds)
    : { data: [] };
  const listMap = new Map(
    ((lists as ListRow[] | null) ?? []).map((l) => [l.id, l])
  );

  const ownerIds = Array.from(
    new Set(((lists as ListRow[] | null) ?? []).map((l) => l.owner_id))
  );
  const { data: owners } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, slug, display_name")
        .in("id", ownerIds)
    : { data: [] };
  const ownerMap = new Map(
    ((owners as OwnerRow[] | null) ?? []).map((o) => [o.id, o])
  );

  // Grupowanie per lista
  const grouped = new Map<string, RequestRow[]>();
  filtered.forEach((r) => {
    const arr = grouped.get(r.list_id) ?? [];
    arr.push(r);
    grouped.set(r.list_id, arr);
  });

  const groupEntries = Array.from(grouped.entries());

  const counts = {
    all: rows.length,
    active: rows.filter((r) => !r.completed_at).length,
    done: rows.filter((r) => !!r.completed_at).length
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">My requests</h1>
      <p className="mb-6 text-sm text-muted">
        All requests you&apos;ve submitted, grouped by list.
      </p>

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1">
        {(
          [
            ["all", `All (${counts.all})`],
            ["active", `Active (${counts.active})`],
            ["done", `Done (${counts.done})`]
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={key === "all" ? "/my-requests" : `/my-requests?filter=${key}`}
            className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm transition sm:flex-initial ${
              filter === key ? "bg-accent text-black" : "text-muted hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {groupEntries.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          {filter === "all"
            ? "You haven't submitted any requests yet."
            : `No ${filter} requests.`}
        </div>
      ) : (
        <div className="grid gap-6">
          {groupEntries.map(([listId, items]) => {
            const list = listMap.get(listId);
            if (!list) return null;
            const owner = ownerMap.get(list.owner_id);
            if (!owner) return null;
            const basePath = `/u/${owner.slug}/${list.slug}`;

            return (
              <section key={listId}>
                <header className="mb-2 flex items-baseline justify-between gap-2">
                  <Link
                    href={basePath}
                    className="text-lg font-semibold hover:text-accent"
                  >
                    {list.title}
                  </Link>
                  <span className="text-xs text-muted">
                    by{" "}
                    <Link
                      href={`/u/${owner.slug}`}
                      className="hover:text-white"
                    >
                      {owner.display_name}
                    </Link>{" "}
                    · {items.length} request{items.length === 1 ? "" : "s"}
                  </span>
                </header>
                <ul className="grid gap-2">
                  {items.map((r) => (
                    <li key={r.id} className="card overflow-hidden">
                      <Link
                        href={`${basePath}/r/${r.id}`}
                        className="flex gap-3 p-3"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://i.ytimg.com/vi/${r.youtube_id}/mqdefault.jpg`}
                          alt=""
                          className="h-14 w-24 flex-shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs text-muted">
                            {r.artist}
                          </div>
                          <div className="line-clamp-2 font-semibold leading-tight hover:text-accent">
                            {r.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                            <span>▲ {r.vote_count}</span>
                            <span>💬 {r.comment_count}</span>
                            <span>·</span>
                            <span>{formatRelative(r.created_at)}</span>
                            {r.completed_at && (
                              <>
                                <span>·</span>
                                <span className="text-green-300">✓ Done</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
