import { createClient } from "@/lib/supabase/server";
import ContactForm from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold">Contact</h1>
      <p className="mb-6 text-sm text-muted">
        Report a bug, share a suggestion, or just say hi. We read everything.
      </p>
      <ContactForm isLoggedIn={!!user} userEmail={user?.email ?? null} />
    </div>
  );
}
