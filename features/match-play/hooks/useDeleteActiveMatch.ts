"use client";

import { useCallback } from "react";
import { deleteActiveMatch } from "@/features/match-play/lib/delete-active-match";

export function useDeleteActiveMatch(userId: string | undefined) {
  return useCallback(
    (matchId: string) => {
      deleteActiveMatch(userId, matchId);
    },
    [userId],
  );
}
