import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold">Ustawienia profilu</h1>
      <p className="mb-6 text-sm text-muted">
        Twój profil widoczny jest pod adresem{" "}
        <span className="text-white">/u/{profile.slug}</span>
      </p>
      <SettingsForm
        slug={profile.slug}
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
      />
    </div>
  );
}
