"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { cn } from "@/utils/cn";

interface SettingsGroupProps {
  title?: string;
  backHref?: string;
  footer?: string;
  tabs?: React.ReactNode;
  headingTabs?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SettingsGroup({
  title,
  backHref,
  footer,
  tabs,
  headingTabs = false,
  children,
  className,
}: SettingsGroupProps) {
  return (
    <section className={cn("settings-group", headingTabs && "settings-group--heading-tabs", className)}>
      {title ? (
        <div className={cn("settings-group__title-row", backHref && "settings-group__title-row--with-back")}>
          {backHref ? (
            <Link
              href={backHref}
              className="settings-group__back page-header__back"
              aria-label="Go back"
            >
              <ArrowLeftIcon />
            </Link>
          ) : null}
          <h3 className="settings-group__title">{title}</h3>
        </div>
      ) : null}
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
