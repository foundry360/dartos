import { cn } from "@/utils/cn";

interface BoardGameTitleProps {
  title: string;
  className?: string;
}

export function BoardGameTitle({ title, className }: BoardGameTitleProps) {
  return (
    <p className={cn("scoring-board-title", className)}>
      {title}
    </p>
  );
}
