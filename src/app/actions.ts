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
// LISTS
// =====================================================================
export async function createList(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description =
    (formData.get("description") as string | null)?.trim() || null;
  const customSlugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  if (!title) {
    return { error: "Please enter a list title." };
  }

  let slug: string;
  if (customSlugRaw) {
    slug = normalizeSlug(customSlugRaw);
    if (!isValidSlug(slug)) {
      return { error: "Invalid slug. Only a-z, 0-9, dashes." };
    }
  } else {
    slug = randomSlug(6);
  }

  const { data: existing } = await supabase
    .from("lists")
    .select("id")
    .eq("owner_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return { error: "You already have a list with this URL. Pick another." };
  }

  const { data, error } = await supabase
    .from("lists")
    .insert({ owner_id: userId, slug, title, description })
    .select("id, slug")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create the list." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", userId)
    .single();

  revalidatePath("/dashboard");
  if (!profile) redirect("/dashboard");
  revalidatePath(`/u/${profile.slug}`);
  redirect(`/u/${profile.slug}/${data.slug}`);
}

export async function updateList(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const listId = (formData.get("listId") as string | null) ?? "";
  const title = ((formData.get("title") as string) || "").trim();
  const description =
    ((formData.get("description") as string) || "").trim() || null;
  const newSlugRaw = ((formData.get("slug") as string) || "").trim();

  if (!listId) return { error: "Missing list id." };
  if (!title) return { error: "List title can't be empty." };

  const { data: list } = await supabase
    .from("lists")
    .select("id, slug, owner_id")
    .eq("id", listId)
    .single();
  if (!list || list.owner_id !== userId) {
    return { error: "You don't have permission to edit this list." };
  }

  let newSlug: string | undefined;
  if (newSlugRaw && newSlugRaw !== list.slug) {
    const normalized = normalizeSlug(newSlugRaw);
    if (!isValidSlug(normalized)) {
      return { error: "Invalid slug. Only a-z, 0-9, dashes (2-48 chars)." };
    }
    const { data: taken } = await supabase
      .from("lists")
      .select("id")
      .eq("owner_id", userId)
      .eq("slug", normalized)
      .neq("id", listId)
      .maybeSingle();
    if (taken) return { error: "You already have another list with this URL." };
    newSlug = normalized;
  }

  const update: Record<string, string | null> = { title, description };
  if (newSlug) update.slug = newSlug;

  const { error } = await supabase.from("lists").update(update).eq("id", listId);
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", userId)
    .single();

  revalidatePath("/", "layout");
  return {
    ok: true,
    newSlug,
    profileSlug: profile?.slug ?? null
  };
}

export async function deleteList(listId: string) {
  const { supabase, userId } = await requireUser();
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();
  if (!list || list.owner_id !== userId) return { error: "Permission denied." };

  await supabase.from("lists").delete().eq("id", listId);
  revalidatePath("/", "layout");
  return { ok: true };
}

// =====================================================================
// REQUESTS
// =====================================================================
export async function createRequest(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const listId = formData.get("listId") as string;
  const artist = ((formData.get("artist") as string) || "").trim();
  const title = ((formData.get("title") as string) || "").trim();
  const youtubeUrl = ((formData.get("youtube_url") as string) || "").trim();
  const comment = ((formData.get("comment") as string) || "").trim() || null;

  if (!listId || !artist || !title || !youtubeUrl) {
    return { error: "Please fill in all required fields." };
  }

  const youtubeId = extractYoutubeId(youtubeUrl);
  if (!youtubeId) {
    return { error: "Invalid YouTube link." };
  }

  // Anti-duplicate check
  const { data: existing } = await supabase
    .from("requests")
    .select("id")
    .eq("list_id", listId)
    .eq("youtube_id", youtubeId)
    .maybeSingle();
  if (existing) {
    return {
      error: "This video is already on the list — opening the existing entry.",
      duplicateRequestId: existing.id
    };
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

  if (error) {
    // race condition on unique constraint
    if (error.code === "23505") {
      const { data: dup } = await supabase
        .from("requests")
        .select("id")
        .eq("list_id", listId)
        .eq("youtube_id", youtubeId)
        .maybeSingle();
      return {
        error: "This video is already on the list.",
        duplicateRequestId: dup?.id
      };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateRequest(formData: FormData) {
  const { supabase } = await requireUser();
  const requestId = (formData.get("requestId") as string) ?? "";
  const artist = ((formData.get("artist") as string) || "").trim();
  const title = ((formData.get("title") as string) || "").trim();
  const comment = ((formData.get("comment") as string) || "").trim() || null;

  if (!requestId || !artist || !title) {
    return { error: "Artist and title are required." };
  }

  // RLS pilnuje uprawnień (autor do pierwszego głosu albo owner listy).
  const { error } = await supabase
    .from("requests")
    .update({ artist, title, comment })
    .eq("id", requestId);

  if (error) return { error: error.message };
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
    return { error: "Provide a valid YouTube link to your reaction." };
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
  if (!requestId || !body) return { error: "Comment can't be empty." };

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
// PROFILE
// =====================================================================
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export async function updateProfile(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const displayName = ((formData.get("display_name") as string) || "").trim();
  const newSlugRaw = ((formData.get("slug") as string) || "").trim();
  const file = formData.get("avatar") as File | null;

  if (!displayName) return { error: "Please enter a display name." };
  if (displayName.length > 60) return { error: "Display name too long (max 60)." };

  const { data: current } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", userId)
    .single();
  if (!current) return { error: "No profile — please sign in again." };

  let newSlug: string | undefined;
  if (newSlugRaw && newSlugRaw !== current.slug) {
    const normalized = normalizeSlug(newSlugRaw);
    if (!isValidSlug(normalized)) {
      return { error: "Invalid slug. Only a-z, 0-9, dashes (2-48 chars)." };
    }
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", normalized)
      .neq("id", userId)
      .maybeSingle();
    if (taken) return { error: "This profile URL is already taken." };
    newSlug = normalized;
  }

  let avatarUrl: string | undefined;
  if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > AVATAR_MAX_BYTES) {
      return { error: "Avatar can't be larger than 2 MB." };
    }
    if (!AVATAR_TYPES.includes(file.type)) {
      return { error: "Avatar must be JPG, PNG or WebP." };
    }
    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` };
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

  const { data: files } = await supabase.storage.from("avatars").list(userId);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    const { error: removeError } = await supabase.storage
      .from("avatars")
      .remove(paths);
    if (removeError) {
      return { error: `Failed to remove file: ${removeError.message}` };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

// =====================================================================
// FAVORITES
// =====================================================================
export async function toggleFavorite(listId: string) {
  const { supabase, userId } = await requireUser();

  const { data: existing } = await supabase
    .from("list_favorites")
    .select("list_id")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("list_favorites")
      .delete()
      .eq("list_id", listId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("list_favorites")
      .insert({ list_id: listId, user_id: userId });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// =====================================================================
// FEEDBACK
// =====================================================================
export async function submitFeedback(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const kind = (formData.get("kind") as string) ?? "other";
  const subject = ((formData.get("subject") as string) || "").trim();
  const body = ((formData.get("body") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim() || null;

  if (!["bug", "suggestion", "other"].includes(kind)) {
    return { error: "Invalid feedback type." };
  }
  if (!subject) return { error: "Subject is required." };
  if (!body) return { error: "Message is required." };
  if (subject.length > 120) return { error: "Subject too long (max 120)." };
  if (body.length > 4000) return { error: "Message too long (max 4000)." };
  if (!user && !email) {
    return { error: "Please provide an email so we can reply." };
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    email,
    kind,
    subject,
    body
  });
  if (error) return { error: error.message };

  return { ok: true };
}
