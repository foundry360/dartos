"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BoardThemePicker } from "@/features/settings/components/BoardThemePicker";
import { useSettingsStore } from "@/features/settings/store/settings-store";

export default function SettingsPage() {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const confirmFinishTurn = useSettingsStore((state) => state.confirmFinishTurn);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setConfirmFinishTurn = useSettingsStore((state) => state.setConfirmFinishTurn);

  return (
    <AppShell className="gap-4 pb-safe-bottom">
      <PageHeader title="Settings" subtitle="Preferences & players" backHref="/" />

      <BoardThemePicker />

      <div className="space-y-3 px-4">
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

      <div className="px-4">
        <GlassPanel>
          <h2 className="text-lg font-bold">Player profiles</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Avatar, nickname, favorite color, and lifetime stats will sync through Supabase once
            sign-in is added.
          </p>
        </GlassPanel>
      </div>
    </AppShell>
  );
}

function SettingToggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <GlassPanel className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-[52px] w-[92px] rounded-full transition-colors ${
          enabled ? "bg-accent" : "bg-surface-hover"
        }`}
      >
        <span
          className={`absolute top-1 h-[44px] w-[44px] rounded-full bg-white transition-transform ${
            enabled ? "translate-x-[44px]" : "translate-x-1"
          }`}
        />
      </button>
    </GlassPanel>
  );
}
