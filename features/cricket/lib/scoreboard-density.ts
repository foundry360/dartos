"use client";

import { useEffect, useState } from "react";
import type { CricketVariant } from "@/lib/constants";

export type ScoreboardDensity = "spacious" | "comfortable" | "compact" | "dense";

export interface ScoreboardMarkSize {
  large?: boolean;
  medium?: boolean;
  compact?: boolean;
  mini?: boolean;
}

export interface ScoreboardDensityProfile {
  markSize: ScoreboardMarkSize;
  rowMinHeightDense: string;
  rowMinHeightClassic: string;
  rowGap: string;
  centerLabelDense: string;
  targetLabelDense: string;
  targetLabelClassic: string;
  labelColumnWidthDense: string;
  panelPadding: string;
  headerScoreDense: string;
  headerNameDense: string;
  multiPlayerMedium: boolean;
}

const DENSITY_PROFILES: Record<ScoreboardDensity, ScoreboardDensityProfile> = {
  spacious: {
    markSize: { large: true },
    rowMinHeightDense: "min-h-[3rem]",
    rowMinHeightClassic: "min-h-[3.25rem]",
    rowGap: "gap-y-1.5",
    centerLabelDense: "min-w-[2.75rem] text-2xl",
    targetLabelDense: "text-2xl",
    targetLabelClassic: "text-base",
    labelColumnWidthDense: "2.75rem",
    panelPadding: "p-3",
    headerScoreDense: "text-4xl",
    headerNameDense: "text-base",
    multiPlayerMedium: true,
  },
  comfortable: {
    markSize: { medium: true },
    rowMinHeightDense: "min-h-[2.5rem]",
    rowMinHeightClassic: "min-h-[3rem]",
    rowGap: "gap-y-1",
    centerLabelDense: "min-w-[2.5rem] text-xl",
    targetLabelDense: "text-xl",
    targetLabelClassic: "text-base",
    labelColumnWidthDense: "2.5rem",
    panelPadding: "p-2.5",
    headerScoreDense: "text-3xl",
    headerNameDense: "text-base",
    multiPlayerMedium: true,
  },
  compact: {
    markSize: { compact: true },
    rowMinHeightDense: "min-h-[2.125rem]",
    rowMinHeightClassic: "min-h-[2.5rem]",
    rowGap: "gap-y-0.5",
    centerLabelDense: "min-w-[2.25rem] text-lg",
    targetLabelDense: "text-lg",
    targetLabelClassic: "text-sm",
    labelColumnWidthDense: "2.25rem",
    panelPadding: "p-2",
    headerScoreDense: "text-2xl",
    headerNameDense: "text-sm",
    multiPlayerMedium: false,
  },
  dense: {
    markSize: { mini: true },
    rowMinHeightDense: "min-h-[1.75rem]",
    rowMinHeightClassic: "min-h-[2rem]",
    rowGap: "gap-y-0",
    centerLabelDense: "min-w-[1.75rem] text-sm",
    targetLabelDense: "text-sm",
    targetLabelClassic: "text-sm",
    labelColumnWidthDense: "1.75rem",
    panelPadding: "p-1.5",
    headerScoreDense: "text-xl",
    headerNameDense: "text-xs",
    multiPlayerMedium: false,
  },
};

export function getScoreboardDensityProfile(
  density: ScoreboardDensity,
): ScoreboardDensityProfile {
  return DENSITY_PROFILES[density];
}

export function resolveScoreboardDensity(input: {
  viewportHeight: number;
  viewportWidth: number;
  playerCount: number;
  variant: CricketVariant;
  statRowCount: number;
}): ScoreboardDensity {
  const { viewportHeight, viewportWidth, playerCount, variant, statRowCount } = input;
  const landscape = viewportWidth > viewportHeight;
  const isTactics = variant === "tactics";
  const targetRows = isTactics ? 12 : 7;

  const headerBlock = landscape ? 72 : 88;
  const actionBlock = landscape ? 60 : 0;
  const statBlock = statRowCount * (landscape ? 52 : 48) + Math.max(0, statRowCount - 1) * 8;
  const paddingBlock = landscape ? 48 : 32;
  const availableSidebar = landscape
    ? viewportHeight - headerBlock - actionBlock - statBlock - paddingBlock
    : viewportHeight * 0.44 - headerBlock - statBlock - paddingBlock;

  const rowPx = isTactics ? 44 : 52;
  const headerPx = playerCount <= 2 ? 100 : 72;
  const estimatedScoreboard = headerPx + targetRows * rowPx + (isTactics ? targetRows * 4 : 0);
  const ratio = availableSidebar / estimatedScoreboard;

  if (ratio >= 1.15) {
    return "spacious";
  }

  if (ratio >= 0.95) {
    return "comfortable";
  }

  if (ratio >= 0.78) {
    return "compact";
  }

  return "dense";
}

export function useCricketScoreboardDensity(input: {
  playerCount: number;
  variant: CricketVariant;
  statRowCount: number;
}): ScoreboardDensity {
  const [density, setDensity] = useState<ScoreboardDensity>("comfortable");

  useEffect(() => {
    const update = () => {
      setDensity(
        resolveScoreboardDensity({
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          playerCount: input.playerCount,
          variant: input.variant,
          statRowCount: input.statRowCount,
        }),
      );
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [input.playerCount, input.variant, input.statRowCount]);

  return density;
}
