"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { signOut } from "@/features/auth/lib/auth-actions";
import { resetPlayerUpgradeModalForLogin } from "@/features/player-access/lib/player-upgrade-modal-storage";
import { PLAYER_HOME_PATH, PLAYER_LOGIN_PATH, SUBSCRIBE_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import { fetchProfile } from "@/lib/supabase/queries/profile";
import "@/features/player-access/player-access.css";

export function PlayerAccountScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      setEmail(user.email ?? null);
      const profile = await fetchProfile(supabase, user.id);
      setDisplayName(profile?.display_name ?? null);
    })();
  }, []);

  return (
    <PlayerAppShell
      heading="Account"
      backHref={PLAYER_HOME_PATH}
      className="shell-page player-account-page"
    >
      <div className="player-account">
        <div className="player-account__banner" aria-hidden>
          <Image
            src="/player/account-banner.png"
            alt=""
            fill
            priority
            sizes="(min-width: 900px) 40rem, 100vw"
            className="player-account__banner-image"
          />
          <div className="player-account__banner-fade" />
        </div>

        <div className="player-account__panel">
          <div className="player-account__identity">
            <h2 className="player-account__name">{displayName || "League player"}</h2>
            <p className="player-account__email">{email}</p>
          </div>

          <p className="player-account__copy">
            Free league access lets you track standings and stats. Upgrade for full Vector scoring
            and features.
          </p>

          <Link href={SUBSCRIBE_PATH} className="player-account__cta">
            Upgrade to Vector
          </Link>

          <button
            type="button"
            className="player-account__sign-out"
            onClick={() => {
              void (async () => {
                await signOut();
                resetPlayerUpgradeModalForLogin();
                router.push(PLAYER_LOGIN_PATH);
                router.refresh();
              })();
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </PlayerAppShell>
  );
}
