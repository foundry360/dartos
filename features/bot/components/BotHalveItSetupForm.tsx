"use client";

import { useMemo, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { TouchButton } from "@/components/ui/TouchButton";
import { BotDifficultyPicker } from "@/features/bot/components/BotDifficultyPicker";
import { DEFAULT_BOT_DIFFICULTY_ID } from "@/features/bot/lib/bot-profiles";
import { buildBotHalveItMatchSetup } from "@/features/bot/lib/build-bot-halve-it-setup";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  HALVE_IT_GAME_LENGTH_OPTIONS,
  HALVE_IT_SCORING_MODE_OPTIONS,
  HALVE_IT_TARGET_SEQUENCE_OPTIONS,
} from "@/features/classic-games/lib/halve-it-config";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import { prefetchPlayerTurnVoice, prefetchGameOnVoice } from "@/utils/speech";
import type { BotDifficultyId } from "@/types/bot";
import type {
  HalveItGameLengthPreset,
  HalveItMatchSetup,
  HalveItScoringMode,
  HalveItTargetSequenceId,
} from "@/types/halve-it";

interface BotHalveItSetupFormProps {
  onStart: (setup: HalveItMatchSetup) => void | Promise<void>;
}

export function BotHalveItSetupForm({ onStart }: BotHalveItSetupFormProps) {
  const { profiles } = useSavedPlayerProfiles();
  const [difficultyId, setDifficultyId] = useState<BotDifficultyId>(DEFAULT_BOT_DIFFICULTY_ID);
  const [gameLengthPreset, setGameLengthPreset] = useState<HalveItGameLengthPreset>("standard");
  const [targetSequenceId, setTargetSequenceId] = useState<HalveItTargetSequenceId>("classic");
  const [scoringMode, setScoringMode] = useState<HalveItScoringMode>("target_only");

  const accountPlayer = useMemo(
    () => profiles.find((profile) => profile.isAccountOwner) ?? null,
    [profiles],
  );

  const handleStart = () => {
    const botProfile = getBotProfile(difficultyId);
    prefetchPlayerTurnVoice(botProfile.displayName);
    prefetchGameOnVoice(botProfile.displayName);

    void onStart(
      buildBotHalveItMatchSetup({
        difficultyId,
        gameLengthPreset,
        targetSequenceId,
        scoringMode,
        accountPlayer,
      }),
    );
  };

  return (
    <div className="setup-screen bot-halve-it-setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Opponent">
          <BotDifficultyPicker value={difficultyId} onChange={setDifficultyId} />
        </SettingsGroup>

        <SettingsGroup title="Format">
          <SettingsRow label="Length">
            <PillToggleGroup
              ariaLabel="Halve-It game length"
              value={gameLengthPreset}
              onChange={setGameLengthPreset}
              options={HALVE_IT_GAME_LENGTH_OPTIONS.filter((option) => option.value !== "custom")}
            />
          </SettingsRow>
          <SettingsRow label="Target sequence">
            <PillToggleGroup
              ariaLabel="Halve-It target sequence"
              value={targetSequenceId}
              onChange={setTargetSequenceId}
              options={HALVE_IT_TARGET_SEQUENCE_OPTIONS}
            />
          </SettingsRow>
          <SettingsRow label="Scoring">
            <PillToggleGroup
              ariaLabel="Halve-It scoring mode"
              value={scoringMode}
              onChange={setScoringMode}
              options={HALVE_IT_SCORING_MODE_OPTIONS}
            />
          </SettingsRow>
          <SettingsRow label="You">
            <span className="settings-row__value">{accountPlayer?.name ?? "You"}</span>
          </SettingsRow>
        </SettingsGroup>
      </div>

      <div className="setup-screen__footer">
        <TouchButton fullWidth size="xl" onClick={handleStart}>
          Start Match
        </TouchButton>
      </div>
    </div>
  );
}
