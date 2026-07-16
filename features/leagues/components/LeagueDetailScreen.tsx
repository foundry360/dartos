"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { EditLeagueModal } from "@/features/leagues/components/EditLeagueModal";
import { LeagueDetailNav } from "@/features/leagues/components/LeagueDetailNav";
import {
  LeagueDetailPanel,
  type LeagueDetailOverviewModel,
} from "@/features/leagues/components/LeagueDetailPanel";
import { LeagueHeaderProfile } from "@/features/leagues/components/LeagueHeaderProfile";
import { UnlockLeagueModal } from "@/features/leagues/components/UnlockLeagueModal";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import {
  readLeagueDetailLocked,
  writeLeagueDetailLocked,
} from "@/features/leagues/lib/league-detail-lock";
import {
  datetimeLocalToIso,
  formatLeagueCompetitionFormatLabel,
  formatLeagueDate,
  formatLeagueFormatDetailLabel,
  formatLeagueGameFormatLabel,
  formatLeagueNightScheduleAt,
  formatLeagueTime,
  formatLeagueWeekday,
  isLeagueCompetitionFormat,
  isLeagueFormat,
  isLeagueGameFormat,
} from "@/features/leagues/lib/league-formats";
import {
  formatLeagueRulesSummaryRows,
  leagueHasSavedRules,
  resolveLeagueRulesForMatches,
} from "@/features/leagues/lib/league-game-rules";
import {
  parseLeagueDetailSection,
  type LeagueDetailSectionId,
} from "@/features/leagues/lib/league-detail-sections";
import {
  getSampleLeagueById,
  getSampleLeagueOverview,
  getSampleSeasonsForOrganization,
  getSampleVenueMemberships,
  toOverviewRosterPlayer,
} from "@/features/leagues/lib/sample-league-dashboard";
import { EliteUpgradePanel } from "@/features/organizations/components/EliteUpgradePanel";
import { OrganizationsPanel } from "@/features/organizations/components/OrganizationsPanel";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import { useOrganizations } from "@/features/organizations/hooks/useOrganizations";
import { createClient } from "@/lib/supabase/client";
import {
  updateLeague,
  publishLeague,
  type LeagueWithVenue,
  type UpdateLeagueInput,
} from "@/lib/supabase/queries/leagues";
import { LOGIN_PATH } from "@/lib/auth/routes";
import "@/features/organizations/organizations-page.css";
import "@/features/leagues/league-detail.css";

function LeagueDetailMessage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="organizations-screen">
      <GlassPanel>
        <h2 className="settings-panel__subheading text-2xl font-bold">{title}</h2>
        {children}
      </GlassPanel>
    </div>
  );
}

function MetaIcon({ children }: { children: ReactNode }) {
  return <span className="league-detail-header__meta-icon">{children}</span>;
}

function LeagueDetailContent() {
  const params = useParams<{ leagueId: string }>();
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : undefined;
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const { user, loading: authLoading } = useAuth();
  const {
    allowed: canManageLeagues,
    loading: accessLoading,
  } = useLeagueManagementAccess();
  const { league: data, loading, error, notFound, isCloudConfigured, setLeague } =
    useLeagueDetail(leagueId);
  const { players: leaguePlayers } = useLeaguePlayers(leagueId);
  const { teams: leagueTeams } = useLeagueTeams(leagueId);
  const { schedule } = useLeagueSchedule(leagueId);
  const {
    memberships,
    loading: venuesLoading,
  } = useOrganizations();
  const [activeSection, setActiveSection] = useState<LeagueDetailSectionId>(
    parseLeagueDetailSection(sectionParam),
  );
  const [editLeagueOpen, setEditLeagueOpen] = useState(false);
  const [savingLeague, setSavingLeague] = useState(false);
  const [publishingLeague, setPublishingLeague] = useState(false);
  const [createVenueOpen, setCreateVenueOpen] = useState(false);
  const [actionsLocked, setActionsLocked] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [headerPanelOpen, setHeaderPanelOpen] = useState(true);

  useEffect(() => {
    setActionsLocked(readLeagueDetailLocked(leagueId));
  }, [leagueId]);

  const setLeagueActionsLocked = (locked: boolean) => {
    setActionsLocked(locked);
    writeLeagueDetailLocked(leagueId, locked);

    if (locked) {
      setEditLeagueOpen(false);
      setCreateVenueOpen(false);
      setUnlockOpen(false);
    }
  };

  useEffect(() => {
    setActiveSection(parseLeagueDetailSection(sectionParam));
  }, [sectionParam]);

  const pageLoading = authLoading || loading || accessLoading;
  const usingSample = Boolean(leagueId && getSampleLeagueById(leagueId));
  const sampleOverview = usingSample && leagueId ? getSampleLeagueOverview(leagueId) : null;

  const league = data?.league;
  const organization = data?.organization;
  const season = data?.season;

  const overviewRoster = useMemo(
    () => leaguePlayers.map(toOverviewRosterPlayer),
    [leaguePlayers],
  );
  const playerCount = leaguePlayers.length;
  const pendingInvites = useMemo(
    () =>
      leaguePlayers.filter(
        (player) =>
          player.leagueStatus === "pending" || player.leagueStatus === "invited",
      ).length,
    [leaguePlayers],
  );
  const teamCount = leagueTeams.length;
  const isSinglesLeague = (league?.format || "").toLowerCase() === "singles";
  const matchCount =
    schedule?.matches.length ?? sampleOverview?.matchCount ?? 0;
  const hasPlayers = playerCount > 0;
  const hasTeams = isSinglesLeague || teamCount > 0;
  const hasSchedule = matchCount > 0 || schedule?.status === "published";
  const isPublished = Boolean(league?.published_at);

  const formatLabel = formatLeagueFormatDetailLabel(league?.format);
  const competitionFormatLabel = formatLeagueCompetitionFormatLabel(
    league?.competition_format,
  );
  const gameFormatLabel = formatLeagueGameFormatLabel(league?.game_format);
  const hasRules = league ? leagueHasSavedRules(league) : false;
  const rulesSummary =
    league && hasRules
      ? (() => {
          const rules = resolveLeagueRulesForMatches(league);
          return rules
            ? formatLeagueRulesSummaryRows(rules, gameFormatLabel)
            : null;
        })()
      : null;
  const nightSchedule = formatLeagueNightScheduleAt(league?.starts_at);
  const matchDay = formatLeagueWeekday(league?.starts_at);
  const matchTime = formatLeagueTime(league?.starts_at);
  const startsOn = formatLeagueDate(league?.starts_at);
  const endsOn = formatLeagueDate(league?.ends_at);
  const detailsComplete = Boolean(
    league?.name?.trim() &&
      league?.format &&
      league?.competition_format &&
      league?.game_format &&
      league?.starts_at &&
      league?.ends_at &&
      organization?.name,
  );

  const overview = useMemo<LeagueDetailOverviewModel | null>(() => {
    if (!league || !organization) {
      return null;
    }

    return {
      venueName: organization.name,
      seasonName: season?.name ?? null,
      formatLabel,
      competitionFormatLabel,
      gameFormatLabel,
      maxPlayers: league.max_players ?? null,
      matchDay,
      matchTime,
      startsOn,
      endsOn,
      playerCount,
      pendingInvites,
      teamCount,
      matchCount,
      hasPlayers,
      hasTeams,
      hasSchedule,
      hasRules,
      rulesSummary,
      isPublished,
      roster: overviewRoster,
      activity: (
        sampleOverview?.activity ??
        [
          // Roster is oldest-first from the API; reverse so newest adds lead.
          ...[...overviewRoster]
            .reverse()
            .slice(0, 5)
            .map((player) => ({
              id: `player-${player.id}`,
              title: `${player.name} added`,
              timeLabel: player.team,
            })),
          league.created_at
            ? {
                id: "created",
                title: "League Created",
                timeLabel: formatLeagueDate(league.created_at) ?? "Recently",
              }
            : null,
        ].filter(Boolean) as Array<{
          id: string;
          title: string;
          timeLabel: string;
        }>
      ).slice(0, 6),
      checklist: [
        { id: "created", label: "League Created", complete: true },
        {
          id: "details",
          label: "League Details Added",
          complete: detailsComplete,
        },
        {
          id: "rules",
          label: "Define Game Rules",
          complete: hasRules,
          subtitle: hasRules
            ? "Match play rules saved for this league"
            : "Set scoring and gameplay rules for every match",
          actionLabel: "Edit Rules",
          actionSection: "rules",
        },
        {
          id: "players",
          label: "Add Players",
          complete: hasPlayers,
          subtitle: hasPlayers
            ? `${playerCount} player${playerCount === 1 ? "" : "s"} added so far`
            : "No players added yet",
          actionLabel: "Manage Players",
          actionSection: "players",
        },
        {
          id: "teams",
          label: "Create Teams",
          complete: hasTeams,
          subtitle: isSinglesLeague
            ? "Not required for singles leagues"
            : hasTeams
              ? `${teamCount} team${teamCount === 1 ? "" : "s"} created`
              : "No teams created yet",
          actionLabel: isSinglesLeague ? undefined : "Manage Teams",
          actionSection: isSinglesLeague ? undefined : "teams",
        },
        {
          id: "schedule",
          label: "Generate Schedule",
          complete: hasSchedule,
          subtitle: hasSchedule
            ? schedule?.status === "published"
              ? `${matchCount} match${matchCount === 1 ? "" : "es"} published`
              : `${matchCount} match${matchCount === 1 ? "" : "es"} scheduled`
            : "No matches scheduled yet",
          actionLabel: "Create Schedule",
          actionSection: "schedule",
        },
        {
          id: "publish",
          label: "Publish League",
          complete: isPublished,
          subtitle: "Make this league visible to players",
          emphasize: true,
        },
      ],
    };
  }, [
    league,
    organization,
    season?.name,
    formatLabel,
    competitionFormatLabel,
    gameFormatLabel,
    matchDay,
    matchTime,
    startsOn,
    endsOn,
    playerCount,
    pendingInvites,
    teamCount,
    matchCount,
    hasPlayers,
    hasTeams,
    hasSchedule,
    hasRules,
    rulesSummary,
    isSinglesLeague,
    schedule?.status,
    sampleOverview,
    overviewRoster,
    detailsComplete,
    isPublished,
    league?.max_players,
  ]);

  const venuesForEdit = usingSample ? getSampleVenueMemberships() : memberships;

  const handleSaveLeague = async (input: UpdateLeagueInput) => {
    setSavingLeague(true);

    try {
      if (usingSample) {
        if (!data) {
          throw new Error("League not found.");
        }

        if (!isLeagueFormat(input.format)) {
          throw new Error("Select a league type.");
        }

        const competitionFormatRaw =
          input.competitionFormat?.toString().trim().toLowerCase() || "";

        if (!isLeagueCompetitionFormat(competitionFormatRaw)) {
          throw new Error("Select a league format.");
        }

        const gameFormatRaw =
          input.gameFormat?.toString().trim().toLowerCase() || "";

        if (!isLeagueGameFormat(gameFormatRaw)) {
          throw new Error("Select a game format.");
        }

        const startsAt = datetimeLocalToIso(input.startsAtLocal);
        const endsAt = datetimeLocalToIso(input.endsAtLocal);

        if (!startsAt || !endsAt) {
          throw new Error("Start and finish dates are required.");
        }

        const venue =
          venuesForEdit.find(
            (entry) => entry.organization.id === input.organizationId,
          )?.organization ?? data.organization;

        const nextSeasonId = input.seasonId?.trim() || data.league.season_id;
        const nextSeasonName = input.seasonName?.trim() || "";
        const sampleSeason = nextSeasonId
          ? getSampleSeasonsForOrganization(input.organizationId).find(
              (entry) => entry.id === nextSeasonId,
            )
          : null;
        const nextSeason = nextSeasonName
          ? {
              id:
                nextSeasonId ||
                data.season?.id ||
                `sample-season-${input.organizationId}`,
              name: nextSeasonName,
              slug: nextSeasonName.toLowerCase().replace(/\s+/g, "-"),
            }
          : sampleSeason
            ? {
                id: sampleSeason.id,
                name: sampleSeason.name,
                slug: sampleSeason.slug,
              }
            : data.season;

        const updated: LeagueWithVenue = {
          league: {
            ...data.league,
            organization_id: input.organizationId,
            season_id: nextSeasonId,
            name: input.name.trim(),
            format: input.format,
            competition_format: competitionFormatRaw,
            game_format: gameFormatRaw,
            rules:
              data.league.game_format === gameFormatRaw
                ? data.league.rules
                : null,
            max_players: input.maxPlayers ?? null,
            starts_at: startsAt,
            ends_at: endsAt,
            description: input.description?.trim() || null,
            updated_at: new Date().toISOString(),
          },
          organization: {
            id: venue.id,
            name: venue.name,
            slug: venue.slug,
          },
          season: nextSeason,
        };

        setLeague(updated);
        return;
      }

      const supabase = createClient();

      if (!supabase) {
        throw new Error("Sign in to update this league.");
      }

      const updated = await updateLeague(supabase, input);
      setLeague(updated);
    } finally {
      setSavingLeague(false);
    }
  };

  const handlePublishLeague = async () => {
    if (!leagueId || !data || isPublished || publishingLeague || actionsLocked) {
      return;
    }

    setPublishingLeague(true);
    setPublishError(null);

    try {
      if (usingSample) {
        setLeague({
          ...data,
          league: {
            ...data.league,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        });
        return;
      }

      const supabase = createClient();

      if (!supabase) {
        throw new Error("Sign in to publish this league.");
      }

      const updated = await publishLeague(supabase, leagueId);
      setLeague(updated);
    } catch (caught) {
      setPublishError(
        caught instanceof Error ? caught.message : "Unable to publish league.",
      );
    } finally {
      setPublishingLeague(false);
    }
  };

  let body: ReactNode;

  if (!isCloudConfigured && !usingSample) {
    body = (
      <LeagueDetailMessage title="League">
        <p className="settings-panel__subdescription">
          Connect Supabase to view league details.
        </p>
      </LeagueDetailMessage>
    );
  } else if (pageLoading) {
    body = (
      <LeagueDetailMessage title="League">
        <p className="settings-panel__subdescription">Loading league...</p>
      </LeagueDetailMessage>
    );
  } else if (!user && !usingSample) {
    body = (
      <LeagueDetailMessage title="League">
        <p className="settings-panel__subdescription">Sign in to view this league.</p>
        <Link href={LOGIN_PATH} className="mt-4 block">
          <TouchButton fullWidth size="lg">
            Sign in
          </TouchButton>
        </Link>
      </LeagueDetailMessage>
    );
  } else if (!canManageLeagues && !usingSample) {
    body = (
      <div className="organizations-screen">
        <EliteUpgradePanel
          title="League Pro required"
          description="League details and management are included with the League Pro plan."
        />
      </div>
    );
  } else if (error) {
    body = (
      <LeagueDetailMessage title="League">
        <p className="text-sm text-danger">{error}</p>
      </LeagueDetailMessage>
    );
  } else if (notFound || !league || !organization || !overview) {
    body = (
      <LeagueDetailMessage title="League not found">
        <p className="settings-panel__subdescription">
          This league does not exist or you do not have access.
        </p>
        <Link href="/leagues" className="mt-4 block">
          <TouchButton fullWidth size="lg" variant="secondary">
            Back to League Management
          </TouchButton>
        </Link>
      </LeagueDetailMessage>
    );
  } else {
    const metaItems: Array<{
      key: string;
      label: string;
      icon: "season" | "venue" | "time" | "format" | "gameFormat";
    }> = [];

    if (season?.name) {
      metaItems.push({ key: "season", label: `${season.name} Season`, icon: "season" });
    }
    metaItems.push({ key: "venue", label: organization.name, icon: "venue" });
    if (nightSchedule) {
      metaItems.push({ key: "time", label: nightSchedule, icon: "time" });
    }
    if (formatLabel) {
      metaItems.push({ key: "format", label: formatLabel, icon: "format" });
    }
    if (gameFormatLabel) {
      metaItems.push({
        key: "gameFormat",
        label: gameFormatLabel,
        icon: "gameFormat",
      });
    }

    body = (
      <div
        className={
          actionsLocked
            ? "league-detail-screen league-detail-screen--locked"
            : "league-detail-screen"
        }
      >
        <header
          className={
            headerPanelOpen
              ? "league-detail-header"
              : "league-detail-header is-collapsed"
          }
        >
          <div className="league-detail-header__crumb-row">
            <nav className="league-detail-header__breadcrumb" aria-label="Breadcrumb">
              <Link href="/leagues" className="league-detail-header__crumb">
                Leagues
              </Link>
              <span className="league-detail-header__crumb-sep" aria-hidden>
                /
              </span>
              <span className="league-detail-header__crumb-current">{league.name}</span>
            </nav>
            <button
              type="button"
              className="league-detail-header__collapse"
              aria-expanded={headerPanelOpen}
              aria-controls="league-detail-header-panel"
              onClick={() => setHeaderPanelOpen((open) => !open)}
            >
              <span className="sr-only">
                {headerPanelOpen
                  ? "Collapse league details"
                  : "Expand league details"}
              </span>
              <svg
                className="league-detail-header__collapse-chevron"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          <div
            className={
              headerPanelOpen
                ? "league-detail-header__top"
                : "league-detail-header__top is-collapsed"
            }
            hidden={!headerPanelOpen}
          >
            <div className="league-detail-header__title-row">
              <h1 className="league-detail-header__title">{league.name}</h1>
              {actionsLocked ? (
                <span className="league-detail-header__locked-badge">Locked</span>
              ) : null}
            </div>

            <div
              id="league-detail-header-panel"
              className="league-detail-header__identity"
            >
                <div className="league-detail-header__meta-row">
                  {metaItems.length > 0 ? (
                    <div className="league-detail-header__meta">
                      {metaItems.map((item, index) => (
                        <span key={item.key} className="league-detail-header__meta-item">
                          {index > 0 ? (
                            <span className="league-detail-header__meta-sep" aria-hidden>
                              ·
                            </span>
                          ) : null}
                          <MetaIcon>
                            {item.icon === "season" ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                              </svg>
                            ) : item.icon === "venue" ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                            ) : item.icon === "time" ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 3" />
                              </svg>
                            ) : item.icon === "gameFormat" ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <circle cx="12" cy="12" r="4.5" />
                                <circle cx="12" cy="12" r="0.8" fill="currentColor" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                            )}
                          </MetaIcon>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="league-detail-header__meta" />
                  )}

                  <div className="league-detail-header__actions">
                    <button
                      type="button"
                      className="league-btn league-btn--ghost-dark"
                      disabled={actionsLocked}
                      onClick={() => setEditLeagueOpen(true)}
                    >
                      Edit League
                      <svg
                        className="league-btn__icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M7 17 17 7" />
                        <path d="M8 7h9v9" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="league-btn league-btn--primary"
                      disabled={
                        actionsLocked ||
                        isPublished ||
                        publishingLeague ||
                        savingLeague
                      }
                      title={
                        isPublished
                          ? "League is published"
                          : actionsLocked
                            ? "Unlock to publish"
                            : "Publish league"
                      }
                      onClick={() => {
                        void handlePublishLeague();
                      }}
                    >
                      {publishingLeague
                        ? "Publishing…"
                        : isPublished
                          ? "Published"
                          : "Publish League"}
                      <svg
                        className="league-btn__icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M7 17 17 7" />
                        <path d="M8 7h9v9" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="league-btn league-btn--ghost-dark league-btn--lock"
                      aria-pressed={actionsLocked}
                      aria-label={actionsLocked ? "Unlock league editing" : "Lock league editing"}
                      title={actionsLocked ? "Unlock" : "Lock"}
                      onClick={() => {
                        if (actionsLocked) {
                          setUnlockOpen(true);
                          return;
                        }

                        setLeagueActionsLocked(true);
                      }}
                    >
                      {actionsLocked ? (
                        <svg
                          className="league-btn__icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                      ) : (
                        <svg
                          className="league-btn__icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 7.2-2.4" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {publishError ? (
                  <p className="league-detail-header__publish-error" role="alert">
                    {publishError}
                  </p>
                ) : null}
            </div>
          </div>
        </header>

        <LeagueDetailNav
          activeSection={activeSection}
          onSelect={setActiveSection}
        />

        <div className="league-detail-body" inert={actionsLocked || undefined}>
          <LeagueDetailPanel
            section={activeSection}
            leagueId={league.id}
            leagueEntry={data}
            onSelectSection={setActiveSection}
            onEditLeague={
              actionsLocked ? undefined : () => setEditLeagueOpen(true)
            }
            onUpdateLeague={handleSaveLeague}
            onLeagueEntryChange={setLeague}
            onMaxPlayersChange={(nextMax) => {
              if (!data) {
                return;
              }

              setLeague({
                ...data,
                league: {
                  ...data.league,
                  max_players: nextMax,
                  updated_at: new Date().toISOString(),
                },
              });
            }}
            overview={overview}
          />
        </div>
      </div>
    );
  }

  return (
    <MobileAppShell
      className="organizations-page league-detail-page shell-page"
      headerContent={<LeagueHeaderProfile />}
    >
      {body}
      <EditLeagueModal
        open={editLeagueOpen && !actionsLocked}
        onOpenChange={setEditLeagueOpen}
        league={data}
        venues={venuesForEdit}
        venuesLoading={!usingSample && venuesLoading}
        submitting={savingLeague}
        onSave={handleSaveLeague}
        onRequestCreateVenue={() => setCreateVenueOpen(true)}
      />
      <UnlockLeagueModal
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onUnlocked={() => setLeagueActionsLocked(false)}
      />
      <OrganizationsPanel
        createOpen={createVenueOpen && !actionsLocked}
        onCreateOpenChange={setCreateVenueOpen}
        hideCreateButton
        hideList
        bare
      />
    </MobileAppShell>
  );
}

export function LeagueDetailScreen() {
  return (
    <Suspense
      fallback={
        <MobileAppShell
          className="organizations-page league-detail-page shell-page"
          headerContent={<LeagueHeaderProfile />}
        >
          <LeagueDetailMessage title="League">
            <p className="settings-panel__subdescription">Loading league...</p>
          </LeagueDetailMessage>
        </MobileAppShell>
      }
    >
      <LeagueDetailContent />
    </Suspense>
  );
}
