import { cn } from "@/utils/cn";

interface AuthShellProps {
  children: React.ReactNode;
  wide?: boolean;
  compact?: boolean;
}

export function AuthShell({ children, wide = false, compact = false }: AuthShellProps) {
  return (
    <div className={cn("auth-screen", compact && "auth-screen--compact")}>
      <div className="auth-screen__wedges" aria-hidden />
      <div className="auth-screen__glow" aria-hidden />
      <div className={wide ? "auth-screen__wrap auth-screen__wrap--wide" : "auth-screen__wrap"}>
        {children}
      </div>
    </div>
  );
}
