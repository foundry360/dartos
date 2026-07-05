"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { AppDrawer } from "@/components/layout/AppDrawer";
import { MenuIcon } from "@/components/ui/MenuIcon";
import { appMenuItems } from "@/lib/app-navigation";
import { cn } from "@/utils/cn";

interface MobileAppShellProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileAppShell({
  title = "DartScorer",
  children,
  className,
}: MobileAppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const drawerId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className={cn("mobile-app-shell", className)}>
      <header className="mobile-app-shell__header">
        <button
          type="button"
          className="mobile-app-shell__menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls={drawerId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon open={menuOpen} />
        </button>
        <h1 className="mobile-app-shell__title">{title}</h1>
        <div aria-hidden className="mobile-app-shell__header-spacer" />
      </header>

      <main className="mobile-app-shell__main">{children}</main>

      <AppDrawer
        id={drawerId}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={appMenuItems}
      />
    </div>
  );
}
