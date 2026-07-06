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
    <GlassPanel className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} label={label} />
    </GlassPanel>
  );
}
