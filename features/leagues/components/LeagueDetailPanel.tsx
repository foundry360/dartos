"use client";

import type { ReactNode } from "react";
import { LeagueDetailOverview } from "@/features/leagues/components/LeagueDetailOverview";
import { LeagueDetailDetails } from "@/features/leagues/components/LeagueDetailDetails";
import { LeagueDetailMatches } from "@/features/leagues/components/LeagueDetailMatches";
import { LeagueDetailNight } from "@/features/leagues/components/LeagueDetailNight";
import { LeagueDetailPlayers } from "@/features/leagues/components/LeagueDetailPlayers";
import { LeagueDetailRules } from "@/features/leagues/components/LeagueDetailRules";
import { LeagueDetailSchedule } from "@/features/leagues/components/LeagueDetailSchedule";
import { LeagueDetailStandings } from "@/features/leagues/components/LeagueDetailStandings";
import { LeagueDetailStatistics } from "@/features/leagues/components/LeagueDetailStatistics";
import { LeagueDetailTeams } from "@/features/leagues/components/LeagueDetailTeams";
import {
  getNextLeagueSetupSection,
  getPreviousLeagueSetupSection,
  LEAGUE_DETAIL_SECTIONS,
  type LeagueDetailSectionId,
  type LeagueSetupSaveStatus,
} from "@/features/leagues/lib/league-detail-sections";
import type { LeagueOverviewDashboard } from "@/features/leagues/lib/league-overview";
import type {
  LeagueWithVenue,
  UpdateLeagueInput,
} from "@/lib/supabase/queries/leagues";
import type { OrganizationMembership } from "@/lib/supabase/queries/organizations";

interface LeagueDetailPanelProps {
  section: LeagueDetailSectionId;
  leagueId: string;
  leagueEntry: LeagueWithVenue;
  overview: LeagueOverviewDashboard;
  venues: OrganizationMembership[];
  venuesLoading?: boolean;
  savingLeague?: boolean;
  onSelectSection: (section: LeagueDetailSectionId) => void;
  onEditLeague?: () => void;
  onUpdateLeague: (input: UpdateLeagueInput) => Promise<unknown>;
  onLeagueEntryChange: (entry: LeagueWithVenue) => void;
  onMaxPlayersChange?: (maxPlayers: number) => void;
  onCreateVenue?: () => void;
  /** When true, setup section mutators are omitted (League Night in progress). */
  setupLocked?: boolean;
  onNightNavTrailingChange?: (node: ReactNode | null) => void;
  onSetupSaveStatus?: (status: LeagueSetupSaveStatus) => void;
}

export function LeagueDetailPanel({
  section,
  leagueId,
  leagueEntry,
  overview,
  venues,
  venuesLoading = false,
  savingLeague = false,
  onSelectSection,
  onEditLeague,
  onUpdateLeague,
  onLeagueEntryChange,
  onMaxPlayersChange,
  onCreateVenue,
  setupLocked = false,
  onNightNavTrailingChange,
  onSetupSaveStatus,
}: LeagueDetailPanelProps) {
  const isSingles =
    (leagueEntry.league.format || "").toLowerCase() === "singles";

  const advanceSetup = setupLocked
    ? undefined
    : () => {
        const next = getNextLeagueSetupSection(section, { isSingles });
        if (next) {
          onSelectSection(next);
        }
      };

  const retreatSetup = setupLocked
    ? undefined
    : () => {
        const previous = getPreviousLeagueSetupSection(section, { isSingles });
        if (previous) {
          onSelectSection(previous);
        }
      };

  if (section === "overview") {
    return (
      <LeagueDetailOverview
        overview={overview}
        onSelectSection={onSelectSection}
        onEditLeague={setupLocked ? undefined : onEditLeague}
      />
    );
  }

  if (section === "details") {
    return (
      <LeagueDetailDetails
        leagueEntry={leagueEntry}
        venues={venues}
        venuesLoading={venuesLoading}
        submitting={savingLeague}
        locked={setupLocked}
        onUpdateLeague={onUpdateLeague}
        onSetupSaveStatus={setupLocked ? undefined : onSetupSaveStatus}
        onAdvanceSetup={advanceSetup}
        onBack={() => onSelectSection("overview")}
        onCreateVenue={setupLocked ? undefined : onCreateVenue}
      />
    );
  }

  if (section === "rules") {
    return (
      <LeagueDetailRules
        leagueEntry={leagueEntry}
        onLeagueUpdated={
          setupLocked ? () => undefined : onLeagueEntryChange
        }
        onSetupSaveStatus={setupLocked ? undefined : onSetupSaveStatus}
        onAdvanceSetup={advanceSetup}
        onBack={retreatSetup}
      />
    );
  }

  if (section === "players") {
    return (
      <LeagueDetailPlayers
        leagueId={leagueId}
        maxPlayers={leagueEntry.league.max_players}
        onMaxPlayersChange={setupLocked ? undefined : onMaxPlayersChange}
        onSetupSaveStatus={setupLocked ? undefined : onSetupSaveStatus}
        onAdvanceSetup={advanceSetup}
        onBack={retreatSetup}
      />
    );
  }

  if (section === "teams") {
    return (
      <LeagueDetailTeams
        leagueId={leagueId}
        isSingles={isSingles}
        onSetupSaveStatus={setupLocked ? undefined : onSetupSaveStatus}
        onAdvanceSetup={advanceSetup}
      />
    );
  }

  if (section === "schedule") {
    return (
      <LeagueDetailSchedule
        leagueEntry={leagueEntry}
        onUpdateLeague={onUpdateLeague}
        onCancelToOverview={() => onSelectSection("overview")}
      />
    );
  }

  if (section === "night") {
    return (
      <LeagueDetailNight
        leagueId={leagueId}
        onSelectSection={onSelectSection}
        onNavTrailingChange={onNightNavTrailingChange}
      />
    );
  }

  if (section === "matches") {
    return (
      <LeagueDetailMatches
        leagueId={leagueId}
        isSingles={isSingles}
        boardCount={leagueEntry.organization.board_count}
        onSelectSection={onSelectSection}
      />
    );
  }

  if (section === "standings") {
    return (
      <LeagueDetailStandings
        leagueId={leagueId}
        isSingles={isSingles}
      />
    );
  }

  if (section === "statistics") {
    return (
      <LeagueDetailStatistics
        key={`stats-${leagueEntry.league.game_format ?? "none"}-${leagueEntry.league.updated_at}`}
        leagueId={leagueId}
        gameFormat={leagueEntry.league.game_format}
        isSingles={isSingles}
      />
    );
  }

  const meta = LEAGUE_DETAIL_SECTIONS.find((entry) => entry.id === section);

  if (!meta) {
    return null;
  }

  return (
    <div className="league-workspace league-workspace--single">
      <section className="league-detail-card">
        <div className="league-detail-card__header">
          <h2 className="league-detail-card__title">{meta.label}</h2>
        </div>
        <div className="league-empty">
          <p className="league-empty__title">{meta.label} coming soon</p>
          <p className="league-empty__sub">{meta.description}</p>
        </div>
      </section>
    </div>
  );
}

export type { LeagueOverviewDashboard as LeagueDetailOverviewModel };
