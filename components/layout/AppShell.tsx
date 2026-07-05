import { cn } from "@/utils/cn";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  fullWidth?: boolean;
}

export function AppShell({
  children,
  className,
  wide = false,
  fullWidth = false,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-full w-full flex-col",
        fullWidth ? "max-w-none" : wide ? "max-w-xl" : "max-w-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}
