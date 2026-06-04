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
        Your <span className="text-accent">request</span> list
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-muted">
        Create your list and let viewers send you requests. They vote on
        submissions, you pick what to react to on stream or your channel.
      </p>
      <Link href="/login" className="btn-primary">
        Get started — sign in with Google
      </Link>

      <div className="mt-16 grid gap-4 text-left md:grid-cols-3">
        <div className="card p-5">
          <div className="mb-2 text-2xl">📝</div>
          <h3 className="mb-1 font-semibold">Create a list</h3>
          <p className="text-sm text-muted">
            Each list has its own URL you can drop on stream or in a video
            description.
          </p>
        </div>
        <div className="card p-5">
          <div className="mb-2 text-2xl">🎶</div>
          <h3 className="mb-1 font-semibold">Viewers send requests</h3>
          <p className="text-sm text-muted">
            They paste a YouTube link, fill in the artist and a comment.
            Title autofills from YouTube.
          </p>
        </div>
        <div className="card p-5">
          <div className="mb-2 text-2xl">🏆</div>
          <h3 className="mb-1 font-semibold">Vote and deliver</h3>
          <p className="text-sm text-muted">
            The crowd upvotes, you pick what to do and mark it done with a
            link to your reaction.
          </p>
        </div>
      </div>
    </div>
  );
}
