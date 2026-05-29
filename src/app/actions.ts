"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractYoutubeId } from "@/lib/youtube";
import { isValidSlug, normalizeSlug, randomSlug } from "@/lib/slug";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

// =====================================================================
// LISTY
// =====================================================================
export async function createList(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description =
    (formData.get("description") as string | null)?.trim() || null;
  const customSlugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  if (!title) {
    return { error: "Podaj tytuł listy." };
  }

  // Slug: jeśli user wpisał — normalizujemy i walidujemy; w przeciwnym razie generujemy.
  let slug: string;
  if (customSlugRaw) {
    slug = normalizeSlug(customSlugRaw);
    if (!isValidSlug(slug)) {
      return { error: "Niepoprawny slug. Tylko a-z, 0-9, myślniki." };
    }
  } else {
    slug = randomSlug(6);
  }

  // Sprawdzamy unikalność w obrębie ownera (DB też pilnuje, ale dajemy ładny błąd).
  const { data: existing } = await supabase
    .from("lists")
    .select("id")
    .eq("owner_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return { error: "Masz już listę z takim adresem. Wybierz inny." };
  }

  const { data, error } = await supabase
    .from("lists")
    .insert({ owner_id: userId, slug, title, description })
    .select("id, slug")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Nie udało się utworzyć listy." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", userId)
    .single();

  revalidatePath("/dashboard");
  if (!profile) {
    // teoretycznie nie powinno się zdarzyć (trigger), ale awaryjnie wracamy do dashboardu
    redirect("/dashboard");
  }
  revalidatePath(`/u/${profile.slug}`);
  redirect(`/u/${profile.slug}/${data.slug}`);
}

export async function deleteList(listId: string) {
  const { supabase, userId } = await requireUser();
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();
  if (!list || list.owner_id !== userId) return { error: "Brak uprawnień." };

  await supabase.from("lists").delete().eq("id", listId);
  revalidatePath("/dashboard");
}

// =====================================================================
// REQUESTY
// =====================================================================
export async function createRequest(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const listId = formData.get("listId") as string;
  const artist = ((formData.get("artist") as string) || "").trim();
  const title = ((formData.get("title") as string) || "").trim();
  const youtubeUrl = ((formData.get("youtube_url") as string) || "").trim();
  const comment = ((formData.get("comment") as string) || "").trim() || null;

  if (!listId || !artist || !title || !youtubeUrl) {
    return { error: "Wypełnij wszystkie wymagane pola." };
  }

  const youtubeId = extractYoutubeId(youtubeUrl);
  if (!youtubeId) {
    return { error: "Niepoprawny link YouTube." };
  }

  const { error } = await supabase.from("requests").insert({
    list_id: listId,
    created_by: userId,
    artist,
    title,
    youtube_url: youtubeUrl,
    youtube_id: youtubeId,
    comment
  });

  if (error) return { error: error.message };

  revalidatePath(`/list/${listId}`);
  // Również publicznie widoczne adresy — odświeżamy szeroko:
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteRequest(requestId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("requests").delete().eq("id", requestId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markRequestCompleted(
  requestId: string,
  completionUrl: string
) {
  const { supabase } = await requireUser();
  if (!extractYoutubeId(completionUrl)) {
    return { error: "Podaj poprawny link YouTube do filmu reakcji." };
  }
  const { error } = await supabase
    .from("requests")
    .update({ completed_at: new Date().toISOString(), completion_url: completionUrl })
    .eq("id", requestId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function unmarkRequestCompleted(requestId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("requests")
    .update({ completed_at: null, completion_url: null })
    .eq("id", requestId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// =====================================================================
// VOTES
// =====================================================================
export async function toggleVote(requestId: string) {
  const { supabase, userId } = await requireUser();

  const { data: existing } = await supabase
    .from("votes")
    .select("request_id")
    .eq("request_id", requestId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("votes")
      .insert({ request_id: requestId, user_id: userId });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// =====================================================================
// COMMENTS
// =====================================================================
export async function addComment(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const requestId = formData.get("requestId") as string;
  const body = ((formData.get("body") as string) || "").trim();
  if (!requestId || !body) return { error: "Pusty komentarz." };

  const { error } = await supabase
    .from("comments")
    .insert({ request_id: requestId, user_id: userId, body });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteComment(commentId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// =====================================================================
// PROFILE — edycja display_name / slug / avatar
// =====================================================================
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export async function updateProfile(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const displayName = ((formData.get("display_name") as string) || "").trim();
  const newSlugRaw = ((formData.get("slug") as string) || "").trim();
  const file = formData.get("avatar") as File | null;

  if (!displayName) return { error: "Podaj wyświetlaną nazwę." };
  if (displayName.length > 60) return { error: "Nazwa za długa (max 60 znaków)." };

  // Bieżący profil — slug porównujemy
  const { data: current } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", userId)
    .single();
  if (!current) return { error: "Brak profilu — zaloguj się ponownie." };

  // Slug
  let newSlug: string | undefined;
  if (newSlugRaw && newSlugRaw !== current.slug) {
    const normalized = normalizeSlug(newSlugRaw);
    if (!isValidSlug(normalized)) {
      return { error: "Niepoprawny slug. Tylko a-z, 0-9, myślniki (2-48 znaków)." };
    }
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", normalized)
      .neq("id", userId)
      .maybeSingle();
    if (taken) return { error: "Ten adres profilu jest już zajęty." };
    newSlug = normalized;
  }

  // Avatar
  let avatarUrl: string | undefined;
  if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > AVATAR_MAX_BYTES) {
      return { error: "Avatar nie może być większy niż 2 MB." };
    }
    if (!AVATAR_TYPES.includes(file.type)) {
      return { error: "Avatar musi być JPG, PNG lub WebP." };
    }
    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      return { error: `Błąd uploadu: ${uploadError.message}` };
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
  }

  const update: Record<string, string> = { display_name: displayName };
  if (newSlug) update.slug = newSlug;
  if (avatarUrl) update.avatar_url = avatarUrl;

  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, newSlug };
}

export async function deleteAvatar() {
  const { supabase, userId } = await requireUser();

  // Wyczyść folder usera w bucket avatars
  const { data: files } = await supabase.storage.from("avatars").list(userId);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    const { error: removeError } = await supabase.storage
      .from("avatars")
      .remove(paths);
    if (removeError) {
      return { error: `Nie udało się usunąć pliku: ${removeError.message}` };
    }
  }

  // Wyczyść URL w profilu
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
