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
import { LeagueScheduleStatusBadge } from "@/features/leagues/components/LeagueScheduleStatus";
import { VenueInfoModal } from "@/features/leagues/components/VenueInfoModal";
import { useLeagues } from "@/features/leagues/hooks/useLeagues";
import { useLeagueManagementActivity } from "@/features/leagues/hooks/useLeagueManagementActivity";
import {
  formatLeagueDateTime,
  formatLeagueFormatLabel,
  getLeagueScheduleStatus,
  LEAGUE_VIEW_FILTER_OPTIONS,
  leagueViewChartXLabel,
  leagueViewFilterDayCount,
  leagueViewStatLabel,
  matchesLeagueViewFilter,
  type LeagueViewFilter,
} from "@/features/leagues/lib/league-formats";
import {
  getSampleSeasonStats,
  getSampleVenueMemberships,
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
import { createClient } from "@/lib/supabase/client";
import { LOGIN_PATH, LEAGUE_PLAY_PATH } from "@/lib/auth/routes";
import { fetchRosterStatsForLeagues } from "@/lib/supabase/queries/league-players";
import type {
  OrganizationMembership,
  UpdateOrganizationInput,
} from "@/lib/supabase/queries/organizations";
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
  onViewAll,
}: {
  id?: string;
  title: string;
  href?: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="league-dashboard__panel-header">
      <h2 id={id} className="league-dashboard__panel-title">
        {title}
      </h2>
      {onViewAll ? (
        <button
          type="button"
          className="league-dashboard__panel-link"
          onClick={onViewAll}
        >
          View all
        </button>
      ) : href ? (
        <Link href={href} className="league-dashboard__panel-link">
          View all
        </Link>
      ) : null}
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
    saving: savingVenue,
    refresh: refreshVenues,
    updateOrganization: updateVenue,
  } = useOrganizations();
  const {
    leagues,
    loading: leaguesLoading,
    saving: creatingLeague,
    createLeague,
    error: leaguesError,
  } = useLeagues();
  const sampleEnabled = shouldUseLeagueManagementSample(searchParams.get("sample"));
  const { activity: liveActivity, loading: activityLoading } =
    useLeagueManagementActivity(!sampleEnabled);
  const [createVenueOpen, setCreateVenueOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] =
    useState<OrganizationMembership | null>(null);
  const [createLeagueOpen, setCreateLeagueOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState<LeagueViewFilter>("30d");
  const [rosterStats, setRosterStats] = useState({
    playerCount: 0,
    teamCount: 0,
  });
  const wasCreateVenueOpen = useRef(false);
  const allLeagues = sampleEnabled ? SAMPLE_LEAGUES : leagues;
  const displayLeagues = useMemo(
    () => allLeagues.filter(({ league }) => matchesLeagueViewFilter(league, viewFilter)),
    [allLeagues, viewFilter],
  );
  const filteredLeagueIds = useMemo(
    () => displayLeagues.map(({ league }) => league.id),
    [displayLeagues],
  );
  const displayVenues = sampleEnabled ? SAMPLE_VENUES.slice(0, 5) : null;
  const displayTournaments = sampleEnabled ? SAMPLE_TOURNAMENTS.slice(0, 5) : [];
  const displayActivity = sampleEnabled
    ? SAMPLE_ACTIVITY.slice(0, 5)
    : liveActivity.slice(0, 5);
  const usingSampleLeagues = sampleEnabled;
  const hideRealVenueList = sampleEnabled;
  const chartXLabel = leagueViewChartXLabel(viewFilter);

  const venuesForLookup = useMemo(
    () => (sampleEnabled ? getSampleVenueMemberships() : memberships),
    [sampleEnabled, memberships],
  );

  const openVenueInfo = (membership: OrganizationMembership) => {
    setSelectedVenue(membership);
  };

  const openSampleVenueInfo = (venueId: string) => {
    const membership = venuesForLookup.find(
      (entry) => entry.organization.id === venueId,
    );

    if (membership) {
      setSelectedVenue(membership);
    }
  };

  const handleSaveVenue = async (
    input: UpdateOrganizationInput,
  ): Promise<OrganizationMembership> => {
    if (sampleEnabled) {
      if (!selectedVenue) {
        throw new Error("Select a venue to edit.");
      }

      const updated: OrganizationMembership = {
        ...selectedVenue,
        organization: {
          ...selectedVenue.organization,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          primary_contact_name: input.primaryContactName?.trim() || null,
          primary_contact_email: input.primaryContactEmail?.trim() || null,
          primary_contact_phone: input.primaryContactPhone?.trim() || null,
          logo_url: input.removeAvatar
            ? null
            : selectedVenue.organization.logo_url,
          updated_at: new Date().toISOString(),
        },
      };

      setSelectedVenue(updated);
      return updated;
    }

    const updated = await updateVenue(input);
    setSelectedVenue(updated);
    return updated;
  };

  const venueActiveLeagues = useMemo(() => {
    if (!selectedVenue) {
      return [];
    }

    return allLeagues
      .filter(
        ({ league }) =>
          league.organization_id === selectedVenue.organization.id &&
          getLeagueScheduleStatus(league) === "active",
      )
      .map(({ league, season }) => ({
        id: league.id,
        name: league.name,
        formatLabel: formatLeagueFormatLabel(league.format),
        seasonName: season?.name ?? null,
      }));
  }, [allLeagues, selectedVenue]);

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

  useEffect(() => {
    if (sampleEnabled) {
      setRosterStats({ playerCount: 0, teamCount: 0 });
      return;
    }

    if (!user || filteredLeagueIds.length === 0) {
      setRosterStats({ playerCount: 0, teamCount: 0 });
      return;
    }

    let cancelled = false;

    const loadRosterStats = async () => {
      const supabase = createClient();

      if (!supabase) {
        if (!cancelled) {
          setRosterStats({ playerCount: 0, teamCount: 0 });
        }
        return;
      }

      try {
        const stats = await fetchRosterStatsForLeagues(supabase, filteredLeagueIds);

        if (!cancelled) {
          setRosterStats(stats);
        }
      } catch (caught) {
        console.error("Failed to load league roster stats", caught);

        if (!cancelled) {
          setRosterStats({ playerCount: 0, teamCount: 0 });
        }
      }
    };

    void loadRosterStats();

    return () => {
      cancelled = true;
    };
  }, [filteredLeagueIds, sampleEnabled, user]);

  const seasonStats = useMemo(() => {
    const withSeries = sampleEnabled
      ? getSampleSeasonStats(viewFilter).map((entry) => ({ ...entry }))
      : (() => {
          const filteredCount = filteredLeagueIds.length;

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
              value: rosterStats.playerCount,
            },
            {
              id: "teams" as const,
              label: leagueViewStatLabel(viewFilter, "teams"),
              value: rosterStats.teamCount,
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
  }, [filteredLeagueIds.length, rosterStats, sampleEnabled, viewFilter]);

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
                <span>Status</span>
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
                  const scheduleStatus = getLeagueScheduleStatus(league);

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
                        <div className="league-dashboard__league-cell">
                          <LeagueScheduleStatusBadge status={scheduleStatus} />
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
          <GlassPanel className="league-dashboard__panel">
            <PanelCardHeader title="Venues" />
            {displayVenues ? (
              <div className="organization-list">
                {displayVenues.map((venue) => (
                  <button
                    key={venue.id}
                    type="button"
                    className="organization-list__row organization-list__row--button"
                    onClick={() => openSampleVenueInfo(venue.id)}
                  >
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
                    <span className="organization-list__chevron" aria-hidden>
                      ›
                    </span>
                  </button>
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
              onVenueClick={openVenueInfo}
            />
          </GlassPanel>

          <GlassPanel className="league-dashboard__panel">
            <PanelCardHeader title="Upcoming tournaments" />
            {displayTournaments.length === 0 ? (
              <EmptySectionState message="No upcoming tournaments yet." />
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
            <PanelCardHeader title="Recent activity" />
            {!sampleEnabled && activityLoading ? (
              <EmptySectionState message="Loading activity..." />
            ) : displayActivity.length === 0 ? (
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

      <VenueInfoModal
        open={Boolean(selectedVenue)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVenue(null);
          }
        }}
        venue={selectedVenue}
        activeLeagues={venueActiveLeagues}
        saving={savingVenue}
        onSave={handleSaveVenue}
      />

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
