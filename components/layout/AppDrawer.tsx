"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { AppMenuItem } from "@/lib/app-navigation";
import { cn } from "@/utils/cn";

interface AppDrawerProps {
  id?: string;
  open: boolean;
  onClose: () => void;
  items: AppMenuItem[];
}

export function AppDrawer({ id, open, onClose, items }: AppDrawerProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="app-drawer__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            id={id}
            role="dialog"
            aria-modal="true"
            aria-label="App menu"
            className="app-drawer__panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <div className="app-drawer__header">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                DartScorer
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Menu</p>
            </div>

            <nav className="app-drawer__nav">
              {items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "app-drawer__link",
                      isActive && "app-drawer__link--active",
                    )}
                  >
                    <span className="font-semibold">{item.label}</span>
                    {item.description ? (
                      <span className="text-sm text-muted-foreground">{item.description}</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <p className="app-drawer__footer">More features coming soon.</p>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
