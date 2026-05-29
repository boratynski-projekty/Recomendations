import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RequestsView, { type RequestRow } from "@/components/RequestsView";
import RequestForm from "@/components/RequestForm";

export const dynamic = "force-dynamic";

export default async function ListPage({
  params
}: {
  params: { userSlug: string; listSlug: string };
}) {
  const supabase = createClient();

  // 1) Profil ownera
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug, display_name, avatar_url")
    .eq("slug", params.userSlug)
    .maybeSingle();
  if (!profile) notFound();

  // 2) Lista
  const { data: list } = await supabase
    .from("lists")
    .select("id, slug, title, description, owner_id, created_at")
    .eq("owner_id", profile.id)
    .eq("slug", params.listSlug)
    .maybeSingle();
  if (!list) notFound();

  // 3) Bieżący użytkownik
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // 4) Requesty z liczbą głosów
  const { data: requests } = await supabase
    .from("requests_with_counts")
    .select("*")
    .eq("list_id", list.id)
    .order("created_at", { ascending: false });

  // 5) Dane autorów dla wszystkich requestów
  const authorIds = Array.from(new Set((requests ?? []).map((r) => r.created_by)));
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, slug, display_name, avatar_url")
        .in("id", authorIds)
    : { data: [] };

  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  // 6) Moje głosy (na które requesty z tej listy oddałem głos)
  let myVotes: Set<string> = new Set();
  if (user && requests && requests.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("request_id")
      .eq("user_id", user.id)
      .in(
        "request_id",
        requests.map((r) => r.id)
      );
    myVotes = new Set((votes ?? []).map((v) => v.request_id));
  }

  // 7) Komentarze
  const { data: comments } = requests && requests.length
    ? await supabase
        .from("comments")
        .select("id, request_id, user_id, body, created_at")
        .in(
          "request_id",
          requests.map((r) => r.id)
        )
        .order("created_at", { ascending: true })
    : { data: [] };

  // Profile komentujących
  const commenterIds = Array.from(new Set((comments ?? []).map((c) => c.user_id)));
  const { data: commenters } = commenterIds.length
    ? await supabase
        .from("profiles")
        .select("id, slug, display_name")
        .in("id", commenterIds)
    : { data: [] };
  const commenterMap = new Map((commenters ?? []).map((c) => [c.id, c]));

  const isOwner = !!user && user.id === list.owner_id;
  const isLoggedIn = !!user;

  // Zbuduj rows do widoku
  const rows: RequestRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    artist: r.artist,
    title: r.title,
    youtube_url: r.youtube_url,
    youtube_id: r.youtube_id,
    comment: r.comment,
    completed_at: r.completed_at,
    completion_url: r.completion_url,
    created_at: r.created_at,
    created_by: r.created_by,
    vote_count: r.vote_count,
    author: authorMap.get(r.created_by) ?? null,
    has_my_vote: myVotes.has(r.id),
    can_vote: isLoggedIn && user!.id !== r.created_by && r.completed_at === null,
    comments: (comments ?? [])
      .filter((c) => c.request_id === r.id)
      .map((c) => ({
        id: c.id,
        body: c.body,
        created_at: c.created_at,
        user_id: c.user_id,
        author: commenterMap.get(c.user_id) ?? null,
        can_delete:
          !!user && (user.id === c.user_id || user.id === list.owner_id)
      }))
  }));

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <section>
        <header className="mb-6">
          <p className="text-xs text-muted">
            <Link href={`/u/${profile.slug}`} className="hover:text-accent">
              {profile.display_name}
            </Link>
            {" · "}
            /u/{profile.slug}/{list.slug}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{list.title}</h1>
          {list.description && (
            <p className="mt-2 text-muted">{list.description}</p>
          )}
        </header>

        <RequestsView rows={rows} isOwner={isOwner} isLoggedIn={isLoggedIn} />
      </section>

      <aside>
        <div className="card p-5">
          <h2 className="mb-3 text-lg font-semibold">Dodaj rekomendację</h2>
          {isLoggedIn ? (
            <RequestForm listId={list.id} />
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login" className="text-accent hover:underline">
                Zaloguj się
              </Link>{" "}
              by dodać swój request.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
