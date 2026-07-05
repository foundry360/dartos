"use client";

import { useMemo } from "react";
import { CRICKET_TARGETS } from "@/lib/constants";
import { BOARD_THEMES, getBoardThemePrimaryColor } from "@/lib/board-themes";
import type { CricketMark, CricketPlayerState } from "@/types/cricket";
import {
  ACTIVE_PLAYER_SCOREBOARD_CLASS,
  activeScoreboardPlayerStyle,
} from "@/features/cricket/lib/player-panel";
import { useBoardThemesStore } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/utils/cn";

interface CricketScoreboardProps {
  players: CricketPlayerState[];
  currentPlayerIndex: number;
  compact?: boolean;
}

function targetLabel(target: (typeof CRICKET_TARGETS)[number]): string {
  return target === "bull" ? "Bull" : String(target);
}

function ClosedMarkDisplay({
  markColor,
  large = false,
  segmentClosed = false,
}: {
  markColor: string;
  large?: boolean;
  segmentClosed?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border-2 font-black",
        large ? "h-12 w-12 text-2xl" : "h-14 w-14 text-3xl",
        segmentClosed && "border-muted-foreground/50 text-muted-foreground",
      )}
      style={
        segmentClosed
          ? undefined
          : {
              color: markColor,
              borderColor: markColor,
            }
      }
      aria-label={segmentClosed ? "Segment closed" : "Three marks"}
    >
      X
    </span>
  );
}

function CricketMarkDisplay({
  mark,
  markColor,
  large = false,
  segmentClosed = false,
}: {
  mark: CricketMark;
  markColor: string;
  large?: boolean;
  segmentClosed?: boolean;
}) {
  const sizeClass = large ? "text-5xl leading-none" : "text-4xl leading-none";

  if (mark <= 0) {
    return (
      <span
        className={cn(sizeClass, "font-black text-muted-foreground/20")}
        aria-label="No marks"
      >
        ·
      </span>
    );
  }

  if (mark >= 3) {
    return (
      <ClosedMarkDisplay
        markColor={markColor}
        large={large}
        segmentClosed={segmentClosed}
      />
    );
  }

  return (
    <span className={cn(sizeClass, "font-black")} style={{ color: markColor }}>
      {mark === 1 ? "/" : "X"}
    </span>
  );
}

function isTargetClosed(mark: CricketMark): boolean {
  return mark >= 3;
}

function isRowFullyClosed(
  leftMark: CricketMark,
  rightMark: CricketMark | undefined,
  hasRightPlayer: boolean,
): boolean {
  if (!isTargetClosed(leftMark)) {
    return false;
  }

  if (!hasRightPlayer) {
    return true;
  }

  return isTargetClosed(rightMark ?? 0);
}

function chunkPlayersInPairs(
  players: CricketPlayerState[],
): Array<[CricketPlayerState, CricketPlayerState | null]> {
  const pairs: Array<[CricketPlayerState, CricketPlayerState | null]> = [];

  for (let index = 0; index < players.length; index += 2) {
    pairs.push([players[index]!, players[index + 1] ?? null]);
  }

  return pairs;
}

interface ThreeColumnBoardProps {
  leftPlayer: CricketPlayerState;
  rightPlayer: CricketPlayerState | null;
  leftPlayerIndex: number;
  rightPlayerIndex: number | null;
  currentPlayerIndex: number;
  markColor: string;
  large: boolean;
}

function PlayerColumnHeader({
  player,
  playerIndex,
  currentPlayerIndex,
  large,
}: {
  player: CricketPlayerState;
  playerIndex: number;
  currentPlayerIndex: number;
  large: boolean;
}) {
  const isActive = playerIndex === currentPlayerIndex;

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center rounded-2xl text-center",
        large ? "px-2 py-2" : "px-3 py-2",
        "mb-2",
        isActive && ACTIVE_PLAYER_SCOREBOARD_CLASS,
        isActive && "pb-2",
      )}
      style={activeScoreboardPlayerStyle(player.color, isActive)}
    >
      <div className="flex max-w-full items-center justify-center">
        <span className={cn("truncate font-bold", large ? "text-lg" : "text-xl")}>
          {player.name}
        </span>
      </div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Legs {player.legsWon} · Sets {player.setsWon}
      </div>
      <span
        className={cn(
          "mt-1.5 font-black tabular-nums tracking-tight",
          large ? "text-4xl" : "text-5xl",
        )}
      >
        {player.score}
      </span>
    </div>
  );
}

function ThreeColumnBoard({
  leftPlayer,
  rightPlayer,
  leftPlayerIndex,
  rightPlayerIndex,
  currentPlayerIndex,
  markColor,
  large,
}: ThreeColumnBoardProps) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full grid-cols-[1fr_auto_1fr] items-center",
        large ? "gap-x-4" : "gap-x-6",
      )}
    >
      <PlayerColumnHeader
        player={leftPlayer}
        playerIndex={leftPlayerIndex}
        currentPlayerIndex={currentPlayerIndex}
        large={large}
      />

      <div aria-hidden className={large ? "w-12" : "w-14"} />

      {rightPlayer && rightPlayerIndex !== null ? (
        <PlayerColumnHeader
          player={rightPlayer}
          playerIndex={rightPlayerIndex}
          currentPlayerIndex={currentPlayerIndex}
          large={large}
        />
      ) : (
        <div aria-hidden />
      )}

      {CRICKET_TARGETS.map((target) => {
        const leftMark = leftPlayer.marks[target];
        const rightMark = rightPlayer?.marks[target];
        const rowClosed = isRowFullyClosed(leftMark, rightMark, Boolean(rightPlayer));

        return (
          <div key={String(target)} className="contents">
            <div
              className={cn(
                "flex min-h-[3.25rem] items-center justify-center",
                rowClosed && isTargetClosed(leftMark) && "opacity-60",
              )}
            >
              <CricketMarkDisplay
                mark={leftMark}
                markColor={markColor}
                large={large}
                segmentClosed={rowClosed}
              />
            </div>

            <div
              className={cn(
                "flex min-h-[3.25rem] items-center justify-center font-bold tabular-nums",
                large ? "min-w-[2.75rem] text-2xl" : "min-w-[3.25rem] text-3xl",
                rowClosed ? "text-muted-foreground/50" : "text-foreground",
              )}
            >
              {targetLabel(target)}
            </div>

            <div
              className={cn(
                "flex min-h-[3.25rem] items-center justify-center",
                rowClosed &&
                  rightPlayer &&
                  rightMark !== undefined &&
                  isTargetClosed(rightMark) &&
                  "opacity-60",
              )}
            >
              {rightPlayer && rightMark !== undefined ? (
                <CricketMarkDisplay
                  mark={rightMark}
                  markColor={markColor}
                  large={large}
                  segmentClosed={rowClosed}
                />
              ) : (
                <span className="text-5xl text-transparent" aria-hidden>
                  ·
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CricketScoreboard({
  players,
  currentPlayerIndex,
  compact = false,
}: CricketScoreboardProps) {
  const large = compact;
  const pairs = chunkPlayersInPairs(players);
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const themes = useBoardThemesStore((state) => state.themes);
  const markColor = useMemo(() => {
    const availableThemes = themes.length > 0 ? themes : BOARD_THEMES;
    const theme =
      availableThemes.find((entry) => entry.id === boardThemeId) ??
      availableThemes[0] ??
      BOARD_THEMES[0]!;

    return getBoardThemePrimaryColor(theme.colors);
  }, [boardThemeId, themes]);

  return (
    <div
      className={cn(
        "w-full pb-2",
        pairs.length > 1 ? "overflow-x-auto" : "overflow-x-hidden",
        compact ? "px-0" : "px-4",
      )}
    >
      <div className="flex w-full flex-col gap-3">
        {pairs.map(([leftPlayer, rightPlayer], pairIndex) => {
          const leftPlayerIndex = pairIndex * 2;
          const rightPlayerIndex = rightPlayer ? leftPlayerIndex + 1 : null;

          return (
            <GlassPanel
              key={`${leftPlayer.id}-${rightPlayer?.id ?? "solo"}`}
              className={cn("scorecard-panel w-full", large ? "p-3" : "p-4")}
            >
              <ThreeColumnBoard
                leftPlayer={leftPlayer}
                rightPlayer={rightPlayer}
                leftPlayerIndex={leftPlayerIndex}
                rightPlayerIndex={rightPlayerIndex}
                currentPlayerIndex={currentPlayerIndex}
                markColor={markColor}
                large={large}
              />
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
