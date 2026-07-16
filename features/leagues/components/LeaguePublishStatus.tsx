"use client";

import { cn } from "@/utils/cn";

export type LeaguePublishStatus = "published" | "unpublished";

export function getLeaguePublishStatus(
  league: { published_at?: string | null },
): LeaguePublishStatus {
  return league.published_at ? "published" : "unpublished";
}

export function LeaguePublishStatusBadge({
  status,
}: {
  status: LeaguePublishStatus;
}) {
  const published = status === "published";

  return (
    <span
      className={cn(
        "league-publish-status",
        published
          ? "league-publish-status--published"
          : "league-publish-status--unpublished",
      )}
    >
      <span className="league-publish-status__dot" aria-hidden />
      {published ? "Published" : "Unpublished"}
    </span>
  );
}
