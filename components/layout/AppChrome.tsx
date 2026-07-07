"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { AppDrawer } from "@/components/layout/AppDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { MenuIcon } from "@/components/ui/MenuIcon";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { appMenuItems, shouldShowBottomNav } from "@/lib/app-navigation";
import { cn } from "@/utils/cn";

interface AppChromeProps {
  title?: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function AppChrome({
  title = "DartScorer",
  headerContent,
  children,
  className,
  style,
}: AppChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const drawerId = useId();
  const themePrimaryColor = useActiveBoardThemePrimaryColor();
  const showBottomNav = shouldShowBottomNav(className);

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
    <div
      className={cn("mobile-app-shell", className)}
      style={{ "--theme-primary-color": themePrimaryColor, ...style } as CSSProperties}
    >
      <header
        className={cn(
          "mobile-app-shell__header",
          headerContent && "mobile-app-shell__header--custom",
        )}
      >
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
        {headerContent ? (
          <>
            <h1 className="mobile-app-shell__title">{title}</h1>
            <div className="mobile-app-shell__header-trailing">{headerContent}</div>
          </>
        ) : (
          <>
            <h1 className="mobile-app-shell__title">{title}</h1>
            <div aria-hidden className="mobile-app-shell__header-spacer" />
          </>
        )}
      </header>

      {children}

      {showBottomNav ? <BottomNav /> : null}

      <AppDrawer
        id={drawerId}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={appMenuItems}
      />
    </div>
  );
}
