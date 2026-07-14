import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementReadRow = Database["public"]["Tables"]["announcement_reads"]["Row"];

export interface AnnouncementWithRead extends AnnouncementRow {
  readAt: string | null;
  dismissedAt: string | null;
}

export async function fetchAnnouncementsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AnnouncementWithRead[]> {
  const [{ data: announcements, error: announcementsError }, { data: reads, error: readsError }] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("published_at", { ascending: false }),
      supabase.from("announcement_reads").select("*").eq("user_id", userId),
    ]);

  if (announcementsError) {
    throw announcementsError;
  }

  if (readsError) {
    throw readsError;
  }

  const readsById = new Map((reads ?? []).map((read) => [read.announcement_id, read]));

  return (announcements ?? [])
    .map((announcement) => {
      const read = readsById.get(announcement.id);

      return {
        ...announcement,
        readAt: read?.read_at ?? null,
        dismissedAt: read?.dismissed_at ?? null,
      } satisfies AnnouncementWithRead;
    })
    .filter((announcement) => !announcement.dismissedAt);
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

export async function dismissAnnouncement(
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
