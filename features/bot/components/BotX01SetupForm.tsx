"use client";

import { useMemo, useState } from "react";
import { DEFAULT_LEGS, DEFAULT_SETS } from "@/lib/constants";
import type { X01GameType } from "@/lib/constants";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { BotDifficultyPicker } from "@/features/bot/components/BotDifficultyPicker";
import { DEFAULT_BOT_DIFFICULTY_ID } from "@/features/bot/lib/bot-profiles";
import { buildBotX01MatchSetup } from "@/features/bot/lib/build-bot-x01-setup";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import {
  X01_GAME_TYPE_OPTIONS,
  parseX01GameTypeOptionValue,
  x01GameTypeToOptionValue,
} from "@/features/x01/lib/x01-game-options";
import { X01_IN_RULE_OPTIONS, X01_OUT_RULE_OPTIONS } from "@/features/x01/lib/x01-rules";
import { primeBotMatchVoiceAsync } from "@/features/bot/lib/prime-bot-match-voice";
import type { BotDifficultyId } from "@/types/bot";
import type { X01MatchSetup } from "@/types/player-setup";
import type { X01InRule, X01OutRule } from "@/types/x01";

interface BotX01SetupFormProps {
  initialGameType?: X01GameType;
  onStart: (setup: X01MatchSetup) => void | Promise<void>;
}

export function BotX01SetupForm({ initialGameType = 501, onStart }: BotX01SetupFormProps) {
  const { profiles } = useSavedPlayerProfiles();
  const [gameType, setGameType] = useState<X01GameType>(initialGameType);
  const [difficultyId, setDifficultyId] = useState<BotDifficultyId>(DEFAULT_BOT_DIFFICULTY_ID);
  const [legsToWin, setLegsToWin] = useState(DEFAULT_LEGS);
  const [setsToWin, setSetsToWin] = useState(DEFAULT_SETS);
  const [inRule, setInRule] = useState<X01InRule>("straight_in");
  const [outRule, setOutRule] = useState<X01OutRule>("double_out");

  const accountPlayer = useMemo(
    () => profiles.find((profile) => profile.isAccountOwner) ?? null,
    [profiles],
  );

  const handleStart = async () => {
    const botProfile = getBotProfile(difficultyId);
    await primeBotMatchVoiceAsync(botProfile.displayName, accountPlayer?.name);

    await onStart(
      buildBotX01MatchSetup({
        gameType,
        difficultyId,
        legsToWin,
        setsToWin,
        inRule,
        outRule,
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
          <SettingsRow className="settings-row--rule-toggle" label="Game">
            <PillToggleGroup
              ariaLabel="X01 starting score"
              options={X01_GAME_TYPE_OPTIONS}
              value={x01GameTypeToOptionValue(gameType)}
              onChange={(value) => setGameType(parseX01GameTypeOptionValue(value))}
              layout="grid"
            />
          </SettingsRow>
          <SettingsRow label="Legs per set">
            <StepperControl value={legsToWin} min={1} max={7} onChange={setLegsToWin} />
          </SettingsRow>
          <SettingsRow label="Sets to win">
            <StepperControl value={setsToWin} min={1} max={5} onChange={setSetsToWin} />
          </SettingsRow>
          <SettingsRow className="settings-row--rule-toggle" label="In">
            <PillToggleGroup
              ariaLabel="X01 in rule"
              options={X01_IN_RULE_OPTIONS.map(({ value, label }) => ({ value, label }))}
              value={inRule}
              onChange={setInRule}
            />
          </SettingsRow>
          <SettingsRow className="settings-row--rule-toggle" label="Out">
            <PillToggleGroup
              ariaLabel="X01 out rule"
              options={X01_OUT_RULE_OPTIONS.map(({ value, label }) => ({ value, label }))}
              value={outRule}
              onChange={setOutRule}
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
