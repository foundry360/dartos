import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementReadRow = Database["public"]["Tables"]["announcement_reads"]["Row"];

export interface AnnouncementWithRead extends AnnouncementRow {
  readAt: string | null;
  dismissedAt: string | null;
}

/** Canonical inbox order for shared signup defaults. */
export const SIGNUP_DEFAULT_SLUG_ORDER = [
  "signup-welcome",
  "signup-install",
  "signup-complete-profile",
  "signup-practice",
  "signup-first-match",
] as const;

export function sortAnnouncementsForInbox(
  items: AnnouncementWithRead[],
): AnnouncementWithRead[] {
  const signupRank = new Map<string, number>(
    SIGNUP_DEFAULT_SLUG_ORDER.map((slug, index) => [slug, index]),
  );

  return [...items].sort((a, b) => {
    const aSignup = a.is_signup_default ? (signupRank.get(a.slug ?? "") ?? 999) : null;
    const bSignup = b.is_signup_default ? (signupRank.get(b.slug ?? "") ?? 999) : null;

    if (aSignup !== null && bSignup !== null) {
      return aSignup - bSignup;
    }

    if (aSignup !== null) {
      return -1;
    }

    if (bSignup !== null) {
      return 1;
    }

    return Date.parse(b.published_at) - Date.parse(a.published_at);
  });
}

export async function fetchAnnouncementsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AnnouncementWithRead[]> {
  const [
    { data: profile, error: profileError },
    { data: announcements, error: announcementsError },
    { data: reads, error: readsError },
  ] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("published_at", { ascending: false }),
    supabase.from("announcement_reads").select("*").eq("user_id", userId),
  ]);

  if (profileError) {
    throw profileError;
  }

  if (announcementsError) {
    throw announcementsError;
  }

  if (readsError) {
    throw readsError;
  }

  const profileCreatedAtMs = profile?.created_at ? Date.parse(profile.created_at) : Number.NaN;
  const readsById = new Map((reads ?? []).map((read) => [read.announcement_id, read]));
  const signupCutoffMs = (announcements ?? [])
    .filter((announcement) => announcement.is_signup_default)
    .map((announcement) => Date.parse(announcement.published_at))
    .filter((value) => Number.isFinite(value))
    .reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY);

  return sortAnnouncementsForInbox(
    (announcements ?? [])
      .filter((announcement) => {
        if (!announcement.is_signup_default) {
          return true;
        }

        // Shared signup defaults: only accounts created at/after these defaults were published.
        if (!Number.isFinite(profileCreatedAtMs) || !Number.isFinite(signupCutoffMs)) {
          return false;
        }

        return profileCreatedAtMs >= signupCutoffMs;
      })
      .map((announcement) => {
        const read = readsById.get(announcement.id);

        return {
          ...announcement,
          readAt: read?.read_at ?? null,
          dismissedAt: read?.dismissed_at ?? null,
        } satisfies AnnouncementWithRead;
      })
      .filter((announcement) => !announcement.dismissedAt),
  );
}

export async function markAnnouncementRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  announcementId: string,
): Promise<void> {
  const { error } = await supabase.from("announcement_reads").upsert(
    {
      announcement_id: announcementId,
      user_id: userId,
      read_at: new Date().toISOString(),
    },
    { onConflict: "announcement_id,user_id" },
  );

  if (error) {
    throw error;
  }
}

export async function markAnnouncementsRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  announcementIds: string[],
): Promise<void> {
  if (announcementIds.length === 0) {
    return;
  }

  const readAt = new Date().toISOString();
  const { error } = await supabase.from("announcement_reads").upsert(
    announcementIds.map((announcementId) => ({
      announcement_id: announcementId,
      user_id: userId,
      read_at: readAt,
    })),
    { onConflict: "announcement_id,user_id" },
  );

  if (error) {
    throw error;
  }
}

export async function markAnnouncementUnread(
  supabase: SupabaseClient<Database>,
  userId: string,
  announcementId: string,
): Promise<void> {
  const { error } = await supabase
    .from("announcement_reads")
    .delete()
    .eq("announcement_id", announcementId)
    .eq("user_id", userId)
    .is("dismissed_at", null);

  if (error) {
    throw error;
  }
}

/** Soft-deletes an announcement for this user (removed from their inbox). */
export async function deleteAnnouncement(
  supabase: SupabaseClient<Database>,
  userId: string,
  announcementId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("announcement_reads").upsert(
    {
      announcement_id: announcementId,
      user_id: userId,
      read_at: now,
      dismissed_at: now,
    },
    { onConflict: "announcement_id,user_id" },
  );

  if (error) {
    throw error;
  }
}
