"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { signOut } from "@/features/auth/lib/auth-actions";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function AccountSettingsPanel() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const configured = isSupabaseConfigured();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <GlassPanel>
      <h3 className="settings-panel__subheading text-2xl font-bold">Account</h3>
      <p className="settings-panel__subdescription">
        Signed in as{" "}
        <span className="font-semibold text-foreground">
          {user?.email ?? "Unknown user"}
        </span>
      </p>
      {user?.user_metadata?.display_name ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Display name:{" "}
          <span className="font-semibold text-foreground">
            {String(user.user_metadata.display_name)}
          </span>
        </p>
      ) : null}

      {error ? <p className="auth-screen__error mt-4">{error}</p> : null}

      <TouchButton
        className="mt-4"
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
