"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useProfileCloudSync } from "@/features/profile/hooks/useProfileCloudSync";

export function ProfileBootstrap() {
  const { user } = useAuth();
  useProfileCloudSync(user?.id);
  return null;
}
