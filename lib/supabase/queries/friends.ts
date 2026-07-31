import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FriendshipStatus =
  | "self"
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "friends";

export interface FriendRequestRow {
  requesterId: string;
  displayName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  createdAt: string;
}

export interface FriendRow {
  friendId: string;
  displayName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  friendsSince: string;
}

function isFriendshipStatus(value: unknown): value is FriendshipStatus {
  return (
    value === "self" ||
    value === "none" ||
    value === "pending_outgoing" ||
    value === "pending_incoming" ||
    value === "friends"
  );
}

export async function fetchFriendshipStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FriendshipStatus> {
  const { data, error } = await supabase.rpc("get_friendship_status", {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return isFriendshipStatus(data) ? data : "none";
}

export async function requestFriend(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FriendshipStatus> {
  const { data, error } = await supabase.rpc("request_friend", {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return isFriendshipStatus(data) ? data : "pending_outgoing";
}

export async function respondFriendRequest(
  supabase: SupabaseClient<Database>,
  requesterId: string,
  accept: boolean,
): Promise<FriendshipStatus> {
  const { data, error } = await supabase.rpc("respond_friend_request", {
    p_requester_id: requesterId,
    p_accept: accept,
  });

  if (error) {
    throw error;
  }

  return isFriendshipStatus(data) ? data : accept ? "friends" : "none";
}

export async function cancelFriendRequest(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FriendshipStatus> {
  const { data, error } = await supabase.rpc("cancel_friend_request", {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return isFriendshipStatus(data) ? data : "none";
}

export async function listPendingFriendRequests(
  supabase: SupabaseClient<Database>,
): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase.rpc("list_pending_friend_requests");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    requesterId: row.requester_id,
    displayName: row.display_name,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    countryCode: row.country_code,
    createdAt: row.created_at,
  }));
}

export async function listFriends(
  supabase: SupabaseClient<Database>,
): Promise<FriendRow[]> {
  const { data, error } = await supabase.rpc("list_friends");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    friendId: row.friend_id,
    displayName: row.display_name,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    countryCode: row.country_code,
    friendsSince: row.friends_since,
  }));
}
