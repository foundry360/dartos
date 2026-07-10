"use client";

import { useMemo, useState } from "react";
import { DEFAULT_LEGS } from "@/lib/constants";
import type { X01GameType } from "@/lib/constants";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import { BotDifficultyPicker } from "@/features/bot/components/BotDifficultyPicker";
import { DEFAULT_BOT_DIFFICULTY_ID } from "@/features/bot/lib/bot-profiles";
import { buildBotX01MatchSetup } from "@/features/bot/lib/build-bot-x01-setup";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import { prefetchPlayerTurnVoice, prefetchGameOnVoice } from "@/utils/speech";
import type { BotDifficultyId } from "@/types/bot";
import type { X01MatchSetup } from "@/types/player-setup";

interface BotX01SetupFormProps {
  gameType: X01GameType;
  onStart: (setup: X01MatchSetup) => void | Promise<void>;
}

export function BotX01SetupForm({ gameType, onStart }: BotX01SetupFormProps) {
  const { profiles } = useSavedPlayerProfiles();
  const [difficultyId, setDifficultyId] = useState<BotDifficultyId>(DEFAULT_BOT_DIFFICULTY_ID);
  const [legsToWin, setLegsToWin] = useState(DEFAULT_LEGS);

  const accountPlayer = useMemo(
    () => profiles.find((profile) => profile.isAccountOwner) ?? null,
    [profiles],
  );

  const handleStart = () => {
    const botProfile = getBotProfile(difficultyId);
    prefetchPlayerTurnVoice(botProfile.displayName);
    prefetchGameOnVoice(botProfile.displayName);

    void onStart(
      buildBotX01MatchSetup({
        gameType,
        difficultyId,
        legsToWin,
        accountPlayer,
      }),
    );
  };

  return (
    <div className="setup-screen bot-x01-setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Opponent">
          <BotDifficultyPicker value={difficultyId} onChange={setDifficultyId} />
        </SettingsGroup>

        <SettingsGroup title="Format">
          <SettingsRow label="Game">
            <span className="settings-row__value">{gameType}</span>
          </SettingsRow>
          <SettingsRow label="Legs to win">
            <StepperControl value={legsToWin} min={1} max={7} onChange={setLegsToWin} />
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
