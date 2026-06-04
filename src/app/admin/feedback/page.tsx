import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

type FeedbackRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  kind: string;
  subject: string;
  body: string;
  created_at: string;
};

export default async function AdminFeedbackPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sprawdź czy current user jest na liście adminów
  const { data: admin } = await supabase
    .from("admin_emails")
    .select("email")
    .ilike("email", user.email ?? "")
    .maybeSingle();

  if (!admin) {
    notFound();
  }

  // RLS dopuści SELECT tylko dla adminów (z policy 0005)
  const { data: feedback, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (feedback as FeedbackRow[] | null) ?? [];

  return (
    <div>
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Feedback inbox</h1>
        <Link href="/dashboard" className="text-sm text-muted hover:text-white">
          ← Dashboard
        </Link>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error.message}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          No feedback yet.
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((f) => (
            <li key={f.id} className="card p-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 font-semibold uppercase ${
                      f.kind === "bug"
                        ? "bg-red-500/20 text-red-300"
                        : f.kind === "suggestion"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {f.kind}
                  </span>
                  <span className="font-semibold text-white">{f.subject}</span>
                </span>
                <span className="text-muted">{formatRelative(f.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-white/90">{f.body}</p>
              <p className="mt-3 text-xs text-muted">
                from: {f.email ?? (f.user_id ? `user ${f.user_id}` : "anonymous")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
