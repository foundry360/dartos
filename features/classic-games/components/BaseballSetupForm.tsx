"use client";

import { useRef, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  BASEBALL_DEFAULT_STARTING_RUNS,
  BASEBALL_GAME_LENGTH_OPTIONS,
  BASEBALL_MAX_CUSTOM_INNINGS,
  BASEBALL_MIN_CUSTOM_INNINGS,
  BASEBALL_SCORING_OPTIONS,
  BASEBALL_STANDARD_INNINGS,
  BASEBALL_TARGET_SEQUENCE_OPTIONS,
  BASEBALL_TIE_BREAKER_OPTIONS,
  buildBaseballTargetSequence,
  resolveBaseballInningCount,
} from "@/features/classic-games/lib/baseball-config";
import { CLASSIC_GAMES_HUB_PATH } from "@/features/classic-games/lib/classic-games";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type {
  BaseballGameLengthPreset,
  BaseballMatchSetup,
  BaseballScoringMode,
  BaseballTargetSequenceId,
  BaseballTieBreaker,
} from "@/types/baseball";

interface BaseballSetupFormProps {
  onStart: (setup: BaseballMatchSetup) => void | Promise<void>;
}

export function BaseballSetupForm({ onStart }: BaseballSetupFormProps) {
  const [gameLengthPreset, setGameLengthPreset] = useState<BaseballGameLengthPreset>("standard");
  const [customInningCount, setCustomInningCount] = useState(BASEBALL_STANDARD_INNINGS);
  const [targetSequenceId, setTargetSequenceId] = useState<BaseballTargetSequenceId>("1-9");
  const [scoringMode, setScoringMode] = useState<BaseballScoringMode>("baseball");
  const [homeRunRuleEnabled, setHomeRunRuleEnabled] = useState(false);
  const [tieBreaker, setTieBreaker] = useState<BaseballTieBreaker>("extra_inning");
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const inningCount = resolveBaseballInningCount(gameLengthPreset, customInningCount);
  const resolvedSequenceId =
    targetSequenceId === "custom" ? "1-9" : targetSequenceId;
  const targets = buildBaseballTargetSequence(resolvedSequenceId, inningCount);

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
    minPlayers: 1,
    maxPlayers: 4,
    allowTeams: false,
  });

  const buildSetup = (starterIndex?: number): BaseballMatchSetup => ({
    startingRuns: BASEBALL_DEFAULT_STARTING_RUNS,
    inningCount,
    gameLengthPreset,
    targetSequenceId,
    scoringMode,
    homeRunRuleEnabled,
    tieBreaker,
    targets,
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
        <SettingsGroup title="Baseball" backHref={CLASSIC_GAMES_HUB_PATH}>
          <SettingsRow className="settings-row--rule-toggle" label="Game length">
            <PillToggleGroup
              ariaLabel="Baseball game length"
              layout="grid"
              options={BASEBALL_GAME_LENGTH_OPTIONS}
              value={gameLengthPreset}
              onChange={setGameLengthPreset}
            />
          </SettingsRow>

          {gameLengthPreset === "custom" ? (
            <SettingsRow label="Custom innings">
              <StepperControl
                value={customInningCount}
                min={BASEBALL_MIN_CUSTOM_INNINGS}
                max={BASEBALL_MAX_CUSTOM_INNINGS}
                onChange={setCustomInningCount}
              />
            </SettingsRow>
          ) : null}

          <SettingsRow className="settings-row--rule-toggle" label="Target sequence">
            <PillToggleGroup
              ariaLabel="Baseball target sequence"
              layout="grid"
              options={BASEBALL_TARGET_SEQUENCE_OPTIONS}
              value={targetSequenceId}
              onChange={setTargetSequenceId}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Scoring">
            <PillToggleGroup
              ariaLabel="Baseball scoring mode"
              layout="grid"
              options={BASEBALL_SCORING_OPTIONS}
              value={scoringMode}
              onChange={setScoringMode}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Home run rule">
            <ToggleSwitch
              label="Triple earns bonus run"
              enabled={homeRunRuleEnabled}
              onChange={setHomeRunRuleEnabled}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Tie breaker">
            <PillToggleGroup
              ariaLabel="Baseball tie breaker"
              layout="grid"
              options={BASEBALL_TIE_BREAKER_OPTIONS}
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
