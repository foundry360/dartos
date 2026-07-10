"use client";

import { useMemo, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { TouchButton } from "@/components/ui/TouchButton";
import { BotDifficultyPicker } from "@/features/bot/components/BotDifficultyPicker";
import { DEFAULT_BOT_DIFFICULTY_ID } from "@/features/bot/lib/bot-profiles";
import { buildBotShanghaiMatchSetup } from "@/features/bot/lib/build-bot-shanghai-setup";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  SHANGHAI_GAME_LENGTH_OPTIONS,
  SHANGHAI_RULE_OPTIONS,
  SHANGHAI_WINNING_MODE_OPTIONS,
} from "@/features/classic-games/lib/shanghai-config";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import { primeBotMatchVoiceAsync } from "@/features/bot/lib/prime-bot-match-voice";
import { primeShanghaiClips } from "@/utils/shanghai-audio";
import type { BotDifficultyId } from "@/types/bot";
import type {
  ShanghaiGameLengthPreset,
  ShanghaiMatchSetup,
  ShanghaiRule,
  ShanghaiWinningMode,
} from "@/types/shanghai";

interface BotShanghaiSetupFormProps {
  onStart: (setup: ShanghaiMatchSetup) => void | Promise<void>;
}

export function BotShanghaiSetupForm({ onStart }: BotShanghaiSetupFormProps) {
  const { profiles } = useSavedPlayerProfiles();
  const [difficultyId, setDifficultyId] = useState<BotDifficultyId>(DEFAULT_BOT_DIFFICULTY_ID);
  const [gameLengthPreset, setGameLengthPreset] = useState<ShanghaiGameLengthPreset>("classic");
  const [shanghaiRule, setShanghaiRule] = useState<ShanghaiRule>("bonus_points");
  const [winningMode, setWinningMode] = useState<ShanghaiWinningMode>("highest_score");

  const accountPlayer = useMemo(
    () => profiles.find((profile) => profile.isAccountOwner) ?? null,
    [profiles],
  );

  const handleStart = async () => {
    const botProfile = getBotProfile(difficultyId);
    await primeBotMatchVoiceAsync(botProfile.displayName, accountPlayer?.name, primeShanghaiClips);

    await onStart(
      buildBotShanghaiMatchSetup({
        difficultyId,
        gameLengthPreset,
        shanghaiRule,
        winningMode,
        accountPlayer,
      }),
    );
  };

  return (
    <div className="setup-screen bot-shanghai-setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Opponent">
          <BotDifficultyPicker value={difficultyId} onChange={setDifficultyId} />
        </SettingsGroup>

        <SettingsGroup title="Format">
          <SettingsRow label="Length">
            <PillToggleGroup
              ariaLabel="Shanghai game length"
              value={gameLengthPreset}
              onChange={setGameLengthPreset}
              options={SHANGHAI_GAME_LENGTH_OPTIONS.filter((option) => option.value !== "custom")}
            />
          </SettingsRow>
          <SettingsRow label="Shanghai rule">
            <PillToggleGroup
              ariaLabel="Shanghai rule"
              value={shanghaiRule}
              onChange={setShanghaiRule}
              options={SHANGHAI_RULE_OPTIONS}
            />
          </SettingsRow>
          <SettingsRow label="Winning mode">
            <PillToggleGroup
              ariaLabel="Shanghai winning mode"
              value={winningMode}
              onChange={setWinningMode}
              options={SHANGHAI_WINNING_MODE_OPTIONS}
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
