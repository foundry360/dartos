"use client";

import {
  DEFAULT_PRACTICE_STATS_DRILL,
  PRACTICE_STATS_DRILLS,
  type PracticeStatsDrillId,
} from "@/features/practice/lib/practice-stats-drills";
import { cn } from "@/utils/cn";

interface PracticeStatsNavProps {
  activeDrill: PracticeStatsDrillId;
  onSelect: (drill: PracticeStatsDrillId) => void;
}

export function PracticeStatsNav({ activeDrill, onSelect }: PracticeStatsNavProps) {
  return (
    <nav className="settings-nav" aria-label="Practice drill stats">
      <ul className="settings-nav__list">
        {PRACTICE_STATS_DRILLS.map((drill) => {
          const isActive = activeDrill === drill.id;

          return (
            <li key={drill.id}>
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSelect(drill.id)}
                className={cn(
                  "settings-nav__item practice-stats-nav__item",
                  isActive && "settings-nav__item--active",
                )}
              >
                <span className="settings-nav__label">{drill.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { DEFAULT_PRACTICE_STATS_DRILL };
