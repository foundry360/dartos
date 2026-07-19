"use client";

import { useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LeagueScheduleStatusBadge } from "@/features/leagues/components/LeagueScheduleStatus";
import { useLeagues } from "@/features/leagues/hooks/useLeagues";
import {
  formatLeagueDate,
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

function LeagueIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L15.79 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <path d="M8 7h8" />
      <circle cx="12" cy="17" r="5" />
      <path d="M12 18v-2h-.5" />
    </svg>
  );
}

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
  const startsAt = formatLeagueDate(league.starts_at);
  const endsAt = formatLeagueDate(league.ends_at);

  return (
    <article className="league-dashboard__league-row">
      <div className="league-dashboard__league-details">
        <div className="league-dashboard__league-cell">
          <Link
            href={`/leagues/league/${league.id}`}
            className="league-dashboard__league-name-link league-list-row__name"
          >
            <LeagueIcon className="league-dashboard__league-name-icon" />
            <span className="league-dashboard__league-name-text">{league.name}</span>
          </Link>
        </div>
        <div className="league-dashboard__league-cell" title={organization.name}>
          {organization.name}
        </div>
        <div className="league-dashboard__league-cell">{season?.name ?? "—"}</div>
        <div className="league-dashboard__league-cell">{formatLabel ?? "—"}</div>
        <div className="league-dashboard__league-cell">{startsAt ?? "—"}</div>
        <div className="league-dashboard__league-cell">{endsAt ?? "—"}</div>
        <div className="league-dashboard__league-cell">
          <LeagueScheduleStatusBadge status={getLeagueScheduleStatus(league)} />
        </div>
      </div>
    </article>
  );
}

function LeagueListSection({
  id,
  title,
  empty,
  leagues,
}: {
  id: string;
  title: string;
  empty: string;
  leagues: LeagueWithVenue[];
}) {
  return (
    <section className="league-list-section" aria-labelledby={id}>
      <GlassPanel className="league-dashboard__panel league-list-section__panel">
        <div className="league-dashboard__panel-header">
          <h2 id={id} className="league-dashboard__panel-title league-list-section__title">
            {title}
          </h2>
        </div>
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
              <span>Venue</span>
              <span>Season</span>
              <span>League Type</span>
              <span>Start</span>
              <span>End</span>
              <span>Status</span>
            </div>
            <div className="league-dashboard__league-list">
              {leagues.map((entry) => (
                <LeagueListRow key={entry.league.id} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </GlassPanel>
    </section>
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
      {error && !usingSample ? (
        <p className="league-list-screen__error">{error}</p>
      ) : null}

      {showLoading ? (
        <p className="league-list-section__empty">Loading leagues…</p>
      ) : (
        <div className="league-list-screen__sections">
          {SECTIONS.map((section) => (
            <LeagueListSection
              key={section.id}
              id={`league-list-${section.id}`}
              title={section.title}
              empty={section.empty}
              leagues={grouped[section.id]}
            />
          ))}
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
