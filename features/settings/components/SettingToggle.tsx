import { GlassPanel } from "@/components/ui/GlassPanel";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface SettingToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function SettingToggle({
  label,
  description,
  enabled,
  onChange,
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
        label={label}
        className="settings-toggle-row__switch"
      />
    </GlassPanel>
  );
}
