"use client";

import type { ReactNode } from "react";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { PracticeGamePicker } from "@/features/practice/components/PracticeGamePicker";
import type { PracticeGameDefinition } from "@/features/practice/lib/practice-routines";
import type { PracticeGameId } from "@/types/practice";

interface PracticePlaySidebarProps {
  title: string;
  subtitle?: string;
  onBackClick: () => void;
  showGamePicker: boolean;
  /** When true, only the selected game row is shown until the player changes it. */
  compactGamePicker?: boolean;
  practiceGames: PracticeGameDefinition[];
  activeGame: PracticeGameId | null;
  onGameSelect: (gameId: PracticeGameId) => void;
  scorecard: ReactNode;
  actions?: ReactNode;
}

export function PracticePlaySidebar({
  title,
  subtitle,
  onBackClick,
  showGamePicker,
  compactGamePicker = false,
  practiceGames,
  activeGame,
  onGameSelect,
  scorecard,
  actions,
}: PracticePlaySidebarProps) {
  return (
    <div className="practice-play-sidebar match-play-sidebar flex h-full min-h-0 flex-col overflow-hidden">
      <PlayScreenHeader
        className="practice-play-sidebar__header shrink-0"
        title={title}
        subtitle={subtitle}
        onBackClick={onBackClick}
      />

      <div className="practice-play-sidebar__body flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        {showGamePicker ? (
          <div className="practice-play-sidebar__games shrink-0">
            <PracticeGamePicker
              games={practiceGames}
              activeGame={activeGame}
              onSelect={onGameSelect}
              compactSelected={compactGamePicker}
            />
          </div>
        ) : null}

        <div className="practice-play-sidebar__scorecard min-h-0 flex-1">{scorecard}</div>

        {actions ? (
          <div className="practice-play-sidebar__actions shrink-0">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
