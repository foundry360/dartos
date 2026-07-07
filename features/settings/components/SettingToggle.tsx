import { GlassPanel } from "@/components/ui/GlassPanel";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface SettingToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  onBeforeChange?: (enabled: boolean) => void;
}

export function SettingToggle({
  label,
  description,
  enabled,
  onChange,
  onBeforeChange,
}: SettingToggleProps) {
  return (
    <GlassPanel className="settings-toggle-row">
      <div className="settings-toggle-row__content">
        <p className="settings-toggle-row__label">{label}</p>
        <p className="settings-toggle-row__description">{description}</p>
      </div>
      <ToggleSwitch
        enabled={enabled}
        onChange={onChange}
        onBeforeChange={onBeforeChange}
        label={label}
        className="settings-toggle-row__switch"
      />
    </GlassPanel>
  );
}
