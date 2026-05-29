import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";
import RequestDetail from "@/components/RequestDetail";
import type { CommentItem } from "@/components/CommentSection";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params
}: {
  params: { userSlug: string; listSlug: string; requestId: string };
}) {
  const supabase = createClient();

  // Profil ownera + lista — do walidacji że request należy do tej listy
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug, display_name")
    .eq("slug", params.userSlug)
    .maybeSingle();
  if (!profile) notFound();

  const { data: list } = await supabase
    .from("lists")
    .select("id, slug, title, owner_id")
    .eq("owner_id", profile.id)
    .eq("slug", params.listSlug)
    .maybeSingle();
  if (!list) notFound();

  const { data: request } = await supabase
    .from("requests_with_counts")
    .select("*")
    .eq("id", params.requestId)
    .eq("list_id", list.id)
    .maybeSingle();
  if (!request) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("slug, display_name, avatar_url")
    .eq("id", request.created_by)
    .maybeSingle();

  // Bieżący user — do voted + can_vote + komentarz delete rights
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let hasMyVote = false;
  if (user) {
    const { data: v } = await supabase
      .from("votes")
      .select("request_id")
      .eq("request_id", request.id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasMyVote = !!v;
  }

  // Komentarze + autorzy
  const { data: rawComments } = await supabase
    .from("comments")
    .select("id, user_id, body, created_at")
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  const commenterIds = Array.from(new Set((rawComments ?? []).map((c) => c.user_id)));
  const { data: commenters } = commenterIds.length
    ? await supabase
        .from("profiles")
        .select("id, slug, display_name, avatar_url")
        .in("id", commenterIds)
    : { data: [] };
  const commenterMap = new Map((commenters ?? []).map((c) => [c.id, c]));

  const comments: CommentItem[] = (rawComments ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    user_id: c.user_id,
    author: commenterMap.get(c.user_id) ?? null,
    can_delete: !!user && (user.id === c.user_id || user.id === list.owner_id)
  }));

  const isOwner = !!user && user.id === list.owner_id;
  const canVote =
    !!user && user.id !== request.created_by && request.completed_at === null;

  const backHref = `/u/${profile.slug}/${list.slug}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white"
      >
        ← Wróć do listy „{list.title}"
      </Link>

      <RequestDetail
        request={{
          id: request.id,
          artist: request.artist,
          title: request.title,
          youtube_id: request.youtube_id,
          youtube_url: request.youtube_url,
          comment: request.comment,
          completed_at: request.completed_at,
          completion_url: request.completion_url,
          created_at: request.created_at,
          vote_count: request.vote_count,
          author: author
            ? {
                slug: author.slug,
                display_name: author.display_name,
                avatar_url: author.avatar_url
              }
            : null,
          has_my_vote: hasMyVote,
          can_vote: canVote
        }}
        comments={comments}
        isOwner={isOwner}
        isLoggedIn={!!user}
      />

      <p className="mt-6 text-xs text-muted">
        Dodano {formatRelative(request.created_at)}
      </p>
    </div>
  );
}
