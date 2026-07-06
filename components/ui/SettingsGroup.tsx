import { cn } from "@/utils/cn";

interface SettingsGroupProps {
  title?: string;
  footer?: string;
  tabs?: React.ReactNode;
  headingTabs?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SettingsGroup({
  title,
  footer,
  tabs,
  headingTabs = false,
  children,
  className,
}: SettingsGroupProps) {
  return (
    <section className={cn("settings-group", headingTabs && "settings-group--heading-tabs", className)}>
      {title ? <h3 className="settings-group__title">{title}</h3> : null}
      {tabs ? (
        <div className={cn("settings-group__tabs", headingTabs && "settings-group__tabs--heading")}>
          {tabs}
        </div>
      ) : null}
      <div className="settings-group__card">{children}</div>
      {footer ? <p className="settings-group__footer">{footer}</p> : null}
    </section>
  );
}
