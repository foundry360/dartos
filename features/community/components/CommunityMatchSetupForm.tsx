"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  type CommunityCricketRules,
  type CommunityGameMode,
  type CommunityMatchConfig,
  type CommunityX01Rules,
  DEFAULT_COMMUNITY_CRICKET_RULES,
  DEFAULT_COMMUNITY_X01_RULES,
  startingPlayerRuleLabel,
} from "@/features/community/lib/community-match-config";
import { STARTING_PLAYER_RULE_OPTIONS } from "@/features/players/lib/starting-player";
import {
  X01_GAME_TYPE_OPTIONS,
  parseX01GameTypeOptionValue,
  x01GameTypeToOptionValue,
} from "@/features/x01/lib/x01-game-options";
import { X01_IN_RULE_OPTIONS, X01_OUT_RULE_OPTIONS } from "@/features/x01/lib/x01-rules";
import type { CricketVariant } from "@/lib/constants";
import type { MatchStartingPlayerRule } from "@/types/player-setup";
import type { X01InRule, X01OutRule } from "@/types/x01";

interface CommunityMatchSetupFormProps {
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (config: CommunityMatchConfig) => void;
}

export function CommunityMatchSetupForm({
  busy = false,
  onCancel,
  onConfirm,
}: CommunityMatchSetupFormProps) {
  const [mode, setMode] = useState<CommunityGameMode>("x01");
  const [x01Rules, setX01Rules] = useState<CommunityX01Rules>(DEFAULT_COMMUNITY_X01_RULES);
  const [cricketRules, setCricketRules] = useState<CommunityCricketRules>(
    DEFAULT_COMMUNITY_CRICKET_RULES,
  );
  const [starterSheetOpen, setStarterSheetOpen] = useState(false);

  const activeStartingRule =
    mode === "x01" ? x01Rules.startingPlayerRule : cricketRules.startingPlayerRule;

  const selectedStarter = useMemo(
    () => STARTING_PLAYER_RULE_OPTIONS.find((option) => option.id === activeStartingRule),
    [activeStartingRule],
  );

  const setStartingRule = (rule: MatchStartingPlayerRule) => {
    if (mode === "x01") {
      setX01Rules((current) => ({ ...current, startingPlayerRule: rule }));
    } else {
      setCricketRules((current) => ({ ...current, startingPlayerRule: rule }));
    }
    setStarterSheetOpen(false);
  };

  const handleConfirm = () => {
    onConfirm({
      gameType: mode,
      rules: mode === "x01" ? x01Rules : cricketRules,
    });
  };

  return (
    <div className="setup-screen community-match-setup">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Game">
          <SettingsRow label="Match type">
            <SegmentedTabs
              ariaLabel="Community match type"
              value={mode}
              onChange={setMode}
              options={[
                { value: "x01", label: "X01" },
                { value: "cricket", label: "Cricket" },
              ]}
            />
          </SettingsRow>
        </SettingsGroup>

        {mode === "x01" ? (
          <SettingsGroup title="Format" howToPlay="x01">
            <SettingsRow className="settings-row--rule-toggle" label="Game">
              <PillToggleGroup
                ariaLabel="X01 starting score"
                options={X01_GAME_TYPE_OPTIONS}
                value={x01GameTypeToOptionValue(x01Rules.gameType)}
                onChange={(value) =>
                  setX01Rules((current) => ({
                    ...current,
                    gameType: parseX01GameTypeOptionValue(value),
                  }))
                }
                layout="grid"
              />
            </SettingsRow>
            <SettingsRow label="Legs per set">
              <StepperControl
                value={x01Rules.legsToWin}
                min={1}
                max={7}
                onChange={(legsToWin) => setX01Rules((current) => ({ ...current, legsToWin }))}
              />
            </SettingsRow>
            <SettingsRow label="Sets to win">
              <StepperControl
                value={x01Rules.setsToWin}
                min={1}
                max={5}
                onChange={(setsToWin) => setX01Rules((current) => ({ ...current, setsToWin }))}
              />
            </SettingsRow>
            <SettingsRow className="settings-row--rule-toggle" label="In">
              <PillToggleGroup
                ariaLabel="X01 in rule"
                options={X01_IN_RULE_OPTIONS.map(({ value, label }) => ({ value, label }))}
                value={x01Rules.inRule}
                onChange={(inRule: X01InRule) =>
                  setX01Rules((current) => ({ ...current, inRule }))
                }
              />
            </SettingsRow>
            <SettingsRow className="settings-row--rule-toggle" label="Out">
              <PillToggleGroup
                ariaLabel="X01 out rule"
                options={X01_OUT_RULE_OPTIONS.map(({ value, label }) => ({ value, label }))}
                value={x01Rules.outRule}
                onChange={(outRule: X01OutRule) =>
                  setX01Rules((current) => ({ ...current, outRule }))
                }
              />
            </SettingsRow>
          </SettingsGroup>
        ) : (
          <SettingsGroup
            title="Format"
            howToPlay={cricketRules.variant === "tactics" ? "tactics" : "cricket"}
          >
            <SettingsRow label="Match Style">
              <SegmentedTabs
                className="format-variant-toggle"
                ariaLabel="Cricket variant"
                value={cricketRules.variant}
                onChange={(variant: CricketVariant) =>
                  setCricketRules((current) => ({ ...current, variant }))
                }
                options={[
                  { value: "classic", label: "Cricket" },
                  { value: "tactics", label: "Tactics" },
                ]}
              />
            </SettingsRow>
            <SettingsRow label="Legs per set">
              <StepperControl
                value={cricketRules.legsToWin}
                min={1}
                max={7}
                onChange={(legsToWin) =>
                  setCricketRules((current) => ({ ...current, legsToWin }))
                }
              />
            </SettingsRow>
            <SettingsRow label="Sets to win">
              <StepperControl
                value={cricketRules.setsToWin}
                min={1}
                max={5}
                onChange={(setsToWin) =>
                  setCricketRules((current) => ({ ...current, setsToWin }))
                }
              />
            </SettingsRow>
          </SettingsGroup>
        )}

        <SettingsGroup title="Rules">
          <SettingsRow
            label="Starting player"
            value={selectedStarter?.label ?? startingPlayerRuleLabel(activeStartingRule)}
            chevron
            onPress={() => setStarterSheetOpen(true)}
          />
        </SettingsGroup>
      </div>

      <div className="setup-screen__footer community-match-setup__footer">
        <TouchButton
          type="button"
          variant="secondary"
          fullWidth
          size="lg"
          disabled={busy}
          onClick={onCancel}
        >
          Back
        </TouchButton>
        <TouchButton
          type="button"
          fullWidth
          size="xl"
          disabled={busy}
          onClick={handleConfirm}
        >
          {busy ? "Creating…" : "Create room"}
        </TouchButton>
      </div>

      <BottomSheet
        open={starterSheetOpen}
        title="Starting player"
        onClose={() => setStarterSheetOpen(false)}
      >
        <div className="community-match-setup__sheet-options">
          {STARTING_PLAYER_RULE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={
                option.id === activeStartingRule
                  ? "community-match-setup__sheet-option is-selected"
                  : "community-match-setup__sheet-option"
              }
              onClick={() => setStartingRule(option.id)}
            >
              <span className="community-match-setup__sheet-option-label">{option.label}</span>
              <span className="community-match-setup__sheet-option-copy">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
