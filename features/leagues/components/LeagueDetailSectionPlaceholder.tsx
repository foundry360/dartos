"use client";

import { useState } from "react";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import {
  LEAGUE_DETAIL_SECTIONS,
  type LeagueDetailSectionId,
} from "@/features/leagues/lib/league-detail-sections";

type PlaceholderSectionId = Extract<
  LeagueDetailSectionId,
  "matches" | "standings" | "statistics"
>;

interface PlaceholderConfig {
  title: string;
  description: string;
  actionLabel: string;
  /** Navigate elsewhere when the CTA is a setup step, not this section’s create flow. */
  actionSection?: LeagueDetailSectionId;
}

const PLACEHOLDERS: Record<PlaceholderSectionId, PlaceholderConfig> = {
  matches: {
    title: "No matches yet",
    description:
      "Create matches manually or generate them from your league schedule once it’s ready.",
    actionLabel: "Create Match",
  },
  standings: {
    title: "No standings yet",
    description:
      "Standings populate as match results are recorded. Create a schedule to get started.",
    actionLabel: "Create Schedule",
    actionSection: "schedule",
  },
  statistics: {
    title: "No statistics yet",
    description:
      "Player and team statistics appear as matches are completed. Create a match to begin.",
    actionLabel: "Create Match",
    actionSection: "matches",
  },
};

interface LeagueDetailSectionPlaceholderProps {
  section: PlaceholderSectionId;
  onSelectSection?: (section: LeagueDetailSectionId) => void;
}

export function LeagueDetailSectionPlaceholder({
  section,
  onSelectSection,
}: LeagueDetailSectionPlaceholderProps) {
  const [toast, setToast] = useState<string | null>(null);
  const config = PLACEHOLDERS[section];
  const label =
    LEAGUE_DETAIL_SECTIONS.find((entry) => entry.id === section)?.label ??
    "Section";

  const handleAction = () => {
    if (config.actionSection && onSelectSection) {
      onSelectSection(config.actionSection);
      return;
    }

    setToast(`${config.actionLabel} is coming soon.`);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="league-players-admin">
      <section className="league-detail-card">
        <div className="league-detail-card__header">
          <h2 className="league-detail-card__title">{label}</h2>
        </div>

        <div className="league-empty league-empty--players">
          <div className="league-empty__icon" aria-hidden>
            <LeagueDetailSectionIcon section={section} />
          </div>
          <p className="league-empty__title">{config.title}</p>
          <p className="league-empty__sub">{config.description}</p>
          <button
            type="button"
            className="league-btn league-btn--primary"
            onClick={handleAction}
          >
            {config.actionLabel}
          </button>
        </div>
      </section>

      {toast ? (
        <div className="league-players-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export function isPlaceholderSection(
  section: LeagueDetailSectionId,
): section is PlaceholderSectionId {
  return (
    section === "matches" ||
    section === "standings" ||
    section === "statistics"
  );
}
