"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { LeagueDetailNav } from "@/features/leagues/components/LeagueDetailNav";
import {
  LeagueDetailPanel,
  type LeagueDetailOverviewModel,
} from "@/features/leagues/components/LeagueDetailPanel";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import {
  formatLeagueDate,
  formatLeagueFormatDetailLabel,
  formatLeagueNightScheduleAt,
  formatLeagueWeekday,
} from "@/features/leagues/lib/league-formats";
import {
  parseLeagueDetailSection,
  type LeagueDetailSectionId,
} from "@/features/leagues/lib/league-detail-sections";
import {
  getSampleLeagueById,
  getSampleLeagueOverview,
  getSampleLeagueRoster,
  shouldUseLeagueManagementSample,
} from "@/features/leagues/lib/sample-league-dashboard";
import { EliteUpgradePanel } from "@/features/organizations/components/EliteUpgradePanel";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
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
  const { league: data, loading, error, notFound, isCloudConfigured } =
    useLeagueDetail(leagueId);
  const [activeSection, setActiveSection] = useState<LeagueDetailSectionId>(
    parseLeagueDetailSection(sectionParam),
  );

  useEffect(() => {
    setActiveSection(parseLeagueDetailSection(sectionParam));
  }, [sectionParam]);

  const pageLoading = authLoading || loading || accessLoading;
  const usingSample =
    Boolean(leagueId) &&
    shouldUseLeagueManagementSample() &&
    Boolean(getSampleLeagueById(leagueId ?? ""));
  const sampleOverview = leagueId ? getSampleLeagueOverview(leagueId) : null;
  const sampleRoster = leagueId ? getSampleLeagueRoster(leagueId) : [];

  const league = data?.league;
  const organization = data?.organization;
  const season = data?.season;

  const playerCount = sampleOverview?.playerCount ?? sampleRoster.length;
  const pendingInvites = sampleOverview?.pendingInvites ?? 0;
  const teamCount = sampleOverview?.teamCount ?? 0;
  const matchCount = sampleOverview?.matchCount ?? 0;
  const hasPlayers = playerCount > 0;
  const hasTeams = teamCount > 0;
  const hasSchedule = matchCount > 0;
  const isPublished = false;

  const formatLabel = formatLeagueFormatDetailLabel(league?.format);
  const nightSchedule = formatLeagueNightScheduleAt(league?.starts_at);
  const matchDay = formatLeagueWeekday(league?.starts_at);
  const startsOn = formatLeagueDate(league?.starts_at);
  const endsOn = formatLeagueDate(league?.ends_at);
  const detailsComplete = Boolean(
    league?.name?.trim() &&
      league?.format &&
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
      matchDay,
      startsOn,
      endsOn,
      playerCount,
      pendingInvites,
      teamCount,
      matchCount,
      hasPlayers,
      hasTeams,
      hasSchedule,
      isPublished,
      roster: sampleRoster,
      activity: sampleOverview?.activity ?? [
        {
          id: "created",
          title: "League Created",
          timeLabel: "Recently",
        },
      ],
      checklist: [
        { id: "created", label: "League Created", complete: true },
        {
          id: "details",
          label: "League Details Added",
          complete: detailsComplete,
        },
        {
          id: "players",
          label: "Add Players",
          // Sample data keeps this open so the setup card still shows next actions.
          complete: sampleOverview ? false : hasPlayers,
          subtitle: hasPlayers
            ? `${playerCount} player${playerCount === 1 ? "" : "s"} added so far`
            : "No players added yet",
          actionLabel: "Manage Players",
          actionSection: "players",
        },
        {
          id: "teams",
          label: "Create Teams",
          complete: sampleOverview ? false : hasTeams,
          subtitle: hasTeams
            ? `${teamCount} team${teamCount === 1 ? "" : "s"} created`
            : "No teams created yet",
          actionLabel: "Manage Teams",
          actionSection: "teams",
        },
        {
          id: "schedule",
          label: "Generate Schedule",
          complete: hasSchedule,
          subtitle: hasSchedule
            ? `${matchCount} matches scheduled`
            : "No matches scheduled yet",
          actionLabel: "Create Schedule",
          actionSection: "schedule",
        },
        {
          id: "publish",
          label: "Publish League",
          complete: isPublished,
          subtitle: "Make this league visible to players",
          actionLabel: "Publish",
          actionSection: "settings",
          emphasize: true,
        },
      ],
    };
  }, [
    league,
    organization,
    season?.name,
    formatLabel,
    matchDay,
    startsOn,
    endsOn,
    playerCount,
    pendingInvites,
    teamCount,
    matchCount,
    hasPlayers,
    hasTeams,
    hasSchedule,
    sampleOverview,
    sampleRoster,
    detailsComplete,
    isPublished,
  ]);

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
    const metaItems: Array<{ key: string; label: string; icon: "season" | "venue" | "time" | "format" }> =
      [];

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

    body = (
      <div className="league-detail-screen">
        <header className="league-detail-header">
          <nav className="league-detail-header__breadcrumb" aria-label="Breadcrumb">
            <Link href="/leagues" className="league-detail-header__crumb">
              Leagues
            </Link>
            <span className="league-detail-header__crumb-sep" aria-hidden>
              /
            </span>
            <span className="league-detail-header__crumb-current">{league.name}</span>
          </nav>

          <div className="league-detail-header__top">
            <div className="league-detail-header__identity">
              <div className="league-detail-header__title-row">
                <h1 className="league-detail-header__title">{league.name}</h1>
              </div>

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
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="4.5" />
                            <circle cx="12" cy="12" r="0.8" fill="currentColor" />
                          </svg>
                        )}
                      </MetaIcon>
                      {item.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="league-detail-header__actions">
              <button
                type="button"
                className="league-btn league-btn--ghost-dark"
                disabled
                title="Coming soon"
              >
                Edit League
              </button>
              <button
                type="button"
                className="league-btn league-btn--primary"
                disabled
                title="Coming soon"
              >
                {isPublished ? "Published" : "Publish League"}
              </button>
            </div>
          </div>
        </header>

        <LeagueDetailNav
          activeSection={activeSection}
          onSelect={setActiveSection}
        />

        <div className="league-detail-body">
          <LeagueDetailPanel
            section={activeSection}
            leagueId={league.id}
            onSelectSection={setActiveSection}
            overview={overview}
          />
        </div>
      </div>
    );
  }

  return (
    <MobileAppShell
      title="League"
      className="organizations-page league-detail-page shell-page"
    >
      {body}
    </MobileAppShell>
  );
}

export function LeagueDetailScreen() {
  return (
    <Suspense
      fallback={
        <MobileAppShell
          title="League"
          className="organizations-page league-detail-page shell-page"
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
