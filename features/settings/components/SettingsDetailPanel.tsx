"use client";

import { useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BoardThemePicker } from "@/features/settings/components/BoardThemePicker";
import { AccountSettingsPanel } from "@/features/settings/components/AccountSettingsPanel";
import { WalletSettingsPanel } from "@/features/wallet/components/WalletSettingsPanel";
import { PlayerProfilesSettingsPanel } from "@/features/players/components/PlayerProfilesSettingsPanel";
import { InstallAppSettingsPanel } from "@/features/install/components/InstallAppSettingsPanel";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/features/settings/lib/settings-sections";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { APP_NAME } from "@/lib/theme";
import { playSoundEffectsTest } from "@/utils/sound-effects";
import { playVoiceTest, prefetchVoiceTest, warmVoiceCache } from "@/utils/speech";

interface SettingsDetailPanelProps {
  section: SettingsSectionId;
}

export function SettingsDetailPanel({ section }: SettingsDetailPanelProps) {
  const meta = SETTINGS_SECTIONS.find((entry) => entry.id === section);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const voiceAnnouncementsEnabled = useSettingsStore(
    (state) => state.voiceAnnouncementsEnabled,
  );
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const confirmFinishTurn = useSettingsStore((state) => state.confirmFinishTurn);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setVoiceAnnouncementsEnabled = useSettingsStore(
    (state) => state.setVoiceAnnouncementsEnabled,
  );
  const setNotificationsEnabled = useSettingsStore((state) => state.setNotificationsEnabled);
  const setConfirmFinishTurn = useSettingsStore((state) => state.setConfirmFinishTurn);

  useEffect(() => {
    if (section !== "gameplay") {
      return;
    }

    warmVoiceCache();
    prefetchVoiceTest();
  }, [section]);

  if (!meta) {
    return null;
  }

  return (
    <section className="settings-panel" aria-labelledby="settings-panel-title">
      <header className="settings-panel__header">
        <h2 id="settings-panel-title" className="settings-panel__title">
          {meta.label}
        </h2>
        {meta.description ? (
          <p className="settings-panel__description">{meta.description}</p>
        ) : null}
      </header>

      <div className="settings-panel__content">
        {section === "appearance" ? <BoardThemePicker embedded /> : null}

        {section === "gameplay" ? (
          <div className="settings-panel__toggles">
            <SettingToggle
              label="Haptic feedback"
              description="Vibration on hits, swipes, and actions"
              enabled={hapticsEnabled}
              onChange={setHapticsEnabled}
            />
            <SettingToggle
              label="Sound effects"
              description="Board tones and crowd cheers for 180s, double bulls, and match wins"
              enabled={soundEnabled}
              onBeforeChange={(enabled) => {
                if (enabled) {
                  playSoundEffectsTest();
                }
              }}
              onChange={setSoundEnabled}
            />
            <SettingToggle
              label="Voice announcements"
              description="Voice calls out visit totals and player turns at a natural pace"
              enabled={voiceAnnouncementsEnabled}
              onBeforeChange={(enabled) => {
                if (enabled) {
                  playVoiceTest();
                }
              }}
              onChange={setVoiceAnnouncementsEnabled}
            />
            <SettingToggle
              label="In-app notifications"
              description={`Show ${APP_NAME} messages and the unread badge on the home bell`}
              enabled={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
            <SettingToggle
              label="Confirm finish turn"
              description="Ask before ending a visit early"
              enabled={confirmFinishTurn}
              onChange={setConfirmFinishTurn}
            />
          </div>
        ) : null}

        {section === "players" ? <PlayerProfilesSettingsPanel /> : null}

        {section === "billing" ? <WalletSettingsPanel /> : null}

        {section === "install" ? <InstallAppSettingsPanel /> : null}

        {section === "account" ? <AccountSettingsPanel /> : null}
      </div>
    </section>
  );
}
