"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  LEAGUE_TEAM_COLORS,
  type CreateLeagueTeamInput,
} from "@/features/leagues/lib/league-teams";

type StagedTeam = {
  key: string;
  name: string;
  color: string;
};

interface CreateLeagueTeamModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (teams: CreateLeagueTeamInput[]) => Promise<void> | void;
}

export function CreateLeagueTeamModal({
  open,
  onClose,
  onConfirm,
}: CreateLeagueTeamModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(LEAGUE_TEAM_COLORS[0]);
  const [staged, setStaged] = useState<StagedTeam[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        setName("");
        setColor(LEAGUE_TEAM_COLORS[0]);
        setStaged([]);
        setSubmitting(false);
        setError(null);
      }
      return;
    }

    wasOpenRef.current = true;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  const stageTeam = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Enter a team name.");
      return;
    }

    const duplicate = staged.some(
      (entry) => entry.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (duplicate) {
      setError("That team is already staged.");
      return;
    }

    setStaged((current) => [
      ...current,
      {
        key: `stage-${Date.now()}-${current.length}`,
        name: trimmed,
        color,
      },
    ]);
    setName("");
    setError(null);
    setColor(
      LEAGUE_TEAM_COLORS[(staged.length + 1) % LEAGUE_TEAM_COLORS.length] ??
        LEAGUE_TEAM_COLORS[0],
    );
    inputRef.current?.focus();
  };

  const handleConfirm = async () => {
    const payload =
      staged.length > 0
        ? staged.map((entry) => ({ name: entry.name, color: entry.color }))
        : name.trim()
          ? [{ name: name.trim(), color }]
          : [];

    if (payload.length === 0) {
      setError("Add at least one team.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onConfirm(payload);
      onClose();
    } catch {
      setError("Unable to create teams.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Create Teams"
      onClose={onClose}
      className="league-player-modal create-venue-modal"
    >
      <div className="league-player-modal__body">
        <p className="league-player-modal__hint">
          Add one or more teams for this league. You can assign players next.
        </p>

        <label className="league-player-modal__field">
          <span className="league-player-modal__label">Team name</span>
          <input
            ref={inputRef}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                stageTeam();
              }
            }}
            className="setup-input"
            placeholder="e.g. Bull Chasers"
            maxLength={60}
            disabled={submitting}
          />
        </label>

        <div className="league-team-color-picker" role="group" aria-label="Team color">
          {LEAGUE_TEAM_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={
                color === swatch
                  ? "league-team-color-picker__swatch is-active"
                  : "league-team-color-picker__swatch"
              }
              style={{ backgroundColor: swatch }}
              aria-label={`Color ${swatch}`}
              aria-pressed={color === swatch}
              disabled={submitting}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>

        <TouchButton
          type="button"
          variant="secondary"
          disabled={submitting || !name.trim()}
          onClick={stageTeam}
        >
          Add to list
        </TouchButton>

        {staged.length > 0 ? (
          <ul className="league-team-staged">
            {staged.map((entry) => (
              <li key={entry.key}>
                <span
                  className="league-team-swatch"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden
                />
                <span>{entry.name}</span>
                <button
                  type="button"
                  className="league-team-staged__remove"
                  disabled={submitting}
                  onClick={() =>
                    setStaged((current) =>
                      current.filter((item) => item.key !== entry.key),
                    )
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p className="league-player-modal__error" role="alert">
            {error}
          </p>
        ) : null}

        <TouchButton
          type="button"
          variant="primary"
          disabled={submitting}
          onClick={() => void handleConfirm()}
        >
          {submitting
            ? "Creating…"
            : staged.length > 1
              ? `Create ${staged.length} Teams`
              : "Create Team"}
        </TouchButton>
      </div>
    </BottomSheet>
  );
}
