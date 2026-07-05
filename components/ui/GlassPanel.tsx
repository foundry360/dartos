import { cn } from "@/utils/cn";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/50 bg-surface-elevated/70 p-4 backdrop-blur-xl shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
