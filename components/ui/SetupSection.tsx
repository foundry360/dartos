import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/utils/cn";

interface SetupSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SetupSection({ title, description, children, className }: SetupSectionProps) {
  return (
    <GlassPanel className={cn("setup-section", className)}>
      <header className="setup-section__header">
        <h3 className="setup-section__title">{title}</h3>
        {description ? <p className="setup-section__description">{description}</p> : null}
      </header>
      <div className="setup-section__content">{children}</div>
    </GlassPanel>
  );
}
