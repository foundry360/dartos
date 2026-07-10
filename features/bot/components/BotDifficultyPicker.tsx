"use client";

import { cn } from "@/utils/cn";
import { BOT_PROFILES, getBotProfile } from "@/features/bot/lib/bot-profiles";
import type { BotDifficultyId } from "@/types/bot";

interface BotDifficultyPickerProps {
  value: BotDifficultyId;
  onChange: (value: BotDifficultyId) => void;
}

export function BotDifficultyPicker({ value, onChange }: BotDifficultyPickerProps) {
  const selectedProfile = getBotProfile(value);

  return (
    <div className="bot-difficulty-picker">
      <span className="settings-group__inset-label">Difficulty</span>
      <div className="bot-difficulty-grid" role="radiogroup" aria-label="Bot difficulty">
        {BOT_PROFILES.map((profile) => {
          const selected = value === profile.id;

          return (
            <button
              key={profile.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn("bot-difficulty-chip", selected && "bot-difficulty-chip--active")}
              onClick={() => onChange(profile.id)}
            >
              {profile.label}
            </button>
          );
        })}
      </div>
      <p className="bot-difficulty-summary">
        <span className="bot-difficulty-summary__name">{selectedProfile.displayName}</span>
        <span className="bot-difficulty-summary__meta">
          {selectedProfile.targetThreeDartAverage} avg · {selectedProfile.description}
        </span>
      </p>
    </div>
  );
}
