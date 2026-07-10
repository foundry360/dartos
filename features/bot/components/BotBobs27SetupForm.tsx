"use client";

import { useMemo, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { TouchButton } from "@/components/ui/TouchButton";
import { BotDifficultyPicker } from "@/features/bot/components/BotDifficultyPicker";
import { DEFAULT_BOT_DIFFICULTY_ID } from "@/features/bot/lib/bot-profiles";
import { buildBotBobs27MatchSetup } from "@/features/bot/lib/build-bot-bobs-27-setup";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  BOBS_27_GAME_LENGTH_OPTIONS,
  BOBS_27_TARGET_TYPE_OPTIONS,
} from "@/features/classic-games/lib/bobs-27-config";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import { primeBotMatchVoiceAsync } from "@/features/bot/lib/prime-bot-match-voice";
import { primeBobs27Clips } from "@/utils/bobs-27-audio";
import type { BotDifficultyId } from "@/types/bot";
import type {
  Bobs27GameLengthPreset,
  Bobs27MatchSetup,
  Bobs27TargetTypeId,
} from "@/types/bobs-27";

interface BotBobs27SetupFormProps {
  onStart: (setup: Bobs27MatchSetup) => void | Promise<void>;
}

export function BotBobs27SetupForm({ onStart }: BotBobs27SetupFormProps) {
  const { profiles } = useSavedPlayerProfiles();
  const [difficultyId, setDifficultyId] = useState<BotDifficultyId>(DEFAULT_BOT_DIFFICULTY_ID);
  const [gameLengthPreset, setGameLengthPreset] = useState<Bobs27GameLengthPreset>("standard");
  const [targetTypeId, setTargetTypeId] = useState<Bobs27TargetTypeId>("doubles_bull");
  const [eliminationEnabled, setEliminationEnabled] = useState(true);

  const accountPlayer = useMemo(
    () => profiles.find((profile) => profile.isAccountOwner) ?? null,
    [profiles],
  );

  const handleStart = async () => {
    const botProfile = getBotProfile(difficultyId);
    await primeBotMatchVoiceAsync(botProfile.displayName, accountPlayer?.name, primeBobs27Clips);

    await onStart(
      buildBotBobs27MatchSetup({
        difficultyId,
        gameLengthPreset,
        targetTypeId,
        eliminationEnabled,
        accountPlayer,
      }),
    );
  };

  return (
    <div className="setup-screen bot-bobs-27-setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Opponent">
          <BotDifficultyPicker value={difficultyId} onChange={setDifficultyId} />
        </SettingsGroup>

        <SettingsGroup title="Format">
          <SettingsRow label="Target sequence">
            <PillToggleGroup
              ariaLabel="Bob's 27 target sequence"
              value={targetTypeId}
              onChange={setTargetTypeId}
              options={BOBS_27_TARGET_TYPE_OPTIONS}
            />
          </SettingsRow>
          <SettingsRow label="Length">
            <PillToggleGroup
              ariaLabel="Bob's 27 game length"
              value={gameLengthPreset}
              onChange={setGameLengthPreset}
              options={BOBS_27_GAME_LENGTH_OPTIONS.filter((option) => option.value !== "custom")}
            />
          </SettingsRow>
          <SettingsRow label="Elimination">
            <ToggleSwitch
              enabled={eliminationEnabled}
              onChange={setEliminationEnabled}
              label="Elimination enabled"
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
