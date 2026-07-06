import { cn } from "@/utils/cn";

interface BoardGameTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function BoardGameTitle({ title, subtitle, className }: BoardGameTitleProps) {
  return (
    <div className={cn("scoring-board-title-block", className)}>
      <p className="scoring-board-title">{title}</p>
      {subtitle ? <p className="scoring-board-subtitle">{subtitle}</p> : null}
    </div>
  );
}
