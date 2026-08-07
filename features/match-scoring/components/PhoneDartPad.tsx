"use client";

import { useMemo, useState } from "react";
import { getCricketTargets, type CricketVariant } from "@/lib/constants";
import {
  buildDartHit,
  buildMissHit,
} from "@/features/match-scoring/lib/build-dart-hit";
import type { DartHit, DartMultiplier } from "@/types/dart";
import { cn } from "@/utils/cn";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import "@/features/match-scoring/phone-dart-pad.css";

type PadMultiplier = Exclude<DartMultiplier, "miss">;

interface PhoneDartPadProps {
  onHit: (hit: DartHit) => void;
  disabled?: boolean;
  /** When omitted, follows `disabled`. Use to keep Miss available while numbers are locked. */
  missDisabled?: boolean;
  /** When set, cricket/tactics targets are emphasized on the number grid. */
  cricketVariant?: CricketVariant | null;
}

const NUMBERS = [
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
] as const;

export function PhoneDartPad({
  onHit,
  disabled = false,
  missDisabled,
  cricketVariant = null,
}: PhoneDartPadProps) {
  const missLocked = missDisabled ?? disabled;
  const [multiplier, setMultiplier] = useState<PadMultiplier>("single");

  const cricketTargets = useMemo(() => {
    if (!cricketVariant) {
      return null;
    }
    return new Set(getCricketTargets(cricketVariant).map(String));
  }, [cricketVariant]);

  const emit = (hit: DartHit, locked: boolean) => {
    if (locked) {
      return;
    }
    triggerHaptic("light");
    playDartHitSound(hit);
    onHit(hit);
  };

  const handleNumber = (segment: number) => {
    emit(buildDartHit(segment, multiplier), disabled);
  };

  const handleBull = () => {
    emit(buildDartHit("bull", multiplier), disabled);
  };

  const handleMiss = () => {
    emit(buildMissHit(), missLocked);
  };

  const multiplierLabel =
    multiplier === "triple" ? "Triple" : multiplier === "double" ? "Double" : "Single";

  return (
    <div className="phone-dart-pad" aria-label="Dart entry pad">
      <p className="phone-dart-pad__hint">
        {multiplierLabel} selected — tap a number
      </p>

      <div className="phone-dart-pad__multipliers" role="group" aria-label="Multiplier">
        {(
          [
            ["single", "Single"],
            ["double", "Double"],
            ["triple", "Triple"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={cn(
              "phone-dart-pad__btn",
              multiplier === value && "phone-dart-pad__btn--active",
            )}
            aria-pressed={multiplier === value}
            disabled={disabled}
            onClick={() => setMultiplier(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="phone-dart-pad__numbers" role="group" aria-label="Segments">
        {NUMBERS.map((segment) => {
          const isTarget = cricketTargets?.has(String(segment)) ?? false;
          return (
            <button
              key={segment}
              type="button"
              className={cn(
                "phone-dart-pad__btn",
                "phone-dart-pad__btn--number",
                isTarget && "phone-dart-pad__btn--target",
              )}
              disabled={disabled}
              onClick={() => handleNumber(segment)}
            >
              {segment}
            </button>
          );
        })}
      </div>

      <div className="phone-dart-pad__specials">
        <button
          type="button"
          className={cn(
            "phone-dart-pad__btn",
            "phone-dart-pad__btn--bull",
            cricketVariant && "phone-dart-pad__btn--target",
          )}
          disabled={disabled}
          onClick={handleBull}
        >
          Bull {multiplier === "single" ? "25" : "50"}
        </button>
        <button
          type="button"
          className="phone-dart-pad__btn phone-dart-pad__btn--miss"
          disabled={missLocked}
          onClick={handleMiss}
        >
          Miss
        </button>
      </div>
    </div>
  );
}
