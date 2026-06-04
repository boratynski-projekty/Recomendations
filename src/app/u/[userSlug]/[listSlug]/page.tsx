import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RequestsView, { type RequestRow } from "@/components/RequestsView";
import RequestForm from "@/components/RequestForm";
import MobileAddRequest from "@/components/MobileAddRequest";
import ListHeaderActions from "@/components/ListHeaderActions";

export const dynamic = "force-dynamic";

export default async function ListPage({
  params
}: {
  params: { userSlug: string; listSlug: string };
}) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug, display_name, avatar_url")
    .eq("slug", params.userSlug)
    .maybeSingle();
  if (!profile) notFound();

  const { data: list } = await supabase
    .from("lists")
    .select("id, slug, title, description, owner_id, created_at")
    .eq("owner_id", profile.id)
    .eq("slug", params.listSlug)
    .maybeSingle();
  if (!list) notFound();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: requests } = await supabase
    .from("requests_with_counts")
    .select("*")
    .eq("list_id", list.id)
    .order("created_at", { ascending: false });

  const authorIds = Array.from(new Set((requests ?? []).map((r) => r.created_by)));
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, slug, display_name, avatar_url")
        .in("id", authorIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  let myVotes: Set<string> = new Set();
  let isFavorited = false;
  if (user) {
    if (requests && requests.length) {
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
    const { data: fav } = await supabase
      .from("list_favorites")
      .select("list_id")
      .eq("user_id", user.id)
      .eq("list_id", list.id)
      .maybeSingle();
    isFavorited = !!fav;
  }

  const isOwner = !!user && user.id === list.owner_id;
  const isLoggedIn = !!user;
  const basePath = `/u/${profile.slug}/${list.slug}`;

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
    comment_count: r.comment_count,
    author: authorMap.get(r.created_by) ?? null,
    has_my_vote: myVotes.has(r.id),
    can_vote: isLoggedIn && user!.id !== r.created_by && r.completed_at === null
  }));

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px] md:gap-8">
      <section>
        <header className="mb-6">
          <p className="text-xs text-muted">
            <Link href={`/u/${profile.slug}`} className="hover:text-accent">
              {profile.display_name}
            </Link>
            <span className="mx-1">·</span>
            <span className="break-all">/u/{profile.slug}/{list.slug}</span>
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">{list.title}</h1>
            <ListHeaderActions
              list={{
                id: list.id,
                slug: list.slug,
                title: list.title,
                description: list.description
              }}
              isOwner={isOwner}
              isLoggedIn={isLoggedIn}
              initialFavorited={isFavorited}
            />
          </div>
          {list.description && (
            <p className="mt-2 text-sm text-muted sm:text-base">{list.description}</p>
          )}
        </header>

        <RequestsView
          rows={rows}
          isOwner={isOwner}
          isLoggedIn={isLoggedIn}
          basePath={basePath}
        />
      </section>

      <aside className="hidden md:block">
        <div className="card sticky top-4 p-5">
          <h2 className="mb-3 text-lg font-semibold">Add a request</h2>
          {isLoggedIn ? (
            <RequestForm listId={list.id} basePath={basePath} />
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>{" "}
              to submit a request.
            </p>
          )}
        </div>
      </aside>

      <MobileAddRequest
        listId={list.id}
        basePath={basePath}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
