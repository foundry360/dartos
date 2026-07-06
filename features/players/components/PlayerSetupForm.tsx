"use client";

import { useState } from "react";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/constants";
import { TouchButton } from "@/components/ui/TouchButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/utils/cn";

interface PlayerSetupFormProps {
  title?: string;
  onStart: (playerNames: string[]) => void | Promise<void>;
  minPlayers?: number;
  maxPlayers?: number;
}

export function PlayerSetupForm({
  title,
  onStart,
  minPlayers = MIN_PLAYERS,
  maxPlayers = MAX_PLAYERS,
}: PlayerSetupFormProps) {
  const [playerCount, setPlayerCount] = useState(minPlayers);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: minPlayers }, (_, index) => `Player ${index + 1}`),
  );

  const updateCount = (count: number) => {
    const nextCount = Math.min(maxPlayers, Math.max(minPlayers, count));
    setPlayerCount(nextCount);
    setNames((current) => {
      const next = [...current];
      while (next.length < nextCount) {
        next.push(`Player ${next.length + 1}`);
      }
      return next.slice(0, nextCount);
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <GlassPanel className="w-full min-w-0">
        {title ? (
          <>
            <h2 className="text-xl">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {minPlayers}–{maxPlayers} players
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {minPlayers}–{maxPlayers} players
          </p>
        )}

        <div className={cn("flex items-center justify-between gap-3", title ? "mt-4" : "mt-2")}>
          <span className="text-sm font-medium text-muted-foreground">Players</span>
          <div className="flex items-center gap-3">
            <TouchButton
              variant="secondary"
              size="md"
              onClick={() => updateCount(playerCount - 1)}
              disabled={playerCount <= minPlayers}
            >
              −
            </TouchButton>
            <span className="min-w-[2rem] text-center text-2xl font-bold">{playerCount}</span>
            <TouchButton
              variant="secondary"
              size="md"
              onClick={() => updateCount(playerCount + 1)}
              disabled={playerCount >= maxPlayers}
            >
              +
            </TouchButton>
          </div>
        </div>
      </GlassPanel>

      <div className="space-y-3">
        {names.map((name, index) => (
          <label key={index} className="block">
            <span className="mb-2 block text-sm font-medium text-muted-foreground">
              Player {index + 1}
            </span>
            <input
              value={name}
              onChange={(event) => {
                const value = event.target.value;
                setNames((current) =>
                  current.map((entry, entryIndex) =>
                    entryIndex === index ? value : entry,
                  ),
                );
              }}
              className="min-h-[52px] w-full rounded-2xl border border-border bg-surface px-4 text-lg font-semibold outline-none ring-accent focus:ring-2"
            />
          </label>
        ))}
      </div>

      <TouchButton
        fullWidth
        size="xl"
        onClick={() =>
          void onStart(names.map((name, index) => name.trim() || `Player ${index + 1}`))
        }
      >
        Start Match
      </TouchButton>
    </div>
  );
}
