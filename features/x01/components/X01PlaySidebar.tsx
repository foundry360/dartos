"use client";

import type { ComponentProps } from "react";
import { ActionBar } from "@/components/layout/PageHeader";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { X01Scoreboard } from "@/features/x01/components/X01Scoreboard";
import type { X01GameState } from "@/types/x01";

interface X01PlaySidebarProps {
  game: X01GameState;
  headerTitle: string;
  onBackClick: () => void;
  actionBar: ComponentProps<typeof ActionBar>;
}

export function X01PlaySidebar({
  game,
  headerTitle,
  onBackClick,
  actionBar,
}: X01PlaySidebarProps) {
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
            <X01Scoreboard
              players={game.players}
              currentPlayerIndex={game.currentPlayerIndex}
              visitDarts={game.visitDarts}
              gameType={game.gameType}
              outRule={game.outRule}
              teamsEnabled={game.teamsEnabled}
              teamNames={game.teamNames}
              compact
              fillHeight
            />
          </div>
        </div>

        <div className="match-play-sidebar__actions hidden shrink-0 landscape:block">
          <ActionBar {...actionBar} className="py-0 pb-0" />
        </div>
      </div>
    </div>
  );
}
