"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    // Zawsze używaj aktualnego origin przeglądarki — działa na localhost,
    // prod URL Vercela i preview deployach bez konfigurowania env var.
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="mb-2 text-2xl font-bold">Zaloguj się</h1>
        <p className="mb-6 text-sm text-muted">
          Logowanie wymagane do zakładania list i dodawania rekomendacji.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? "Przekierowuję…" : "Zaloguj przez Google"}
        </button>
        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
