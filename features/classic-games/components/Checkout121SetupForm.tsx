"use client";

import { useEffect, useRef, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  CHECKOUT_121_ATTEMPT_OPTIONS,
  CHECKOUT_121_DEFAULT_DARTS_PER_ATTEMPT,
  CHECKOUT_121_DEFAULT_FINISH_SCORE,
  CHECKOUT_121_DEFAULT_START_SCORE,
  CHECKOUT_121_MAX_FINISH_SCORE,
  CHECKOUT_121_MAX_START_SCORE,
  CHECKOUT_121_MIN_START_SCORE,
  CHECKOUT_121_OUT_RULE_OPTIONS,
  clampCheckout121FinishScore,
  parseCheckout121AttemptDarts,
} from "@/features/classic-games/lib/checkout-121-config";
import { CLASSIC_GAMES_HUB_PATH } from "@/features/classic-games/lib/classic-games";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type {
  Checkout121AttemptDarts,
  Checkout121MatchSetup,
  Checkout121OutRule,
} from "@/types/checkout-121";

interface Checkout121SetupFormProps {
  onStart: (setup: Checkout121MatchSetup) => void | Promise<void>;
}

export function Checkout121SetupForm({ onStart }: Checkout121SetupFormProps) {
  const [startScore, setStartScore] = useState(CHECKOUT_121_DEFAULT_START_SCORE);
  const [finishScore, setFinishScore] = useState(CHECKOUT_121_DEFAULT_FINISH_SCORE);
  const [dartsPerAttempt, setDartsPerAttempt] = useState<Checkout121AttemptDarts>(
    CHECKOUT_121_DEFAULT_DARTS_PER_ATTEMPT,
  );
  const [outRule, setOutRule] = useState<Checkout121OutRule>("double_out");
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  useEffect(() => {
    setFinishScore((current) => clampCheckout121FinishScore(current, startScore));
  }, [startScore]);

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
    minPlayers: 1,
    maxPlayers: 4,
    allowTeams: false,
  });

  const buildSetup = (starterIndex?: number): Checkout121MatchSetup => ({
    startScore,
    finishScore,
    dartsPerAttempt,
    outRule,
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
        <SettingsGroup
          title="121 Checkout"
          backHref={CLASSIC_GAMES_HUB_PATH}
        >
          <SettingsRow label="Starting score">
            <StepperControl
              value={startScore}
              min={CHECKOUT_121_MIN_START_SCORE}
              max={CHECKOUT_121_MAX_START_SCORE}
              onChange={setStartScore}
            />
          </SettingsRow>

          <SettingsRow label="Win score">
            <StepperControl
              value={finishScore}
              min={startScore}
              max={CHECKOUT_121_MAX_FINISH_SCORE}
              onChange={setFinishScore}
            />
          </SettingsRow>

          <SettingsRow
            className="settings-row--rule-toggle"
            label="Attempts"
          >
            <PillToggleGroup
              ariaLabel="121 checkout attempts"
              layout="grid"
              options={CHECKOUT_121_ATTEMPT_OPTIONS}
              value={String(dartsPerAttempt)}
              onChange={(value) => setDartsPerAttempt(parseCheckout121AttemptDarts(value))}
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Game settings">
          <SettingsRow className="settings-row--rule-toggle" label="Finish rule">
            <PillToggleGroup
              ariaLabel="121 checkout finish rule"
              options={CHECKOUT_121_OUT_RULE_OPTIONS}
              value={outRule}
              onChange={setOutRule}
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
