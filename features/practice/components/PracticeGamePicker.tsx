"use client";

import { useState } from "react";
import { PRACTICE_TREBLE_20_DART_LIMITS } from "@/features/practice/lib/practice-routines";
import {
  getTreble20DartLimit,
  isTreble20OnlyPickerActive,
  isTreble20OnlySessionGame,
} from "@/features/practice/lib/treble-20-only";
import type { PracticeGameDefinition } from "@/features/practice/lib/practice-routines";
import type { PracticeGameId } from "@/types/practice";
import { cn } from "@/utils/cn";
import { unlockSoundEffects } from "@/utils/sound-effects";
import { unlockVoicePlayback } from "@/utils/voice-playback";

interface PracticeGamePickerProps {
  games: PracticeGameDefinition[];
  activeGame: PracticeGameId | null;
  onSelect: (gameId: PracticeGameId) => void;
}

function primeAudioFromGesture() {
  unlockSoundEffects();
  void unlockVoicePlayback();
}

function PracticeGameChevron({ open }: { open?: boolean }) {
  return (
    <span
      className={cn(
        "practice-game-option__chevron-wrap",
        open && "practice-game-option__chevron-wrap--open",
      )}
      aria-hidden
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="settings-row__chevron practice-target-row__chevron">
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export function PracticeGamePicker({ games, activeGame, onSelect }: PracticeGamePickerProps) {
  const [treble20Expanded, setTreble20Expanded] = useState(false);
  const treble20Selected = isTreble20OnlyPickerActive(activeGame);
  const treble20SessionActive = isTreble20OnlySessionGame(activeGame);
  const treble20Open = treble20Expanded && treble20Selected;

  const toggleTreble20 = () => {
    if (treble20Selected) {
      setTreble20Expanded((open) => !open);
      return;
    }

    setTreble20Expanded(true);
    onSelect("treble-20-only");
  };

  const handleLimitSelect = (gameId: PracticeGameId) => {
    onSelect(gameId);
    setTreble20Expanded(false);
  };

  const handleOtherGameSelect = (gameId: PracticeGameId) => {
    setTreble20Expanded(false);
    onSelect(gameId);
  };

  return (
    <div className="practice-game-picker">
      <div className="practice-game-list" role="radiogroup" aria-label="Practice game">
        {games.map((game) => {
          if (game.id === "treble-20-only") {
            const headerLabel =
              treble20SessionActive && activeGame
                ? `${game.label} · ${getTreble20DartLimit(activeGame)} darts`
                : game.label;

            return (
              <section
                key={game.id}
                className={cn("practice-game-accordion", treble20Open && "practice-game-accordion--open")}
              >
                <button
                  type="button"
                  aria-expanded={treble20Open}
                  className={cn(
                    "practice-game-option settings-row settings-row--interactive",
                    treble20Selected && "practice-game-option--selected",
                  )}
                  onClick={() => {
                    primeAudioFromGesture();
                    toggleTreble20();
                  }}
                >
                  <PracticeGameChevron open={treble20Open} />
                  <span className="practice-game-option__label settings-row__label">{headerLabel}</span>
                </button>

                {treble20Open ? (
                  <div
                    className="practice-game-accordion__panel"
                    role="radiogroup"
                    aria-label="Treble 20 dart limit"
                  >
                    {PRACTICE_TREBLE_20_DART_LIMITS.map((limit) => {
                      const limitSelected = activeGame === limit.id;

                      return (
                        <button
                          key={limit.id}
                          type="button"
                          role="radio"
                          aria-checked={limitSelected}
                          className={cn(
                            "practice-game-accordion__option",
                            limitSelected && "practice-game-accordion__option--selected",
                          )}
                          onClick={() => {
                            primeAudioFromGesture();
                            handleLimitSelect(limit.id);
                          }}
                        >
                          {limit.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          }

          const selected = activeGame === game.id;

          return (
            <button
              key={game.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn(
                "practice-game-option settings-row settings-row--interactive",
                selected && "practice-game-option--selected",
              )}
              onClick={() => {
                primeAudioFromGesture();
                handleOtherGameSelect(game.id);
              }}
            >
              <span className="practice-game-option__label settings-row__label">{game.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
