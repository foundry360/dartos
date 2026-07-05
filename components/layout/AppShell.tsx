interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={`mx-auto flex min-h-full w-full max-w-lg flex-col ${className ?? ""}`}>
      {children}
    </div>
  );
}
