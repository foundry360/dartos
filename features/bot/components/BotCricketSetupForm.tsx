"use client";

import { useMemo, useState } from "react";
import { DEFAULT_LEGS, type CricketVariant } from "@/lib/constants";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import { BotDifficultyPicker } from "@/features/bot/components/BotDifficultyPicker";
import { DEFAULT_BOT_DIFFICULTY_ID } from "@/features/bot/lib/bot-profiles";
import { buildBotCricketMatchSetup } from "@/features/bot/lib/build-bot-cricket-setup";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import { prefetchPlayerTurnVoice, prefetchGameOnVoice } from "@/utils/speech";
import type { BotDifficultyId } from "@/types/bot";
import type { CricketMatchSetup } from "@/types/player-setup";

interface BotCricketSetupFormProps {
  initialVariant?: CricketVariant;
  onStart: (setup: CricketMatchSetup) => void | Promise<void>;
}

export function BotCricketSetupForm({
  initialVariant = "classic",
  onStart,
}: BotCricketSetupFormProps) {
  const { profiles } = useSavedPlayerProfiles();
  const [variant, setVariant] = useState<CricketVariant>(initialVariant);
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
      buildBotCricketMatchSetup({
        variant,
        difficultyId,
        legsToWin,
        accountPlayer,
      }),
    );
  };

  return (
    <div className="setup-screen bot-cricket-setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Opponent">
          <BotDifficultyPicker value={difficultyId} onChange={setDifficultyId} />
        </SettingsGroup>

        <SettingsGroup title="Format">
          <SettingsRow label="Match Style">
            <SegmentedTabs
              className="format-variant-toggle"
              ariaLabel="Cricket variant"
              value={variant}
              onChange={setVariant}
              options={[
                { value: "classic", label: "Cricket" },
                { value: "tactics", label: "Tactics" },
              ]}
            />
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
