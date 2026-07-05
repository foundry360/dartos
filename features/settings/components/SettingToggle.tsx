import { GlassPanel } from "@/components/ui/GlassPanel";

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
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-[52px] w-[92px] shrink-0 rounded-full transition-colors ${
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
