"use client";

import { LeagueDetailOverview } from "@/features/leagues/components/LeagueDetailOverview";
import type { LeagueDetailOverviewModel } from "@/features/leagues/components/LeagueDetailOverview";
import { LeagueDetailPlayers } from "@/features/leagues/components/LeagueDetailPlayers";
import { LeagueDetailTeams } from "@/features/leagues/components/LeagueDetailTeams";
import {
  LEAGUE_DETAIL_SECTIONS,
  type LeagueDetailSectionId,
} from "@/features/leagues/lib/league-detail-sections";

interface LeagueDetailPanelProps {
  section: LeagueDetailSectionId;
  leagueId: string;
  overview: LeagueDetailOverviewModel;
  onSelectSection: (section: LeagueDetailSectionId) => void;
  onEditLeague?: () => void;
}

export function LeagueDetailPanel({
  section,
  leagueId,
  overview,
  onSelectSection,
  onEditLeague,
}: LeagueDetailPanelProps) {
  if (section === "overview") {
    return (
      <LeagueDetailOverview
        overview={overview}
        onSelectSection={onSelectSection}
        onEditLeague={onEditLeague}
      />
    );
  }

  if (section === "players") {
    return <LeagueDetailPlayers leagueId={leagueId} />;
  }

  if (section === "teams") {
    return <LeagueDetailTeams leagueId={leagueId} />;
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

export type { LeagueDetailOverviewModel };
