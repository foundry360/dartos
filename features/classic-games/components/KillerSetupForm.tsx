"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  assignRandomKillerNumbers,
  formatKillerAssignedNumber,
  getKillerAvailableTargets,
  KILLER_DEFAULT_STARTING_LIVES,
  KILLER_GAME_TYPE_OPTIONS,
  KILLER_HIT_RULES_OPTIONS,
  KILLER_MAX_STARTING_LIVES,
  KILLER_MIN_STARTING_LIVES,
  KILLER_NUMBER_ASSIGNMENT_OPTIONS,
  KILLER_STARTING_LIVES_OPTIONS,
  KILLER_TARGET_RULES_OPTIONS,
  resolveKillerStartingLives,
} from "@/features/classic-games/lib/killer-config";
import { CLASSIC_GAMES_HUB_PATH } from "@/features/classic-games/lib/classic-games";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type {
  KillerAssignedNumber,
  KillerGameType,
  KillerHitRules,
  KillerMatchSetup,
  KillerNumberAssignment,
  KillerStartingLivesPreset,
  KillerTargetRules,
} from "@/types/killer";

interface KillerSetupFormProps {
  onStart: (setup: KillerMatchSetup) => void | Promise<void>;
}

function buildDefaultChosenNumbers(count: number): KillerAssignedNumber[] {
  return Array.from({ length: count }, (_, index) => index + 1);
}

function stepperValueToTarget(value: number, includeBull: boolean): KillerAssignedNumber {
  if (includeBull && value === 21) {
    return "bull";
  }

  return value;
}

function targetToStepperValue(target: KillerAssignedNumber): number {
  return target === "bull" ? 21 : target;
}

export function KillerSetupForm({ onStart }: KillerSetupFormProps) {
  const [gameType, setGameType] = useState<KillerGameType>("classic");
  const [numberAssignment, setNumberAssignment] = useState<KillerNumberAssignment>("random");
  const [startingLivesPreset, setStartingLivesPreset] =
    useState<KillerStartingLivesPreset>("3");
  const [customStartingLives, setCustomStartingLives] = useState(KILLER_DEFAULT_STARTING_LIVES);
  const [targetRules, setTargetRules] = useState<KillerTargetRules>("numbers_only");
  const [hitRules, setHitRules] = useState<KillerHitRules>("classic");
  const [chosenNumbers, setChosenNumbers] = useState<KillerAssignedNumber[]>([1]);
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const startingLives = resolveKillerStartingLives(startingLivesPreset, customStartingLives);
  const includeBull = targetRules === "include_bull";
  const maxChosenValue = includeBull ? 21 : 20;

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
    minPlayers: 2,
    maxPlayers: 4,
    allowTeams: gameType === "team",
  });

  const playerCount = match.resolvedSlots.length;

  useEffect(() => {
    setChosenNumbers((current) => {
      if (current.length === playerCount) {
        return current.map((value) => (value === "bull" && !includeBull ? 20 : value));
      }

      return buildDefaultChosenNumbers(playerCount);
    });
  }, [includeBull, playerCount]);

  const chosenNumbersValid = useMemo(() => {
    if (numberAssignment !== "player_chosen") {
      return true;
    }

    const unique = new Set(chosenNumbers.map((value) => formatKillerAssignedNumber(value)));
    return unique.size === chosenNumbers.length;
  }, [chosenNumbers, numberAssignment]);

  const buildPlayerNumbers = (): KillerAssignedNumber[] => {
    if (numberAssignment === "random") {
      return assignRandomKillerNumbers(playerCount, targetRules);
    }

    if (numberAssignment === "player_chosen") {
      return chosenNumbers;
    }

    return [];
  };

  const buildSetup = (starterIndex?: number): KillerMatchSetup => {
    const playerNumbers =
      numberAssignment === "first_dart"
        ? []
        : buildPlayerNumbers();

    return {
      gameType,
      numberAssignment,
      startingLivesPreset,
      startingLives,
      targetRules,
      hitRules,
      playerNumbers,
      teamsEnabled: gameType === "team",
      teamNames: match.teamNames,
      startingPlayerRule: match.startingPlayerRule,
      players: match.resolvedSlots,
      coinTossStarterIndex: starterIndex,
    };
  };

  onCoinTossStartRef.current = (starterIndex) => {
    void onStart(buildSetup(starterIndex));
  };

  const handleStart = () => {
    match.beginStart((starterIndex) => onStart(buildSetup(starterIndex)));
  };

  const updateChosenNumber = (index: number, value: number) => {
    setChosenNumbers((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? stepperValueToTarget(value, includeBull) : entry,
      ),
    );
  };

  return (
    <div className="setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Killer" backHref={CLASSIC_GAMES_HUB_PATH}>
          <SettingsRow className="settings-row--rule-toggle" label="Game type">
            <PillToggleGroup
              ariaLabel="Killer game type"
              layout="grid"
              options={KILLER_GAME_TYPE_OPTIONS}
              value={gameType}
              onChange={setGameType}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Number assignment">
            <PillToggleGroup
              ariaLabel="Killer number assignment"
              layout="grid"
              options={KILLER_NUMBER_ASSIGNMENT_OPTIONS}
              value={numberAssignment}
              onChange={setNumberAssignment}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Starting lives">
            <PillToggleGroup
              ariaLabel="Killer starting lives"
              layout="grid"
              options={KILLER_STARTING_LIVES_OPTIONS}
              value={startingLivesPreset}
              onChange={setStartingLivesPreset}
            />
          </SettingsRow>

          {startingLivesPreset === "custom" ? (
            <SettingsRow label="Custom lives">
              <StepperControl
                value={customStartingLives}
                min={KILLER_MIN_STARTING_LIVES}
                max={KILLER_MAX_STARTING_LIVES}
                onChange={setCustomStartingLives}
              />
            </SettingsRow>
          ) : null}

          <SettingsRow className="settings-row--rule-toggle" label="Target rules">
            <PillToggleGroup
              ariaLabel="Killer target rules"
              layout="grid"
              options={KILLER_TARGET_RULES_OPTIONS}
              value={targetRules}
              onChange={setTargetRules}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Hit rules">
            <PillToggleGroup
              ariaLabel="Killer hit rules"
              layout="grid"
              options={KILLER_HIT_RULES_OPTIONS}
              value={hitRules}
              onChange={setHitRules}
            />
          </SettingsRow>
        </SettingsGroup>

        {numberAssignment === "player_chosen" && playerCount > 0 ? (
          <SettingsGroup title="Player numbers">
            {match.resolvedSlots.map((slot, index) => (
              <SettingsRow key={slot.id} label={slot.name}>
                <StepperControl
                  value={targetToStepperValue(chosenNumbers[index] ?? index + 1)}
                  min={1}
                  max={maxChosenValue}
                  onChange={(value) => updateChosenNumber(index, value)}
                />
              </SettingsRow>
            ))}
            {!chosenNumbersValid ? (
              <p className="px-4 pb-3 text-sm text-destructive">
                Each player needs a unique target number.
              </p>
            ) : null}
          </SettingsGroup>
        ) : null}

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
        <TouchButton
          fullWidth
          size="xl"
          onClick={handleStart}
          disabled={!match.canStart || !chosenNumbersValid}
        >
          Start Match
        </TouchButton>
      </div>

      {match.sheets}
    </div>
  );
}
