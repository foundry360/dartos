"use client";

import { useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { LeagueHeaderProfile } from "@/features/leagues/components/LeagueHeaderProfile";
import { LeagueScheduleStatusBadge } from "@/features/leagues/components/LeagueScheduleStatus";
import { useLeagues } from "@/features/leagues/hooks/useLeagues";
import {
  formatLeagueDateTime,
  formatLeagueFormatLabel,
  getLeagueScheduleStatus,
} from "@/features/leagues/lib/league-formats";
import {
  SAMPLE_LEAGUES,
  shouldUseLeagueManagementSample,
} from "@/features/leagues/lib/sample-league-dashboard";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import { LOGIN_PATH, LEAGUE_PLAY_PATH } from "@/lib/auth/routes";
import type { LeagueWithVenue } from "@/lib/supabase/queries/leagues";
import "@/features/home/home-page.css";
import "@/features/organizations/organizations-page.css";
import "@/features/leagues/league-dashboard.css";
import "@/features/leagues/league-list.css";

type LeagueListSectionId = "active" | "upcoming" | "complete";

const SECTIONS: Array<{
  id: LeagueListSectionId;
  title: string;
  empty: string;
}> = [
  {
    id: "active",
    title: "Active Leagues",
    empty: "No active leagues.",
  },
  {
    id: "upcoming",
    title: "Upcoming Leagues",
    empty: "No upcoming leagues.",
  },
  {
    id: "complete",
    title: "Complete Leagues",
    empty: "No completed leagues.",
  },
];

function sortLeagues(
  entries: LeagueWithVenue[],
  section: LeagueListSectionId,
): LeagueWithVenue[] {
  const copy = [...entries];

  copy.sort((a, b) => {
    const aStart = a.league.starts_at
      ? new Date(a.league.starts_at).getTime()
      : 0;
    const bStart = b.league.starts_at
      ? new Date(b.league.starts_at).getTime()
      : 0;
    const aEnd = a.league.ends_at ? new Date(a.league.ends_at).getTime() : 0;
    const bEnd = b.league.ends_at ? new Date(b.league.ends_at).getTime() : 0;

    if (section === "upcoming") {
      return aStart - bStart;
    }

    if (section === "complete") {
      return bEnd - aEnd;
    }

    return aEnd - bEnd;
  });

  return copy;
}

function groupLeagues(leagues: LeagueWithVenue[]) {
  const active: LeagueWithVenue[] = [];
  const upcoming: LeagueWithVenue[] = [];
  const complete: LeagueWithVenue[] = [];

  for (const entry of leagues) {
    const status = getLeagueScheduleStatus(entry.league);

    if (status === "upcoming") {
      upcoming.push(entry);
      continue;
    }

    if (status === "past") {
      complete.push(entry);
      continue;
    }

    active.push(entry);
  }

  return {
    active: sortLeagues(active, "active"),
    upcoming: sortLeagues(upcoming, "upcoming"),
    complete: sortLeagues(complete, "complete"),
  };
}

function LeagueListRow({ entry }: { entry: LeagueWithVenue }) {
  const { league, organization, season } = entry;
  const formatLabel = formatLeagueFormatLabel(league.format);
  const startsAt = formatLeagueDateTime(league.starts_at);
  const endsAt = formatLeagueDateTime(league.ends_at);
  const scheduleStatus = getLeagueScheduleStatus(league);

  return (
    <article className="league-dashboard__league-row">
      <div className="league-dashboard__league-details">
        <div className="league-dashboard__league-cell">
          <Link
            href={`/leagues/league/${league.id}`}
            className="league-dashboard__league-name-link"
          >
            {league.name}
          </Link>
        </div>
        <div className="league-dashboard__league-cell">
          <LeagueScheduleStatusBadge status={scheduleStatus} />
        </div>
        <div className="league-dashboard__league-cell" title={organization.name}>
          {organization.name}
        </div>
        <div className="league-dashboard__league-cell">{season?.name ?? "—"}</div>
        <div className="league-dashboard__league-cell">{formatLabel ?? "—"}</div>
        <div className="league-dashboard__league-cell">{startsAt ?? "—"}</div>
        <div className="league-dashboard__league-cell">{endsAt ?? "—"}</div>
      </div>
    </article>
  );
}

function LeagueListSection({
  title,
  empty,
  leagues,
}: {
  title: string;
  empty: string;
  leagues: LeagueWithVenue[];
}) {
  return (
    <SettingsGroup title={title} className="settings-group--detached-targets">
      {leagues.length === 0 ? (
        <p className="league-list-section__empty">{empty}</p>
      ) : (
        <div
          className="league-dashboard__league-table league-list-table"
          role="list"
          aria-label={title}
        >
          <div className="league-dashboard__league-columns" aria-hidden>
            <span>League</span>
            <span>Status</span>
            <span>Venue</span>
            <span>Season</span>
            <span>Format</span>
            <span>Start</span>
            <span>End</span>
          </div>
          <div className="league-dashboard__league-list">
            {leagues.map((entry) => (
              <LeagueListRow key={entry.league.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </SettingsGroup>
  );
}

function LeagueListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { loading: accessLoading, allowed: canManageLeagues } =
    useLeagueManagementAccess();
  const { leagues, loading, error } = useLeagues();
  const sampleEnabled = shouldUseLeagueManagementSample(
    searchParams.get("sample"),
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(
        `${LOGIN_PATH}?next=${encodeURIComponent("/leagues/leagues")}`,
      );
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!authLoading && !accessLoading && user && !canManageLeagues && !sampleEnabled) {
      router.replace(LEAGUE_PLAY_PATH);
    }
  }, [
    accessLoading,
    authLoading,
    canManageLeagues,
    router,
    sampleEnabled,
    user,
  ]);

  const usingSample = sampleEnabled;
  const sourceLeagues = usingSample
    ? SAMPLE_LEAGUES
    : leagues.length > 0
      ? leagues
      : [];

  const grouped = useMemo(
    () => groupLeagues(sourceLeagues),
    [sourceLeagues],
  );

  const showLoading =
    (authLoading || accessLoading || (loading && !usingSample)) &&
    sourceLeagues.length === 0;

  return (
    <div className="organizations-screen league-list-screen">
      <div className="league-list-screen__toolbar">
        <Link href="/leagues" className="league-list-screen__back">
          ← League Management
        </Link>
      </div>

      {error && !usingSample ? (
        <p className="league-list-screen__error">{error}</p>
      ) : null}

      {showLoading ? (
        <p className="league-list-section__empty">Loading leagues…</p>
      ) : (
        <div className="setup-screen practice-setup-screen league-list-setup">
          <div className="setup-screen__scroll">
            {SECTIONS.map((section) => (
              <LeagueListSection
                key={section.id}
                title={section.title}
                empty={section.empty}
                leagues={grouped[section.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LeagueListScreen() {
  return (
    <MobileAppShell
      className="organizations-page shell-page league-management-page league-list-page"
      title="All Leagues"
      headerContent={<LeagueHeaderProfile />}
    >
      <Suspense
        fallback={
          <div className="organizations-screen league-list-screen">
            <p className="league-list-section__empty">Loading leagues…</p>
          </div>
        }
      >
        <LeagueListContent />
      </Suspense>
    </MobileAppShell>
  );
}
