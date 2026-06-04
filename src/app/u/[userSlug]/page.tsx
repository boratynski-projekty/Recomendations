import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params
}: {
  params: { userSlug: string };
}) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug, display_name, avatar_url")
    .eq("slug", params.userSlug)
    .maybeSingle();

  if (!profile) notFound();

  const { data: lists } = await supabase
    .from("lists")
    .select("id, slug, title, description, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <header className="mb-8 flex items-center gap-4">
        <Avatar url={profile.avatar_url} name={profile.display_name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">
            {profile.display_name}
          </h1>
          <p className="break-all text-xs text-muted sm:text-sm">/u/{profile.slug}</p>
        </div>
      </header>

      <h2 className="mb-3 text-lg font-semibold">Lists</h2>
      {!lists || lists.length === 0 ? (
        <p className="text-muted">This user has no lists yet.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lists.map((l) => (
            <li key={l.id} className="card p-4">
              <Link
                href={`/u/${profile.slug}/${l.slug}`}
                className="text-lg font-semibold hover:text-accent"
              >
                {l.title}
              </Link>
              {l.description && (
                <p className="mt-1 text-sm text-muted">{l.description}</p>
              )}
              <p className="mt-2 text-xs text-muted">
                created {formatDate(l.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
