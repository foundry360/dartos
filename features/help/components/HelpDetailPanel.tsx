"use client";

import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { HelpCustomizeContent } from "@/features/help/components/HelpCustomizeContent";
import { HelpMatchPlayContent } from "@/features/help/components/HelpMatchPlayContent";
import { HelpOverviewContent } from "@/features/help/components/HelpOverviewContent";
import { HelpPlayersContent } from "@/features/help/components/HelpPlayersContent";
import { HelpPracticeContent } from "@/features/help/components/HelpPracticeContent";
import { HelpStatisticsContent } from "@/features/help/components/HelpStatisticsContent";
import {
  HELP_SECTIONS,
  type HelpSectionId,
} from "@/features/help/lib/help-sections";

interface HelpDetailPanelProps {
  section: HelpSectionId;
  /** iPhone master–detail: return to the full-width topic list. */
  onBack?: () => void;
}

export function HelpDetailPanel({ section, onBack }: HelpDetailPanelProps) {
  const meta = HELP_SECTIONS.find((entry) => entry.id === section);

  if (!meta) {
    return null;
  }

  return (
    <section className="settings-panel" aria-labelledby="help-panel-title">
      <header className="settings-panel__header">
        {onBack ? (
          <button
            type="button"
            className="settings-panel__back"
            onClick={onBack}
            aria-label="Back to Get Started topics"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Get Started</span>
          </button>
        ) : null}
        <h2 id="help-panel-title" className="settings-panel__title">
          {meta.label}
        </h2>
        {meta.description ? (
          <p className="settings-panel__description">{meta.description}</p>
        ) : null}
      </header>

      <div className="settings-panel__content">
        {section === "overview" ? (
          <HelpOverviewContent />
        ) : section === "matches" ? (
          <HelpMatchPlayContent />
        ) : section === "practice" ? (
          <HelpPracticeContent />
        ) : section === "stats" ? (
          <HelpStatisticsContent />
        ) : section === "players" ? (
          <HelpPlayersContent />
        ) : section === "customize" ? (
          <HelpCustomizeContent />
        ) : null}
      </div>
    </section>
  );
}
