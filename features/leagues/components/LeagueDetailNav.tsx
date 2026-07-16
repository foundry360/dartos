"use client";

import type { ReactNode } from "react";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import {
  DEFAULT_LEAGUE_DETAIL_SECTION,
  LEAGUE_DETAIL_SECTIONS,
  type LeagueDetailSection,
  type LeagueDetailSectionId,
} from "@/features/leagues/lib/league-detail-sections";
import { cn } from "@/utils/cn";

interface LeagueDetailNavProps {
  activeSection: LeagueDetailSectionId;
  onSelect: (section: LeagueDetailSectionId) => void;
  sections?: LeagueDetailSection[];
  trailing?: ReactNode;
}

export function LeagueDetailNav({
  activeSection,
  onSelect,
  sections = LEAGUE_DETAIL_SECTIONS,
  trailing,
}: LeagueDetailNavProps) {
  return (
    <nav className="league-detail-subnav" aria-label="League sections">
      <div className="league-detail-subnav__row">
        <div className="league-detail-subnav__track">
          {sections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
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
            );
          })}
        </div>
        {trailing ? (
          <div className="league-detail-subnav__trailing">{trailing}</div>
        ) : null}
      </div>
    </nav>
  );
}

export { DEFAULT_LEAGUE_DETAIL_SECTION };
