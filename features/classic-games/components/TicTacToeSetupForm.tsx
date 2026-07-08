"use client";

import { useRef, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  TIC_TAC_TOE_BOARD_LAYOUT_OPTIONS,
  TIC_TAC_TOE_CLAIM_RULES_OPTIONS,
  TIC_TAC_TOE_MATCH_FORMAT_OPTIONS,
} from "@/features/classic-games/lib/tic-tac-toe-config";
import { CLASSIC_GAMES_HUB_PATH } from "@/features/classic-games/lib/classic-games";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type {
  TicTacToeBoardLayoutId,
  TicTacToeClaimRules,
  TicTacToeMatchFormat,
  TicTacToeMatchSetup,
} from "@/types/tic-tac-toe";

interface TicTacToeSetupFormProps {
  onStart: (setup: TicTacToeMatchSetup) => void | Promise<void>;
}

export function TicTacToeSetupForm({ onStart }: TicTacToeSetupFormProps) {
  const [boardLayoutId, setBoardLayoutId] = useState<TicTacToeBoardLayoutId>("standard");
  const [claimRules, setClaimRules] = useState<TicTacToeClaimRules>("beginner");
  const [matchFormat, setMatchFormat] = useState<TicTacToeMatchFormat>("single");
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
    minPlayers: 2,
    maxPlayers: 2,
    allowTeams: false,
  });

  const buildSetup = (starterIndex?: number): TicTacToeMatchSetup => ({
    boardLayoutId,
    claimRules,
    matchFormat,
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
        <SettingsGroup title="Tic Tac Toe" backHref={CLASSIC_GAMES_HUB_PATH}>
          <SettingsRow className="settings-row--rule-toggle" label="Board layout">
            <PillToggleGroup
              ariaLabel="Tic Tac Toe board layout"
              layout="grid"
              options={TIC_TAC_TOE_BOARD_LAYOUT_OPTIONS}
              value={boardLayoutId}
              onChange={setBoardLayoutId}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Claim rules">
            <PillToggleGroup
              ariaLabel="Tic Tac Toe claim rules"
              layout="grid"
              options={TIC_TAC_TOE_CLAIM_RULES_OPTIONS}
              value={claimRules}
              onChange={setClaimRules}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Match format">
            <PillToggleGroup
              ariaLabel="Tic Tac Toe match format"
              layout="grid"
              options={TIC_TAC_TOE_MATCH_FORMAT_OPTIONS}
              value={matchFormat}
              onChange={setMatchFormat}
            />
          </SettingsRow>
        </SettingsGroup>

        {match.playersGroup}

        <SettingsGroup>
          <SettingsRow
            label="Starting player"
            value={match.selectedStartingRule?.label ?? "Player 1"}
            chevron
            onPress={() => match.setStarterSheetOpen(true)}
          />
        </SettingsGroup>
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
