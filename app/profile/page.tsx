"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { ProfileScreen } from "@/features/profile/components/ProfileScreen";

function getDisplayName(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) {
    return "Guest Player";
  }

  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  return user.email?.split("@")[0] ?? "Player";
}

export default function ProfilePage() {
  const { user } = useAuth();
  const displayName = getDisplayName(user);

  return <ProfileScreen user={user} displayName={displayName} />;
}
