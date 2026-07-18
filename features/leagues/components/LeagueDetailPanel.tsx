"use client";

import type { ReactNode } from "react";
import { LeagueDetailOverview } from "@/features/leagues/components/LeagueDetailOverview";
import { LeagueDetailMatches } from "@/features/leagues/components/LeagueDetailMatches";
import { LeagueDetailNight } from "@/features/leagues/components/LeagueDetailNight";
import { LeagueDetailPlayers } from "@/features/leagues/components/LeagueDetailPlayers";
import { LeagueDetailRules } from "@/features/leagues/components/LeagueDetailRules";
import { LeagueDetailSchedule } from "@/features/leagues/components/LeagueDetailSchedule";
import { LeagueDetailStandings } from "@/features/leagues/components/LeagueDetailStandings";
import { LeagueDetailStatistics } from "@/features/leagues/components/LeagueDetailStatistics";
import { LeagueDetailTeams } from "@/features/leagues/components/LeagueDetailTeams";
import {
  LEAGUE_DETAIL_SECTIONS,
  type LeagueDetailSectionId,
} from "@/features/leagues/lib/league-detail-sections";
import type { LeagueOverviewDashboard } from "@/features/leagues/lib/league-overview";
import type {
  LeagueWithVenue,
  UpdateLeagueInput,
} from "@/lib/supabase/queries/leagues";

interface LeagueDetailPanelProps {
  section: LeagueDetailSectionId;
  leagueId: string;
  leagueEntry: LeagueWithVenue;
  overview: LeagueOverviewDashboard;
  onSelectSection: (section: LeagueDetailSectionId) => void;
  onEditLeague?: () => void;
  onUpdateLeague: (input: UpdateLeagueInput) => Promise<unknown>;
  onLeagueEntryChange: (entry: LeagueWithVenue) => void;
  onMaxPlayersChange?: (maxPlayers: number) => void;
  /** When true, setup section mutators are omitted (League Night in progress). */
  setupLocked?: boolean;
  onNightNavTrailingChange?: (node: ReactNode | null) => void;
}

export function LeagueDetailPanel({
  section,
  leagueId,
  leagueEntry,
  overview,
  onSelectSection,
  onEditLeague,
  onUpdateLeague,
  onLeagueEntryChange,
  onMaxPlayersChange,
  setupLocked = false,
  onNightNavTrailingChange,
}: LeagueDetailPanelProps) {
  if (section === "overview") {
    return (
      <LeagueDetailOverview
        overview={overview}
        onSelectSection={onSelectSection}
        onEditLeague={setupLocked ? undefined : onEditLeague}
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
      />
    );
  }

  if (section === "players") {
    return (
      <LeagueDetailPlayers
        leagueId={leagueId}
        maxPlayers={leagueEntry.league.max_players}
        onMaxPlayersChange={setupLocked ? undefined : onMaxPlayersChange}
      />
    );
  }

  if (section === "teams") {
    return (
      <LeagueDetailTeams
        leagueId={leagueId}
        isSingles={(leagueEntry.league.format || "").toLowerCase() === "singles"}
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
        isSingles={(leagueEntry.league.format || "").toLowerCase() === "singles"}
        boardCount={leagueEntry.organization.board_count}
        onSelectSection={onSelectSection}
      />
    );
  }

  if (section === "standings") {
    return (
      <LeagueDetailStandings
        leagueId={leagueId}
        isSingles={(leagueEntry.league.format || "").toLowerCase() === "singles"}
      />
    );
  }

  if (section === "statistics") {
    const isSingles =
      (leagueEntry.league.format || "").toLowerCase() === "singles";

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
