"use client";

import type { ComponentProps } from "react";
import { ActionBar } from "@/components/layout/PageHeader";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { CricketMatchStats } from "@/features/cricket/components/CricketMatchStats";
import { CricketScoreboard } from "@/features/cricket/components/CricketScoreboard";
import { useCricketScoreboardDensity } from "@/features/cricket/lib/scoreboard-density";
import type { CricketGameState } from "@/types/cricket";

interface CricketPlaySidebarProps {
  game: CricketGameState;
  headerTitle: string;
  onBackClick: () => void;
  actionBar: ComponentProps<typeof ActionBar>;
}

export function CricketPlaySidebar({
  game,
  headerTitle,
  onBackClick,
  actionBar,
}: CricketPlaySidebarProps) {
  const statRowCount = 1;
  const density = useCricketScoreboardDensity({
    playerCount: game.players.length,
    variant: game.variant ?? "classic",
    statRowCount,
  });

  return (
    <div className="match-play-sidebar flex h-full min-h-0 flex-col overflow-hidden">
      <PlayScreenHeader
        className="match-play-sidebar__header shrink-0"
        title={headerTitle}
        onBackClick={onBackClick}
      />

      <div className="match-play-sidebar__body flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
        <div className="match-play-sidebar__scoreboard flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <CricketScoreboard
              players={game.players}
              currentPlayerIndex={game.currentPlayerIndex}
              variant={game.variant}
              teamsEnabled={game.teamsEnabled}
              teamNames={game.teamNames}
              compact
              density={density}
              fillHeight
            />
          </div>
        </div>

        <div className="match-play-sidebar__actions shrink-0">
          <ActionBar {...actionBar} className="py-0 pb-0" />
        </div>

        <div className="match-play-sidebar__stats shrink-0">
          <CricketMatchStats game={game} compact />
        </div>
      </div>
    </div>
  );
}
