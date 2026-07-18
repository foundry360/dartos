"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  type LeaguePlayer,
  type UpdateLeaguePlayerInput,
} from "@/features/leagues/lib/league-players";

interface EditLeaguePlayerModalProps {
  open: boolean;
  player: LeaguePlayer | null;
  onClose: () => void;
  onSave: (input: UpdateLeaguePlayerInput) => Promise<void> | void;
}

export function EditLeaguePlayerModal({
  open,
  player,
  onClose,
  onSave,
}: EditLeaguePlayerModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !player) {
      return;
    }

    setFirstName(player.firstName);
    setLastName(player.lastName);
    setNickname(player.nickname ?? "");
    setEmail(player.email ?? "");
    setPhone(player.phone ?? "");
    setError(null);
    setSubmitting(false);
  }, [open, player]);

  const submit = async () => {
    const input: UpdateLeaguePlayerInput = {
      firstName,
      lastName,
      nickname,
      email,
      phone,
    };

    if (!input.firstName.trim() || !input.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSave(input);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update player.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      open={open && Boolean(player)}
      title="Edit Player"
      onClose={onClose}
      className="league-player-modal create-venue-modal"
    >
      <div className="league-player-modal__body">
        <p className="league-player-modal__hint">
          Update this player&apos;s league profile details.
        </p>

        <div className="league-player-form">
          <label className="league-player-form__field">
            <span>First Name</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
              disabled={submitting}
            />
          </label>
          <label className="league-player-form__field">
            <span>Last Name</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
              disabled={submitting}
            />
          </label>
          <label className="league-player-form__field">
            <span>Nickname</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Optional"
              disabled={submitting}
            />
          </label>
          <label className="league-player-form__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Optional"
              autoComplete="email"
              disabled={submitting}
            />
          </label>
          <label className="league-player-form__field">
            <span>Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Optional"
              autoComplete="tel"
              disabled={submitting}
            />
          </label>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="league-player-modal__actions">
          <TouchButton
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </TouchButton>
          <TouchButton
            type="button"
            size="lg"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
