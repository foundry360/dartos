"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  rotateLeagueJoinCode,
  updateLeagueRegistrationSettings,
} from "@/lib/supabase/queries/player-league-access";
import { playerInvitePath, PLAYER_LOGIN_PATH } from "@/lib/auth/routes";

type RegistrationMode = "invite_only" | "code" | "open";

interface LeagueRegistrationSettingsProps {
  leagueId: string;
  initialMode?: RegistrationMode | string | null;
  initialJoinCode?: string | null;
}

export function LeagueRegistrationSettings({
  leagueId,
  initialMode,
  initialJoinCode,
}: LeagueRegistrationSettingsProps) {
  const [mode, setMode] = useState<RegistrationMode>(
    initialMode === "code" || initialMode === "open" || initialMode === "invite_only"
      ? initialMode
      : "invite_only",
  );
  const [joinCode, setJoinCode] = useState(initialJoinCode ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialMode === "code" || initialMode === "open" || initialMode === "invite_only") {
      setMode(initialMode);
    }
    setJoinCode(initialJoinCode ?? "");
  }, [initialJoinCode, initialMode]);

  const persistMode = useCallback(
    async (nextMode: RegistrationMode) => {
      const supabase = createClient();
      if (!supabase) {
        setMessage("Supabase is not configured.");
        return;
      }

      setSaving(true);
      setMessage(null);

      try {
        const code = await updateLeagueRegistrationSettings(
          supabase,
          leagueId,
          nextMode,
          nextMode !== "invite_only",
        );
        setMode(nextMode);
        if (code) {
          setJoinCode(code);
        }
        setMessage("Registration settings saved.");
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Unable to save settings.");
      } finally {
        setSaving(false);
      }
    },
    [leagueId],
  );

  const handleRotate = async () => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const code = await rotateLeagueJoinCode(supabase, leagueId);
      setJoinCode(code);
      setMessage("Join code rotated.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to rotate code.");
    } finally {
      setSaving(false);
    }
  };

  const playerLoginHint = `${typeof window !== "undefined" ? window.location.origin : ""}${PLAYER_LOGIN_PATH}`;

  return (
    <section className="league-detail-card" style={{ marginBottom: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>Player registration</h3>
      <p style={{ color: "var(--muted-foreground)", marginTop: 0 }}>
        Free league players sign in at {playerLoginHint}. Invite them, share a join code, or allow
        open discovery.
      </p>

      <label style={{ display: "grid", gap: "0.35rem", marginBottom: "0.85rem" }}>
        <span>Registration mode</span>
        <select
          value={mode}
          disabled={saving}
          onChange={(event) => void persistMode(event.target.value as RegistrationMode)}
        >
          <option value="invite_only">Invite only</option>
          <option value="code">Join code</option>
          <option value="open">Open (searchable)</option>
        </select>
      </label>

      {mode !== "invite_only" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "center" }}>
          <code style={{ fontSize: "1.05rem", letterSpacing: "0.08em" }}>
            {joinCode || "—"}
          </code>
          <button type="button" disabled={saving || !joinCode} onClick={() => {
            if (joinCode) {
              void navigator.clipboard.writeText(joinCode);
              setMessage("Join code copied.");
            }
          }}>
            Copy code
          </button>
          <button type="button" disabled={saving} onClick={() => void handleRotate()}>
            Rotate code
          </button>
        </div>
      ) : null}

      <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
        Invite links look like{" "}
        <code>{playerInvitePath("…token…")}</code>
      </p>

      {message ? <p style={{ marginBottom: 0 }}>{message}</p> : null}
    </section>
  );
}
