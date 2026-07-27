import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function notifyCommunityRoomInvite(
  supabase: SupabaseClient<Database>,
  input: {
    roomId: string;
    profileUserId: string;
  },
): Promise<void> {
  const { error } = await supabase.rpc("notify_community_room_invite", {
    p_room_id: input.roomId,
    p_user_id: input.profileUserId,
  });

  if (error) {
    throw error;
  }
}
