"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AppMenuItem } from "@/lib/app-navigation";
import { APP_HOME_PATH, LOGIN_PATH } from "@/lib/auth/routes";
import { signOut } from "@/features/auth/lib/auth-actions";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { AvatarPlaceholder } from "@/components/ui/AvatarPlaceholder";
import { AppMenuItemIcon } from "@/components/ui/AppMenuIcons";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";

interface AppDrawerProps {
  id?: string;
  open: boolean;
  onClose: () => void;
  items: AppMenuItem[];
}

function getUserDisplayName(user: User | null) {
  if (!user) {
    return "Guest";
  }

  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  return user.email?.split("@")[0] ?? "Player";
}

export function AppDrawer({ id, open, onClose, items }: AppDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const avatarUrl = useProfileStore((state) => state.avatarUrl);
  const cloudDisplayName = useProfileStore((state) => state.displayName);
  const setAvatarUrl = useProfileStore((state) => state.setAvatarUrl);
  const setDisplayName = useProfileStore((state) => state.setDisplayName);
  const [signingOut, setSigningOut] = useState(false);
  const displayName = cloudDisplayName ?? getUserDisplayName(user);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut();
      setAvatarUrl(null);
      setDisplayName(null);
      onClose();
      router.push(LOGIN_PATH);
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

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
              <div className="app-drawer__user">
                <div
                  className={cn(
                    "app-drawer__avatar",
                    !loading && !avatarUrl && "app-drawer__avatar--placeholder",
                  )}
                  aria-hidden
                >
                  {loading ? (
                    "…"
                  ) : avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="app-drawer__avatar-image" />
                  ) : (
                    <AvatarPlaceholder iconClassName="app-drawer__avatar-icon" />
                  )}
                </div>
                <div className="app-drawer__user-copy">
                  <p className="app-drawer__user-name">
                    {loading ? "Loading…" : displayName}
                  </p>
                  {user?.email ? (
                    <p className="app-drawer__user-email">{user.email}</p>
                  ) : (
                    <p className="app-drawer__user-email">DartScorer</p>
                  )}
                </div>
              </div>
            </div>

            <nav className="app-drawer__nav">
              {items.map((item) => {
                const isActive =
                  item.href === APP_HOME_PATH
                    ? pathname === APP_HOME_PATH
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
                    <span className="app-drawer__link-icon" aria-hidden>
                      <AppMenuItemIcon name={item.icon} />
                    </span>
                    <span className="app-drawer__link-label">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="app-drawer__footer">
              {configured && user ? (
                <TouchButton
                  variant="secondary"
                  size="md"
                  fullWidth
                  disabled={signingOut}
                  onClick={() => void handleSignOut()}
                >
                  {signingOut ? "Signing out..." : "Log out"}
                </TouchButton>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
