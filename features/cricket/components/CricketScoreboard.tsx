"use client";

import { useMemo } from "react";
import type { CricketTarget, CricketVariant } from "@/lib/constants";
import { getCricketTargets } from "@/lib/constants";
import { BOARD_THEMES, getBoardThemeMarkColor } from "@/lib/board-themes";
import type { CricketMark, CricketPlayerState } from "@/types/cricket";
import {
  ACTIVE_PLAYER_HIGHLIGHT_CLASS,
} from "@/features/cricket/lib/player-panel";
import { useBoardThemesStore } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface CricketScoreboardProps {
  players: CricketPlayerState[];
  currentPlayerIndex: number;
  variant?: CricketVariant;
  teamsEnabled?: boolean;
  compact?: boolean;
}

function targetLabel(target: CricketTarget): string {
  return target === "bull" ? "Bull" : String(target);
}

function ClosedMarkDisplay({
  markColor,
  large = false,
  compact = false,
  medium = false,
  mini = false,
  segmentClosed = false,
}: {
  markColor: string;
  large?: boolean;
  compact?: boolean;
  medium?: boolean;
  mini?: boolean;
  segmentClosed?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border-2 font-black",
        mini
          ? "h-7 w-7 text-base"
          : compact
            ? "h-9 w-9 text-lg"
            : medium
              ? "h-10 w-10 text-xl"
              : large
                ? "h-12 w-12 text-2xl"
                : "h-14 w-14 text-3xl",
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
  compact = false,
  medium = false,
  mini = false,
  segmentClosed = false,
}: {
  mark: CricketMark;
  markColor: string;
  large?: boolean;
  compact?: boolean;
  medium?: boolean;
  mini?: boolean;
  segmentClosed?: boolean;
}) {
  const sizeClass = mini
    ? "text-2xl leading-none"
    : compact
      ? "text-3xl leading-none"
      : medium
        ? "text-4xl leading-none"
        : large
          ? "text-5xl leading-none"
          : "text-4xl leading-none";

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
        compact={compact}
        medium={medium}
        mini={mini}
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

function isMultiPlayerRowClosed(marks: CricketMark[]): boolean {
  return marks.length > 0 && marks.every((mark) => isTargetClosed(mark));
}

interface MultiPlayerBoardProps {
  players: CricketPlayerState[];
  currentPlayerIndex: number;
  markColor: string;
  targets: readonly CricketTarget[];
  denseRows?: boolean;
  teamsEnabled?: boolean;
}

function CompactPlayerColumnHeader({
  player,
  playerIndex,
  currentPlayerIndex,
  mediumDensity = false,
  teamsEnabled = false,
}: {
  player: CricketPlayerState;
  playerIndex: number;
  currentPlayerIndex: number;
  mediumDensity?: boolean;
  teamsEnabled?: boolean;
}) {
  const isActive = playerIndex === currentPlayerIndex;
  const displayName = getPlayerScorecardName(player);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center rounded-xl text-center",
        mediumDensity ? "px-1.5 py-1.5" : "px-1 py-1.5",
        isActive && ACTIVE_PLAYER_HIGHLIGHT_CLASS,
      )}
    >
      {teamsEnabled && player.teamId != null ? (
        <span
          className={cn(
            "font-bold uppercase tracking-[0.12em] text-muted-foreground",
            mediumDensity ? "mb-0.5 text-[0.65rem]" : "mb-0.5 text-[0.55rem]",
          )}
        >
          T{player.teamId + 1}
        </span>
      ) : null}
      <span
        className={cn(
          "w-full truncate font-bold leading-tight",
          mediumDensity ? "text-sm" : "text-[0.65rem]",
        )}
      >
        {displayName}
      </span>
      <span
        className={cn(
          "font-semibold uppercase tracking-[0.08em] text-muted-foreground",
          mediumDensity ? "mt-1 text-xs" : "mt-0.5 text-[0.55rem]",
        )}
      >
        {player.legsWon}L · {player.setsWon}S
      </span>
      <span
        className={cn(
          "font-black tabular-nums leading-none tracking-tight",
          mediumDensity ? "mt-1 text-4xl" : "mt-0.5 text-2xl",
        )}
      >
        {player.score}
      </span>
    </div>
  );
}

function MultiPlayerBoard({
  players,
  currentPlayerIndex,
  markColor,
  targets,
  denseRows = false,
  teamsEnabled = false,
}: MultiPlayerBoardProps) {
  const mediumDensity = denseRows && players.length === 3;
  const rowHeightClass = mediumDensity
    ? "min-h-[2.5rem]"
    : denseRows
      ? "min-h-[1.625rem]"
      : "min-h-[2rem]";
  const targetLabelClass = mediumDensity ? "text-xl" : denseRows ? "text-sm" : "text-base";
  const labelColumnWidth = mediumDensity ? "2.5rem" : "1.75rem";

  const columnTemplate = `${labelColumnWidth} repeat(${players.length}, minmax(0, 1fr))`;

  return (
    <div
      className={cn(
        "mx-auto grid w-full items-center",
        mediumDensity ? "gap-x-2" : "gap-x-1",
      )}
      style={{ gridTemplateColumns: columnTemplate }}
    >
      <div aria-hidden className="min-h-px" />

      {players.map((player, playerIndex) => (
        <CompactPlayerColumnHeader
          key={player.id}
          player={player}
          playerIndex={playerIndex}
          currentPlayerIndex={currentPlayerIndex}
          mediumDensity={mediumDensity}
          teamsEnabled={teamsEnabled}
        />
      ))}

      {targets.map((target) => {
        const marks = players.map((player) => player.marks[target]);
        const rowClosed = isMultiPlayerRowClosed(marks);

        return (
          <div key={String(target)} className="contents">
            <div
              className={cn(
                "flex items-center justify-center font-bold tabular-nums",
                rowHeightClass,
                targetLabelClass,
                rowClosed ? "text-muted-foreground/50" : "text-foreground",
              )}
            >
              {targetLabel(target)}
            </div>

            {players.map((player) => {
              const mark = player.marks[target];

              return (
                <div
                  key={`${player.id}-${String(target)}`}
                  className={cn(
                    "flex items-center justify-center",
                    rowHeightClass,
                    rowClosed && isTargetClosed(mark) && "opacity-60",
                  )}
                >
                  <CricketMarkDisplay
                    mark={mark}
                    markColor={markColor}
                    medium={mediumDensity}
                    compact={denseRows && !mediumDensity}
                    segmentClosed={rowClosed}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

interface ThreeColumnBoardProps {
  leftPlayer: CricketPlayerState;
  rightPlayer: CricketPlayerState | null;
  leftPlayerIndex: number;
  rightPlayerIndex: number | null;
  currentPlayerIndex: number;
  markColor: string;
  targets: readonly CricketTarget[];
  denseRows?: boolean;
  large: boolean;
  teamsEnabled?: boolean;
}

function PlayerColumnHeader({
  player,
  playerIndex,
  currentPlayerIndex,
  large,
  denseRows = false,
  teamsEnabled = false,
}: {
  player: CricketPlayerState;
  playerIndex: number;
  currentPlayerIndex: number;
  large: boolean;
  denseRows?: boolean;
  teamsEnabled?: boolean;
}) {
  const isActive = playerIndex === currentPlayerIndex;
  const displayName = getPlayerScorecardName(player);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center rounded-2xl text-center",
        denseRows ? "px-2 py-1.5" : large ? "px-2 py-2" : "px-3 py-2",
        denseRows ? "mb-1.5" : "mb-2",
        isActive && ACTIVE_PLAYER_HIGHLIGHT_CLASS,
        isActive && !denseRows && "pb-2",
      )}
    >
      <div className="flex max-w-full flex-col items-center justify-center">
        {teamsEnabled && player.teamId != null ? (
          <span className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Team {player.teamId + 1}
          </span>
        ) : null}
        <span
          className={cn(
            "min-w-0 truncate font-bold",
            denseRows ? "text-base" : large ? "text-base" : "text-xl",
          )}
        >
          {displayName}
        </span>
      </div>
      <div
        className={cn(
          "mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground",
        )}
      >
        Legs {player.legsWon} · Sets {player.setsWon}
      </div>
      <span
        className={cn(
          "font-black tabular-nums tracking-tight",
          denseRows ? "mt-1 text-4xl" : large ? "mt-1.5 text-4xl" : "mt-1.5 text-5xl",
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
  targets,
  denseRows = false,
  large,
  teamsEnabled = false,
}: ThreeColumnBoardProps) {
  const rowHeightClass = denseRows ? "min-h-[2.5rem]" : "min-h-[3.25rem]";
  const centerLabelClass = denseRows
    ? "min-w-[2.5rem] text-xl"
    : large
      ? "min-w-[2.75rem] text-2xl"
      : "min-w-[3.25rem] text-3xl";

  return (
    <div
      className={cn(
        "mx-auto grid w-full grid-cols-[1fr_auto_1fr] items-center",
        denseRows ? "gap-x-4" : large ? "gap-x-4" : "gap-x-6",
      )}
    >
      <PlayerColumnHeader
        player={leftPlayer}
        playerIndex={leftPlayerIndex}
        currentPlayerIndex={currentPlayerIndex}
        large={large}
        denseRows={denseRows}
        teamsEnabled={teamsEnabled}
      />

      <div aria-hidden className={denseRows ? "w-11" : large ? "w-12" : "w-14"} />

      {rightPlayer && rightPlayerIndex !== null ? (
        <PlayerColumnHeader
          player={rightPlayer}
          playerIndex={rightPlayerIndex}
          currentPlayerIndex={currentPlayerIndex}
          large={large}
          denseRows={denseRows}
          teamsEnabled={teamsEnabled}
        />
      ) : (
        <div aria-hidden />
      )}

      {targets.map((target) => {
        const leftMark = leftPlayer.marks[target];
        const rightMark = rightPlayer?.marks[target];
        const rowClosed = isRowFullyClosed(leftMark, rightMark, Boolean(rightPlayer));

        return (
          <div key={String(target)} className="contents">
            <div
              className={cn(
                "flex items-center justify-center",
                rowHeightClass,
                rowClosed && isTargetClosed(leftMark) && "opacity-60",
              )}
            >
              <CricketMarkDisplay
                mark={leftMark}
                markColor={markColor}
                medium={denseRows}
                large={!denseRows && large}
                segmentClosed={rowClosed}
              />
            </div>

            <div
              className={cn(
                "flex items-center justify-center font-bold tabular-nums",
                rowHeightClass,
                centerLabelClass,
                rowClosed ? "text-muted-foreground/50" : "text-foreground",
              )}
            >
              {targetLabel(target)}
            </div>

            <div
              className={cn(
                "flex items-center justify-center",
                rowHeightClass,
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
                  medium={denseRows}
                  large={!denseRows && large}
                  segmentClosed={rowClosed}
                />
              ) : (
                <span
                  className={cn("text-transparent", denseRows ? "text-4xl" : "text-5xl")}
                  aria-hidden
                >
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
  variant = "classic",
  teamsEnabled = false,
  compact = false,
}: CricketScoreboardProps) {
  const large = compact;
  const useMultiPlayerBoard = players.length > 2;
  const targets = getCricketTargets(variant);
  const denseRows = variant === "tactics";
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const themes = useBoardThemesStore((state) => state.themes);
  const markColor = useMemo(() => {
    const availableThemes = themes.length > 0 ? themes : BOARD_THEMES;
    const theme =
      availableThemes.find((entry) => entry.id === boardThemeId) ??
      availableThemes[0] ??
      BOARD_THEMES[0]!;

    return getBoardThemeMarkColor(theme.colors);
  }, [boardThemeId, themes]);

  if (useMultiPlayerBoard) {
    const mediumMultiPlayer = denseRows && players.length === 3;

    return (
      <div className={cn("w-full overflow-x-hidden pb-2", compact ? "px-0" : "px-4")}>
        <GlassPanel
          className={cn(
            "scorecard-panel w-full",
            mediumMultiPlayer ? "p-3" : compact ? "p-2" : "p-3",
          )}
        >
          <MultiPlayerBoard
            players={players}
            currentPlayerIndex={currentPlayerIndex}
            markColor={markColor}
            targets={targets}
            denseRows={denseRows}
            teamsEnabled={teamsEnabled}
          />
        </GlassPanel>
      </div>
    );
  }

  const leftPlayer = players[0];
  const rightPlayer = players[1] ?? null;

  if (!leftPlayer) {
    return null;
  }

  return (
    <div className={cn("w-full overflow-x-hidden pb-2", compact ? "px-0" : "px-4")}>
      <GlassPanel
        className={cn(
          "scorecard-panel w-full",
          denseRows ? "p-3" : large ? "p-3" : "p-4",
        )}
      >
        <ThreeColumnBoard
          leftPlayer={leftPlayer}
          rightPlayer={rightPlayer}
          leftPlayerIndex={0}
          rightPlayerIndex={rightPlayer ? 1 : null}
          currentPlayerIndex={currentPlayerIndex}
          markColor={markColor}
          targets={targets}
          denseRows={denseRows}
          large={large}
          teamsEnabled={teamsEnabled}
        />
      </GlassPanel>
    </div>
  );
}
