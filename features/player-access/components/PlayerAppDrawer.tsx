"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/components/providers/AuthProvider";
import { AvatarPlaceholder } from "@/components/ui/AvatarPlaceholder";
import { AppMenuItemIcon, type AppMenuIconName } from "@/components/ui/AppMenuIcons";
import { TouchButton } from "@/components/ui/TouchButton";
import { signOut } from "@/features/auth/lib/auth-actions";
import {
  requestPlayerUpgradeModal,
  resetPlayerUpgradeModalForLogin,
} from "@/features/player-access/lib/player-upgrade-modal-storage";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { PLAYER_INSTALL_PATH, PLAYER_LOGIN_PATH } from "@/lib/auth/routes";
import { APP_NAME } from "@/lib/theme";
import { cn } from "@/utils/cn";

type PlayerDrawerLinkItem = {
  label: string;
  icon: AppMenuIconName;
  href: string;
};

type PlayerDrawerActionItem = {
  label: string;
  icon: AppMenuIconName;
  onSelect: () => void;
};

type PlayerDrawerItem = PlayerDrawerLinkItem | PlayerDrawerActionItem;

function isLinkItem(item: PlayerDrawerItem): item is PlayerDrawerLinkItem {
  return "href" in item;
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

interface PlayerAppDrawerProps {
  id?: string;
  open: boolean;
  onClose: () => void;
}

export function PlayerAppDrawer({ id, open, onClose }: PlayerAppDrawerProps) {
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const avatarUrl = useProfileStore((state) => state.avatarUrl);
  const cloudDisplayName = useProfileStore((state) => state.displayName);
  const setAvatarUrl = useProfileStore((state) => state.setAvatarUrl);
  const setDisplayName = useProfileStore((state) => state.setDisplayName);
  const setNickname = useProfileStore((state) => state.setNickname);
  const [signingOut, setSigningOut] = useState(false);
  const displayName = cloudDisplayName ?? getUserDisplayName(user);

  const items: PlayerDrawerItem[] = [
    {
      label: "Install app",
      icon: "settings",
      href: PLAYER_INSTALL_PATH,
    },
    {
      label: "Upgrade",
      icon: "bullseye",
      onSelect: () => {
        onClose();
        requestPlayerUpgradeModal();
      },
    },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut();
      setAvatarUrl(null);
      setDisplayName(null);
      setNickname(null);
      resetPlayerUpgradeModalForLogin();
      onClose();
      router.push(PLAYER_LOGIN_PATH);
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
            aria-label="Player menu"
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
                    <p className="app-drawer__user-email">{APP_NAME}</p>
                  )}
                </div>
              </div>
            </div>

            <nav className="app-drawer__nav">
              {items.map((item) => {
                if (isLinkItem(item)) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className="app-drawer__link"
                    >
                      <span className="app-drawer__link-icon" aria-hidden>
                        <AppMenuItemIcon name={item.icon} />
                      </span>
                      <span className="app-drawer__link-label">{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    className="app-drawer__link"
                    onClick={item.onSelect}
                  >
                    <span className="app-drawer__link-icon" aria-hidden>
                      <AppMenuItemIcon name={item.icon} />
                    </span>
                    <span className="app-drawer__link-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="app-drawer__footer">
              {configured && user ? (
                <TouchButton
                  variant="primary"
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
