"use client";

import type { ComponentProps } from "react";
import { ActionBar } from "@/components/layout/PageHeader";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { Bobs27Scoreboard } from "@/features/classic-games/components/Bobs27Scoreboard";
import type { Bobs27GameState } from "@/types/bobs-27";

interface Bobs27PlaySidebarProps {
  game: Bobs27GameState;
  headerTitle: string;
  onBackClick: () => void;
  actionBar: ComponentProps<typeof ActionBar>;
}

export function Bobs27PlaySidebar({
  game,
  headerTitle,
  onBackClick,
  actionBar,
}: Bobs27PlaySidebarProps) {
  return (
    <div className="match-play-sidebar flex h-full min-h-0 flex-col overflow-hidden">
      <PlayScreenHeader
        className="match-play-sidebar__header shrink-0"
        title={headerTitle}
        onBackClick={onBackClick}
      />

      <div className="match-play-sidebar__body flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="match-play-sidebar__scoreboard flex min-h-0 flex-1 flex-col overflow-hidden px-0">
          <Bobs27Scoreboard game={game} compact fillHeight />
        </div>

        <div className="match-play-sidebar__actions match-play-sidebar__actions--landscape shrink-0">
          <ActionBar {...actionBar} className="py-0 pb-0" />
        </div>
      </div>
    </div>
  );
}
