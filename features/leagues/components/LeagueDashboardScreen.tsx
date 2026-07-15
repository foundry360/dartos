"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { OrganizationsMenuIcon } from "@/components/ui/AppMenuIcons";
import { StatSparkline } from "@/components/charts/StatSparkline";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { CreateLeagueModal } from "@/features/leagues/components/CreateLeagueModal";
import { LeagueHeaderProfile } from "@/features/leagues/components/LeagueHeaderProfile";
import { useLeagues } from "@/features/leagues/hooks/useLeagues";
import {
  formatLeagueDateTime,
  formatLeagueFormatLabel,
  LEAGUE_VIEW_FILTER_OPTIONS,
  leagueViewChartXLabel,
  leagueViewFilterDayCount,
  leagueViewStatLabel,
  matchesLeagueViewFilter,
  type LeagueViewFilter,
} from "@/features/leagues/lib/league-formats";
import {
  getSampleSeasonStats,
  SAMPLE_ACTIVITY,
  SAMPLE_LEAGUES,
  SAMPLE_TOURNAMENTS,
  SAMPLE_VENUES,
  shouldUseLeagueManagementSample,
} from "@/features/leagues/lib/sample-league-dashboard";
import {
  buildStatSparklineSeries,
  formatStatGrowthPercent,
  getStatSparklineGrowth,
} from "@/features/leagues/lib/stat-sparkline";
import { OrganizationsPanel } from "@/features/organizations/components/OrganizationsPanel";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import { useOrganizations } from "@/features/organizations/hooks/useOrganizations";
import { LOGIN_PATH, LEAGUE_PLAY_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";
import "@/features/home/home-page.css";
import "@/features/organizations/organizations-page.css";
import "@/features/leagues/league-dashboard.css";

function EmptySectionState({ message }: { message: string }) {
  return (
    <div className="league-dashboard__empty-slot">
      <p className="league-dashboard__empty">{message}</p>
    </div>
  );
}

function PanelCardHeader({
  id,
  title,
  href,
}: {
  id?: string;
  title: string;
  href: string;
}) {
  return (
    <div className="league-dashboard__panel-header">
      <h2 id={id} className="league-dashboard__panel-title">
        {title}
      </h2>
      <Link href={href} className="league-dashboard__panel-link">
        View all
      </Link>
    </div>
  );
}

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

function TournamentIcon({ className }: { className?: string }) {
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
      <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
      <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function VenueIcon({ className }: { className?: string }) {
  return <OrganizationsMenuIcon className={className} />;
}

function LeagueDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { allowed: canManageLeagues, loading: accessLoading } =
    useLeagueManagementAccess();
  const {
    memberships,
    loading: venuesLoading,
    refresh: refreshVenues,
  } = useOrganizations();
  const {
    leagues,
    loading: leaguesLoading,
    saving: creatingLeague,
    createLeague,
    error: leaguesError,
  } = useLeagues();
  const [createVenueOpen, setCreateVenueOpen] = useState(false);
  const [createLeagueOpen, setCreateLeagueOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState<LeagueViewFilter>("30d");
  const wasCreateVenueOpen = useRef(false);
  const sampleEnabled = shouldUseLeagueManagementSample(searchParams.get("sample"));
  const allLeagues = sampleEnabled ? SAMPLE_LEAGUES : leagues;
  const displayLeagues = useMemo(
    () => allLeagues.filter(({ league }) => matchesLeagueViewFilter(league, viewFilter)),
    [allLeagues, viewFilter],
  );
  const displayVenues = sampleEnabled ? SAMPLE_VENUES.slice(0, 5) : null;
  const displayTournaments = sampleEnabled ? SAMPLE_TOURNAMENTS.slice(0, 5) : [];
  const displayActivity = sampleEnabled ? SAMPLE_ACTIVITY.slice(0, 5) : [];
  const usingSampleLeagues = sampleEnabled;
  const hideRealVenueList = sampleEnabled;
  const chartXLabel = leagueViewChartXLabel(viewFilter);

  useEffect(() => {
    if (authLoading || accessLoading || !user) {
      return;
    }

    if (!canManageLeagues && !sampleEnabled) {
      router.replace(LEAGUE_PLAY_PATH);
    }
  }, [authLoading, accessLoading, user, canManageLeagues, sampleEnabled, router]);

  useEffect(() => {
    if (wasCreateVenueOpen.current && !createVenueOpen) {
      void refreshVenues();
    }

    wasCreateVenueOpen.current = createVenueOpen;
  }, [createVenueOpen, refreshVenues]);

  const seasonStats = useMemo(() => {
    const withSeries = sampleEnabled
      ? getSampleSeasonStats(viewFilter).map((entry) => ({ ...entry }))
      : (() => {
          const filteredCount = leagues.filter(({ league }) =>
            matchesLeagueViewFilter(league, viewFilter),
          ).length;

          const stats = [
            {
              id: "leagues" as const,
              label: leagueViewStatLabel(viewFilter, "leagues"),
              value: filteredCount,
            },
            {
              id: "tournaments" as const,
              label: leagueViewStatLabel(viewFilter, "tournaments"),
              value: 0,
            },
            {
              id: "players" as const,
              label: leagueViewStatLabel(viewFilter, "players"),
              value: 0,
            },
            {
              id: "teams" as const,
              label: leagueViewStatLabel(viewFilter, "teams"),
              value: 0,
            },
          ];

          return stats.map((stat) => ({
            ...stat,
            series: buildStatSparklineSeries(
              stat.value,
              `${viewFilter}-${stat.id}`,
              leagueViewFilterDayCount(viewFilter),
            ),
          }));
        })();

    return withSeries.map((stat) => {
      const growth = getStatSparklineGrowth(stat.series);
      return {
        ...stat,
        growth,
        growthLabel: formatStatGrowthPercent(growth),
      };
    });
  }, [leagues, sampleEnabled, viewFilter]);

  if (authLoading || accessLoading) {
    return (
      <GlassPanel>
        <p className="settings-panel__subdescription">Loading league management...</p>
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel>
        <h2 className="settings-panel__subheading text-2xl font-bold">
          League Management
        </h2>
        <p className="settings-panel__subdescription">
          Sign in to manage venues and leagues.
        </p>
        <Link href={LOGIN_PATH} className="mt-4 block">
          <TouchButton fullWidth size="lg">
            Sign in
          </TouchButton>
        </Link>
      </GlassPanel>
    );
  }

  if (!canManageLeagues && !sampleEnabled) {
    return (
      <GlassPanel>
        <p className="settings-panel__subdescription">Opening leagues…</p>
      </GlassPanel>
    );
  }

  return (
    <div className="league-dashboard">
      <section className="league-dashboard__section" aria-labelledby="season-stats-title">
        <div className="league-dashboard__section-header">
          <h2 id="season-stats-title" className="league-dashboard__section-title">
            Dashboard
          </h2>
          <div className="league-dashboard__toolbar">
            <SegmentedTabs
              ariaLabel="Filter dashboard view"
              options={LEAGUE_VIEW_FILTER_OPTIONS}
              value={viewFilter}
              onChange={setViewFilter}
              className="league-dashboard__view-filter"
            />
            <div className="league-dashboard__actions" aria-label="Quick actions">
              <button
                type="button"
                className="league-dashboard__action-icon"
                onClick={() => setCreateVenueOpen(true)}
                aria-label="Add Venue"
                data-tooltip="Add Venue"
              >
                <VenueIcon className="league-dashboard__action-svg" />
              </button>
              <button
                type="button"
                className="league-dashboard__action-icon"
                onClick={() => setCreateLeagueOpen(true)}
                aria-label="Create League"
                data-tooltip="Create League"
              >
                <LeagueIcon className="league-dashboard__action-svg" />
              </button>
              <button
                type="button"
                className={cn(
                  "league-dashboard__action-icon",
                  "league-dashboard__action-icon--disabled",
                )}
                aria-disabled="true"
                aria-label="Create Tournament (coming soon)"
                data-tooltip="Create Tournament"
                onClick={(event) => event.preventDefault()}
              >
                <TournamentIcon className="league-dashboard__action-svg" />
              </button>
            </div>
          </div>
        </div>
        <div className="league-dashboard__stats">
          {seasonStats.map((stat) => (
            <div
              key={stat.id}
              className={cn(
                "league-dashboard__stat",
                stat.value === 0 && "league-dashboard__stat--empty",
              )}
            >
              <StatSparkline
                points={stat.series}
                empty={stat.value === 0}
                xLabel={chartXLabel}
                className="league-dashboard__stat-sparkline"
              />
              <div className="league-dashboard__stat-copy">
                <p className="league-dashboard__stat-value">{stat.value}</p>
                <p className="league-dashboard__stat-label">{stat.label}</p>
                {stat.growthLabel ? (
                  <p
                    className={cn(
                      "league-dashboard__stat-growth",
                      (stat.growth ?? 0) > 0 && "league-dashboard__stat-growth--up",
                      (stat.growth ?? 0) < 0 && "league-dashboard__stat-growth--down",
                      (stat.growth ?? 0) === 0 && "league-dashboard__stat-growth--flat",
                    )}
                  >
                    {stat.growthLabel}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="league-dashboard__section" aria-labelledby="leagues-title">
        <GlassPanel className="league-dashboard__panel league-dashboard__panel--leagues">
          <PanelCardHeader id="leagues-title" title="Leagues" href="/leagues/leagues" />
          {leaguesError && !usingSampleLeagues ? (
            <p className="league-dashboard__empty">{leaguesError}</p>
          ) : null}
          {leaguesLoading && !usingSampleLeagues ? (
            <EmptySectionState message="Loading leagues..." />
          ) : displayLeagues.length === 0 ? (
            <EmptySectionState
              message="No leagues in this period."
            />
          ) : (
            <div className="league-dashboard__league-table">
              <div className="league-dashboard__league-columns" aria-hidden>
                <span>League</span>
                <span>Venue</span>
                <span>Season</span>
                <span>Format</span>
                <span>Start</span>
                <span>End</span>
              </div>
              <div className="league-dashboard__league-list">
                {displayLeagues.map(({ league, organization, season }) => {
                  const formatLabel = formatLeagueFormatLabel(league.format);
                  const startsAt = formatLeagueDateTime(league.starts_at);
                  const endsAt = formatLeagueDateTime(league.ends_at);

                  return (
                    <article key={league.id} className="league-dashboard__league-row">
                      <div className="league-dashboard__league-details">
                        <div className="league-dashboard__league-cell">
                          <Link
                            href={`/leagues/league/${league.id}`}
                            className="league-dashboard__league-name-link"
                          >
                            {league.name}
                          </Link>
                        </div>
                        <div className="league-dashboard__league-cell" title={organization.name}>
                          {organization.name}
                        </div>
                        <div className="league-dashboard__league-cell">
                          {season?.name ?? "—"}
                        </div>
                        <div className="league-dashboard__league-cell">
                          {formatLabel ?? "—"}
                        </div>
                        <div className="league-dashboard__league-cell">{startsAt ?? "—"}</div>
                        <div className="league-dashboard__league-cell">{endsAt ?? "—"}</div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </GlassPanel>
      </section>

      <section
        className="league-dashboard__section"
        aria-label="Venues, tournaments, and activity"
      >
        <div className="league-dashboard__panels">
          <GlassPanel className="league-dashboard__panel" id="venues">
            <PanelCardHeader title="Venues" href="/leagues/venues" />
            {displayVenues ? (
              <div className="organization-list">
                {displayVenues.map((venue) => (
                  <div key={venue.id} className="organization-list__row">
                    <span className="organization-list__avatar" aria-hidden>
                      {venue.name.trim().charAt(0).toUpperCase() || "V"}
                    </span>
                    <div className="organization-list__copy">
                      <p className="organization-list__name">{venue.name}</p>
                      {venue.primaryContactName ? (
                        <p className="organization-list__description">
                          {venue.primaryContactName}
                        </p>
                      ) : venue.description ? (
                        <p className="organization-list__description">
                          {venue.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <OrganizationsPanel
              createOpen={createVenueOpen}
              onCreateOpenChange={setCreateVenueOpen}
              hideCreateButton
              bare
              hideList={hideRealVenueList}
              listLimit={5}
            />
          </GlassPanel>

          <GlassPanel className="league-dashboard__panel">
            <PanelCardHeader title="Upcoming tournaments" href="/leagues/tournaments" />
            {displayTournaments.length === 0 ? (
              <EmptySectionState message="No upcoming tournaments." />
            ) : (
              <ul className="league-dashboard__simple-list">
                {displayTournaments.map((tournament) => (
                  <li key={tournament.id} className="league-dashboard__simple-item">
                    <p className="league-dashboard__simple-title">{tournament.name}</p>
                    <p className="league-dashboard__simple-meta">
                      {tournament.venueName} · {tournament.format} ·{" "}
                      {formatLeagueDateTime(tournament.startsAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>

          <GlassPanel className="league-dashboard__panel">
            <PanelCardHeader title="Recent activity" href="/leagues/activity" />
            {displayActivity.length === 0 ? (
              <EmptySectionState message="No recent activity yet." />
            ) : (
              <ul className="league-dashboard__simple-list">
                {displayActivity.map((item) => (
                  <li key={item.id} className="league-dashboard__simple-item">
                    <p className="league-dashboard__simple-title">{item.title}</p>
                    <p className="league-dashboard__simple-meta">
                      {item.detail} · {formatLeagueDateTime(item.occurredAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>
        </div>
      </section>

      <CreateLeagueModal
        open={createLeagueOpen}
        onOpenChange={setCreateLeagueOpen}
        venues={memberships}
        venuesLoading={venuesLoading}
        submitting={creatingLeague}
        onCreate={createLeague}
        onRequestCreateVenue={() => setCreateVenueOpen(true)}
      />
    </div>
  );
}

export function LeagueDashboardScreen() {
  return (
    <MobileAppShell
      className="organizations-page shell-page league-management-page"
      title="League Management"
      headerContent={<LeagueHeaderProfile />}
    >
      <div className="organizations-screen">
        <Suspense
          fallback={
            <GlassPanel>
              <p className="settings-panel__subdescription">
                Loading league management...
              </p>
            </GlassPanel>
          }
        >
          <LeagueDashboardContent />
        </Suspense>
      </div>
    </MobileAppShell>
  );
}
