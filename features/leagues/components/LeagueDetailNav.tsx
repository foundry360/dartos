"use client";

import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import {
  DEFAULT_LEAGUE_DETAIL_SECTION,
  LEAGUE_DETAIL_SECTIONS,
  type LeagueDetailSectionId,
} from "@/features/leagues/lib/league-detail-sections";
import { cn } from "@/utils/cn";

interface LeagueDetailNavProps {
  activeSection: LeagueDetailSectionId;
  onSelect: (section: LeagueDetailSectionId) => void;
}

export function LeagueDetailNav({
  activeSection,
  onSelect,
}: LeagueDetailNavProps) {
  return (
    <nav className="league-detail-subnav" aria-label="League sections">
      <div className="league-detail-subnav__track">
        {LEAGUE_DETAIL_SECTIONS.map((section) => {
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
    </nav>
  );
}

export { DEFAULT_LEAGUE_DETAIL_SECTION };
