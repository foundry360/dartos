"use client";

import type { ComponentProps } from "react";
import { ActionBar } from "@/components/layout/PageHeader";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { Checkout121Scoreboard } from "@/features/classic-games/components/Checkout121Scoreboard";
import type { Checkout121GameState } from "@/types/checkout-121";

interface Checkout121PlaySidebarProps {
  game: Checkout121GameState;
  headerTitle: string;
  onBackClick: () => void;
  actionBar: ComponentProps<typeof ActionBar>;
}

export function Checkout121PlaySidebar({
  game,
  headerTitle,
  onBackClick,
  actionBar,
}: Checkout121PlaySidebarProps) {
  return (
    <div className="match-play-sidebar flex h-full min-h-0 flex-col overflow-hidden">
      <PlayScreenHeader
        className="match-play-sidebar__header shrink-0"
        title={headerTitle}
        onBackClick={onBackClick}
      />

      <div className="match-play-sidebar__body flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="match-play-sidebar__scoreboard flex min-h-0 flex-1 flex-col overflow-hidden px-0">
          <Checkout121Scoreboard game={game} compact fillHeight />
        </div>

        <div className="match-play-sidebar__actions match-play-sidebar__actions--landscape shrink-0">
          <ActionBar {...actionBar} className="py-0 pb-0" />
        </div>
      </div>
    </div>
  );
}
