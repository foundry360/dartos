"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  type CreateLeaguePlayerInput,
  type LeaguePlayerDirectoryHit,
} from "@/features/leagues/lib/league-players";

type ModalView = "search" | "create";

export type StagedLeaguePlayer =
  | {
      key: string;
      kind: "directory";
      hit: LeaguePlayerDirectoryHit;
    }
  | {
      key: string;
      kind: "create";
      input: CreateLeaguePlayerInput;
      color: string;
    };

interface AddLeaguePlayerModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<LeaguePlayerDirectoryHit[]>;
  onConfirm: (staged: StagedLeaguePlayer[]) => Promise<void> | void;
}

function stagedDisplayName(entry: StagedLeaguePlayer) {
  if (entry.kind === "directory") {
    return `${entry.hit.firstName} ${entry.hit.lastName}`.trim();
  }

  return `${entry.input.firstName} ${entry.input.lastName}`.trim();
}

function stagedAvatar(entry: StagedLeaguePlayer) {
  if (entry.kind === "directory") {
    return {
      name: stagedDisplayName(entry),
      color: entry.hit.color,
      avatarUrl: entry.hit.avatarUrl,
    };
  }

  return {
    name: stagedDisplayName(entry),
    color: entry.color,
    avatarUrl: null as string | null,
  };
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

export function AddLeaguePlayerModal({
  open,
  onClose,
  onSearch,
  onConfirm,
}: AddLeaguePlayerModalProps) {
  const [view, setView] = useState<ModalView>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeaguePlayerDirectoryHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [staged, setStaged] = useState<StagedLeaguePlayer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const requestIdRef = useRef(0);
  const wasOpenRef = useRef(false);

  const stagedKeys = useMemo(() => {
    return new Set(
      staged.map((entry) =>
        entry.kind === "directory"
          ? `${entry.hit.kind}:${entry.hit.id}`
          : entry.key,
      ),
    );
  }, [staged]);

  const runSearch = useEffectEvent(async (nextQuery: string) => {
    const requestId = ++requestIdRef.current;
    setSearching(true);

    try {
      const hits = await onSearch(nextQuery);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setResults(hits);
    } catch (error) {
      console.error("Player directory search failed", error);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setSearching(false);
      }
    }
  });

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        requestIdRef.current += 1;
        setView("search");
        setQuery("");
        setResults([]);
        setStaged([]);
        setSearching(false);
        setSubmitting(false);
        setCreateError(null);
        setFirstName("");
        setLastName("");
        setNickname("");
        setEmail("");
        setPhone("");
      }
      return;
    }

    wasOpenRef.current = true;

    if (view !== "search") {
      return;
    }

    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, query ? 220 : 0);

    return () => {
      window.clearTimeout(handle);
      requestIdRef.current += 1;
    };
  }, [open, query, view]);

  const stageHit = (hit: LeaguePlayerDirectoryHit) => {
    const key = `${hit.kind}:${hit.id}`;
    if (stagedKeys.has(key)) {
      return;
    }

    setStaged((current) => [
      ...current,
      {
        key,
        kind: "directory",
        hit,
      },
    ]);
    setQuery("");
  };

  const openCreate = () => {
    const seeded = splitSeedName(query);
    setFirstName(seeded.firstName);
    setLastName(seeded.lastName);
    setNickname("");
    setEmail("");
    setPhone("");
    setCreateError(null);
    setView("create");
  };

  const stageCreatedPlayer = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setCreateError("First name and last name are required.");
      return;
    }

    const input: CreateLeaguePlayerInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname,
      email,
      phone,
    };

    setStaged((current) => [
      ...current,
      {
        key: `create:${Date.now()}:${input.firstName}:${input.lastName}`,
        kind: "create",
        input,
        color: "#68707C",
      },
    ]);
    setView("search");
    setQuery("");
    setCreateError(null);
  };

  const removeStaged = (key: string) => {
    setStaged((current) => current.filter((entry) => entry.key !== key));
  };

  const confirm = async () => {
    if (staged.length === 0 || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await onConfirm(staged);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <BottomSheet
      open={open}
      title={view === "create" ? "Create Player" : "Add Players"}
      onClose={onClose}
      className="league-player-modal"
    >
      <div className="league-player-modal__body">
        {view === "search" ? (
          <>
            <label className="league-player-modal__search">
              <span className="sr-only">Search players</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search league players, Vector users, or profiles"
                autoFocus
              />
            </label>

            <div className="league-player-modal__results">
              {searching ? (
                <p className="league-player-modal__empty">Searching…</p>
              ) : results.length === 0 ? (
                <p className="league-player-modal__empty">
                  {query.trim()
                    ? "No matching players."
                    : "Start typing to search players."}
                </p>
              ) : (
                <ul className="league-player-modal__result-list">
                  {results.map((hit) => {
                    const key = `${hit.kind}:${hit.id}`;
                    const alreadyStaged = stagedKeys.has(key);

                    return (
                      <li key={key}>
                        <button
                          type="button"
                          className={
                            alreadyStaged
                              ? "league-player-modal__result is-staged"
                              : "league-player-modal__result"
                          }
                          disabled={alreadyStaged || submitting}
                          onClick={() => stageHit(hit)}
                        >
                          <span className="league-player-modal__result-main">
                            <PlayerAvatar
                              name={`${hit.firstName} ${hit.lastName}`.trim()}
                              color={hit.color}
                              avatarUrl={hit.avatarUrl}
                              size="sm"
                            />
                            <span>
                              <strong className="league-player-modal__name-row">
                                {hit.firstName} {hit.lastName}
                                {hit.kind === "vector-user" ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src="/icon-192.png"
                                    alt="Vector account"
                                    title="Vector account"
                                    className="league-player-modal__vector-mark"
                                  />
                                ) : null}
                              </strong>
                              {hit.nickname ? (
                                <span className="league-player-modal__nick">
                                  &ldquo;{hit.nickname}&rdquo;
                                </span>
                              ) : null}
                            </span>
                          </span>
                          {alreadyStaged ? (
                            <span className="league-player-modal__kind">Added</span>
                          ) : hit.kind === "player-profile" ? (
                            <span className="league-player-modal__kind">Profile</span>
                          ) : hit.kind === "league-player" ? (
                            <span className="league-player-modal__kind">
                              League
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <button
              type="button"
              className="league-player-modal__create-link"
              onClick={openCreate}
              disabled={submitting}
            >
              Create new player
            </button>
          </>
        ) : (
          <>
            <div className="league-player-form">
              <label className="league-player-form__field">
                <span>First Name</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  autoFocus
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
            </div>

            {createError ? (
              <p className="text-sm text-danger">{createError}</p>
            ) : null}

            <div className="league-player-modal__actions league-player-modal__actions--row">
              <TouchButton
                type="button"
                variant="secondary"
                onClick={() => setView("search")}
                disabled={submitting}
              >
                Back
              </TouchButton>
              <TouchButton
                type="button"
                variant="primary"
                onClick={stageCreatedPlayer}
                disabled={submitting}
              >
                Add to list
              </TouchButton>
            </div>
          </>
        )}

        {staged.length > 0 ? (
          <div className="league-player-modal__staged">
            <div className="league-player-modal__staged-header">
              <h3>To add</h3>
              <span>{staged.length}</span>
            </div>
            <ul className="league-player-modal__staged-list">
              {staged.map((entry) => {
                const avatar = stagedAvatar(entry);

                return (
                  <li key={entry.key} className="league-player-modal__staged-row">
                    <PlayerAvatar
                      name={avatar.name}
                      color={avatar.color}
                      avatarUrl={avatar.avatarUrl}
                      size="sm"
                    />
                    <div className="league-player-modal__staged-copy">
                      <strong className="league-player-modal__name-row">
                        {stagedDisplayName(entry)}
                        {entry.kind === "directory" &&
                        entry.hit.kind === "vector-user" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src="/icon-192.png"
                            alt="Vector account"
                            title="Vector account"
                            className="league-player-modal__vector-mark"
                          />
                        ) : null}
                      </strong>
                      {entry.kind === "directory" &&
                      entry.hit.kind === "vector-user" ? null : (
                        <span>
                          {entry.kind === "directory"
                            ? entry.hit.kind === "league-player"
                              ? "League"
                              : "Profile"
                            : "New player"}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="league-player-modal__staged-remove"
                      aria-label={`Remove ${stagedDisplayName(entry)}`}
                      disabled={submitting}
                      onClick={() => removeStaged(entry.key)}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {view === "search" ? (
          <div className="league-player-modal__actions league-player-modal__actions--row">
            <TouchButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </TouchButton>
            <TouchButton
              type="button"
              variant="primary"
              disabled={staged.length === 0 || submitting}
              onClick={() => void confirm()}
            >
              {submitting
                ? "Adding…"
                : staged.length === 0
                  ? "Add to league"
                  : staged.length === 1
                    ? "Add 1 player"
                    : `Add ${staged.length} players`}
            </TouchButton>
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
