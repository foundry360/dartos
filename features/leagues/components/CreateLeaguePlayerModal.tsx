"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  type CreateLeaguePlayerInput,
} from "@/features/leagues/lib/league-players";

interface CreateLeaguePlayerModalProps {
  open: boolean;
  onClose: () => void;
  seedName?: string;
  onCreate: (input: CreateLeaguePlayerInput) => Promise<void> | void;
}

function splitSeedName(seed: string): { firstName: string; lastName: string } {
  const parts = seed.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function CreateLeaguePlayerModal({
  open,
  onClose,
  seedName = "",
  onCreate,
}: CreateLeaguePlayerModalProps) {
  const seeded = splitSeedName(seedName);
  const [firstName, setFirstName] = useState(seeded.firstName);
  const [lastName, setLastName] = useState(seeded.lastName);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const next = splitSeedName(seedName);
    setFirstName(next.firstName);
    setLastName(next.lastName);
    setNickname("");
    setEmail("");
    setPhone("");
    setError(null);
    setSubmitting(false);
  }, [open, seedName]);

  const submit = async () => {
    const input: CreateLeaguePlayerInput = {
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
      await onCreate(input);
      onClose();
    } catch {
      setError("Unable to create player.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Create New Player"
      onClose={onClose}
      className="league-player-modal create-venue-modal"
    >
      <div className="league-player-modal__body">
        <p className="league-player-modal__hint">
          Creates a league player profile. No Vector account, subscription, or
          login is required.
        </p>

        <div className="league-player-form">
          <label className="league-player-form__field">
            <span>First Name</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />
          </label>
          <label className="league-player-form__field">
            <span>Last Name</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
            />
          </label>
          <label className="league-player-form__field">
            <span>Nickname</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Optional"
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
            />
          </label>
          <p className="league-player-form__note">
            Profile image upload coming soon — players can use initials for now.
          </p>
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
            {submitting ? "Creating…" : "Create League Player Profile"}
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
