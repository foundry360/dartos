"use client";

import { useRef, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  buildGolfHoleSequence,
  GOLF_DEFAULT_STARTING_STROKES,
  GOLF_GAME_LENGTH_OPTIONS,
  GOLF_SCORING_OPTIONS,
  GOLF_TARGET_SEQUENCE_OPTIONS,
  GOLF_TIE_BREAKER_OPTIONS,
  resolveGolfHoleCount,
} from "@/features/classic-games/lib/golf-config";
import { CLASSIC_GAMES_HUB_PATH } from "@/features/classic-games/lib/classic-games";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type {
  GolfGameLengthPreset,
  GolfMatchSetup,
  GolfScoringMode,
  GolfTargetSequenceId,
  GolfTieBreaker,
} from "@/types/golf";

interface GolfSetupFormProps {
  onStart: (setup: GolfMatchSetup) => void | Promise<void>;
}

export function GolfSetupForm({ onStart }: GolfSetupFormProps) {
  const [gameLengthPreset, setGameLengthPreset] = useState<GolfGameLengthPreset>("standard");
  const [targetSequenceId, setTargetSequenceId] = useState<GolfTargetSequenceId>("1-18");
  const [scoringMode, setScoringMode] = useState<GolfScoringMode>("strokes");
  const [tieBreaker, setTieBreaker] = useState<GolfTieBreaker>("sudden_death");
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const holeCount = resolveGolfHoleCount(gameLengthPreset);
  const resolvedSequenceId =
    targetSequenceId === "custom" ? "1-18" : targetSequenceId;
  const holes = buildGolfHoleSequence(resolvedSequenceId, holeCount);

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
    minPlayers: 1,
    maxPlayers: 4,
    allowTeams: false,
  });

  const buildSetup = (starterIndex?: number): GolfMatchSetup => ({
    startingStrokes: GOLF_DEFAULT_STARTING_STROKES,
    holeCount,
    gameLengthPreset,
    targetSequenceId,
    scoringMode,
    tieBreaker,
    holes,
    teamsEnabled: false,
    teamNames: match.teamNames,
    startingPlayerRule: match.startingPlayerRule,
    players: match.resolvedSlots,
    coinTossStarterIndex: starterIndex,
  });

  onCoinTossStartRef.current = (starterIndex) => {
    void onStart(buildSetup(starterIndex));
  };

  const handleStart = () => {
    match.beginStart((starterIndex) => onStart(buildSetup(starterIndex)));
  };

  return (
    <div className="setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Golf" backHref={CLASSIC_GAMES_HUB_PATH}>
          <SettingsRow className="settings-row--rule-toggle" label="Game length">
            <PillToggleGroup
              ariaLabel="Golf game length"
              layout="grid"
              options={GOLF_GAME_LENGTH_OPTIONS}
              value={gameLengthPreset}
              onChange={setGameLengthPreset}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Target sequence">
            <PillToggleGroup
              ariaLabel="Golf target sequence"
              layout="grid"
              options={GOLF_TARGET_SEQUENCE_OPTIONS}
              value={targetSequenceId}
              onChange={setTargetSequenceId}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Scoring mode">
            <PillToggleGroup
              ariaLabel="Golf scoring mode"
              layout="grid"
              options={GOLF_SCORING_OPTIONS}
              value={scoringMode}
              onChange={setScoringMode}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Tie breaker">
            <PillToggleGroup
              ariaLabel="Golf tie breaker"
              layout="grid"
              options={GOLF_TIE_BREAKER_OPTIONS}
              value={tieBreaker}
              onChange={setTieBreaker}
            />
          </SettingsRow>
        </SettingsGroup>

        {match.playersGroup}

        {match.resolvedSlots.length > 1 ? (
          <SettingsGroup>
            <SettingsRow
              label="Starting player"
              value={match.selectedStartingRule?.label ?? "Winner of previous leg"}
              chevron
              onPress={() => match.setStarterSheetOpen(true)}
            />
          </SettingsGroup>
        ) : null}
      </div>

      <div className="setup-screen__footer">
        <TouchButton fullWidth size="xl" onClick={handleStart} disabled={!match.canStart}>
          Start Match
        </TouchButton>
      </div>

      {match.sheets}
    </div>
  );
}
