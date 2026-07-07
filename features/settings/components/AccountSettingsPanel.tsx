"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { signOut } from "@/features/auth/lib/auth-actions";
import { getUserDisplayName } from "@/features/players/lib/account-player-profile";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function AccountSettingsPanel() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const displayName = useProfileStore((state) => state.displayName);
  const nickname = useProfileStore((state) => state.nickname);
  const configured = isSupabaseConfigured();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedName = getUserDisplayName(user, displayName);

  const handleSignOut = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await signOut();
      router.push(LOGIN_PATH);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign out.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!configured) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Account</h3>
        <p className="settings-panel__subdescription">
          Connect Supabase to enable sign-in and cloud sync for players and match history.
        </p>
      </GlassPanel>
    );
  }

  if (loading) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Account</h3>
        <p className="settings-panel__subdescription">Loading account…</p>
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Account</h3>
        <p className="settings-panel__subdescription">
          Sign in to sync your profile, saved players, and match history.
        </p>
        <Link href={LOGIN_PATH} className="mt-4 block">
          <TouchButton fullWidth size="lg">
            Sign in
          </TouchButton>
        </Link>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="space-y-4">
      <h3 className="settings-panel__subheading text-2xl font-bold">Account</h3>

      <div className="account-settings-profile">
        <ProfileAvatar
          user={user}
          displayName={resolvedName}
          className="account-settings-profile__avatar"
          interactive={false}
          onEdit={() => router.push("/profile")}
        />
        <div className="account-settings-profile__copy">
          <p className="account-settings-profile__name">{resolvedName}</p>
          {nickname ? (
            <p className="account-settings-profile__nickname">&ldquo;{nickname}&rdquo;</p>
          ) : null}
          {user.email ? <p className="account-settings-profile__email">{user.email}</p> : null}
        </div>
      </div>

      <Link href="/profile" className="block">
        <TouchButton variant="secondary" fullWidth>
          Edit profile
        </TouchButton>
      </Link>

      {error ? <p className="auth-screen__error">{error}</p> : null}

      <TouchButton
        variant="secondary"
        fullWidth
        disabled={submitting}
        onClick={() => void handleSignOut()}
      >
        {submitting ? "Signing out..." : "Sign out"}
      </TouchButton>
    </GlassPanel>
  );
}
