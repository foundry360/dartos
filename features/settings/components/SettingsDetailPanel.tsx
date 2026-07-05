"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { BoardThemePicker } from "@/features/settings/components/BoardThemePicker";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/features/settings/lib/settings-sections";
import { useSettingsStore } from "@/features/settings/store/settings-store";

interface SettingsDetailPanelProps {
  section: SettingsSectionId;
}

export function SettingsDetailPanel({ section }: SettingsDetailPanelProps) {
  const meta = SETTINGS_SECTIONS.find((entry) => entry.id === section);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const confirmFinishTurn = useSettingsStore((state) => state.confirmFinishTurn);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setConfirmFinishTurn = useSettingsStore((state) => state.setConfirmFinishTurn);

  if (!meta) {
    return null;
  }

  return (
    <section className="settings-panel" aria-labelledby="settings-panel-title">
      <header className="settings-panel__header">
        <h2 id="settings-panel-title" className="text-xl font-bold">
          {meta.label}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
      </header>

      <div className="settings-panel__content">
        {section === "appearance" ? <BoardThemePicker embedded /> : null}

        {section === "gameplay" ? (
          <div className="space-y-3">
            <SettingToggle
              label="Haptic feedback"
              description="Vibration on hits, swipes, and actions"
              enabled={hapticsEnabled}
              onChange={setHapticsEnabled}
            />
            <SettingToggle
              label="Sound effects"
              description="Audio feedback for scoring events"
              enabled={soundEnabled}
              onChange={setSoundEnabled}
            />
            <SettingToggle
              label="Confirm finish turn"
              description="Ask before ending a visit early"
              enabled={confirmFinishTurn}
              onChange={setConfirmFinishTurn}
            />
          </div>
        ) : null}

        {section === "players" ? (
          <GlassPanel>
            <h3 className="text-lg font-bold">Player profiles</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Avatar, nickname, favorite color, and lifetime stats will sync through Supabase
              once sign-in is added.
            </p>
          </GlassPanel>
        ) : null}
      </div>
    </section>
  );
}
