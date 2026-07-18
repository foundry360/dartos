"use client";

import type { ReactNode } from "react";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import {
  DEFAULT_LEAGUE_DETAIL_SECTION,
  LEAGUE_DETAIL_SECTIONS,
  type LeagueDetailSection,
  type LeagueDetailSectionId,
  type LeagueSetupSaveStatus,
} from "@/features/leagues/lib/league-detail-sections";
import { cn } from "@/utils/cn";

interface LeagueDetailNavProps {
  activeSection: LeagueDetailSectionId;
  onSelect: (section: LeagueDetailSectionId) => void;
  sections?: LeagueDetailSection[];
  trailing?: ReactNode;
  setupSaveStatus?: LeagueSetupSaveStatus;
}

function SetupSaveStatus({ status }: { status: LeagueSetupSaveStatus }) {
  if (status === "idle") {
    return null;
  }

  return (
    <span
      className={cn(
        "league-detail-subnav__save-status",
        status === "saving" && "league-detail-subnav__save-status--saving",
        status === "saved" && "league-detail-subnav__save-status--saved",
      )}
      aria-live="polite"
    >
      <svg
        className={cn(
          "league-detail-subnav__save-icon",
          status === "saving" && "league-detail-subnav__save-icon--spin",
        )}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      <span>{status === "saving" ? "Saving" : "Saved"}</span>
    </span>
  );
}

export function LeagueDetailNav({
  activeSection,
  onSelect,
  sections = LEAGUE_DETAIL_SECTIONS,
  trailing,
  setupSaveStatus = "idle",
}: LeagueDetailNavProps) {
  const hasStatistics = sections.some((section) => section.id === "statistics");

  return (
    <nav className="league-detail-subnav" aria-label="League sections">
      <div className="league-detail-subnav__row">
        <div className="league-detail-subnav__track">
          {sections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <span key={section.id} className="league-detail-subnav__cluster">
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSelect(section.id)}
                  className={cn(
                    "league-detail-subnav__item",
                    isActive && "league-detail-subnav__item--active",
                  )}
                >
                  <LeagueDetailSectionIcon
                    section={section.id}
                    className="league-detail-subnav__icon h-4 w-4"
                  />
                  <span>{section.label}</span>
                </button>
                {section.id === "statistics" ? (
                  <SetupSaveStatus status={setupSaveStatus} />
                ) : null}
              </span>
            );
          })}
          {!hasStatistics ? (
            <SetupSaveStatus status={setupSaveStatus} />
          ) : null}
        </div>
        {trailing ? (
          <div className="league-detail-subnav__trailing">{trailing}</div>
        ) : null}
      </div>
    </nav>
  );
}

export { DEFAULT_LEAGUE_DETAIL_SECTION };
