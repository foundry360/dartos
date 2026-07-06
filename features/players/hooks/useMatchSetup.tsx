"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { MIN_PLAYERS, MAX_PLAYERS } from "@/lib/constants";
import { useAuth } from "@/components/providers/AuthProvider";
import { TargetIcon } from "@/components/ui/AvatarPlaceholder";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CreatePlayerProfileForm } from "@/features/players/components/CreatePlayerProfileForm";
import { MatchPlayerRow, MatchTeamPlayersSection } from "@/features/players/components/MatchPlayerRow";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { TouchButton } from "@/components/ui/TouchButton";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  STARTING_PLAYER_RULE_OPTIONS,
} from "@/features/players/lib/starting-player";
import {
  DEFAULT_TEAM_NAMES,
  getTeamName,
} from "@/features/players/lib/team-display";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import {
  canRemovePlayers,
  createEmptySlot,
  createInitialSlots,
  createSlotId,
  getSlotColor,
  isGenericPlaceholderPlayerName,
  MATCH_PLAYER_COLORS,
  resolveFilledSlots,
} from "@/features/players/lib/player-setup-utils";
import type {
  MatchStartingPlayerRule,
  MatchTeamNames,
  PlayerSetupSlot,
  SavedPlayerProfile,
} from "@/types/player-setup";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";

interface UseMatchSetupOptions {
  onCoinTossStart: (starterIndex: number) => void | Promise<void>;
}

export function useMatchSetup({ onCoinTossStart }: UseMatchSetupOptions) {
  const { user } = useAuth();
  const { profiles, loading, saving, createProfile, isCloudConfigured } =
    useSavedPlayerProfiles();

  const [slots, setSlots] = useState<PlayerSetupSlot[]>(() => createInitialSlots(MIN_PLAYERS));
  const [playerMode, setPlayerMode] = useState<"individual" | "teams">("individual");
  const teamsEnabled = playerMode === "teams";
  const [teamNames, setTeamNames] = useState<MatchTeamNames>(() => [...DEFAULT_TEAM_NAMES]);
  const [startingPlayerRule, setStartingPlayerRule] =
    useState<MatchStartingPlayerRule>("winner_previous_leg");
  const [starterSheetOpen, setStarterSheetOpen] = useState(false);
  const [addPlayerSheetOpen, setAddPlayerSheetOpen] = useState(false);
  const [addPlayerSheetView, setAddPlayerSheetView] = useState<"pick" | "create" | "guest">("pick");
  const [createProfileError, setCreateProfileError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [pendingAddTeamId, setPendingAddTeamId] = useState<number | null>(null);
  const pendingSlotIdRef = useRef<string | null>(null);
  const pendingAddTeamIdRef = useRef<number | null>(null);
  const [coinTossOpen, setCoinTossOpen] = useState(false);
  const [coinTossFlipped, setCoinTossFlipped] = useState(false);
  const [coinTossStarterIndex, setCoinTossStarterIndex] = useState<number | null>(null);

  const resolvedSlots = useMemo(() => resolveFilledSlots(slots), [slots]);
  const canStart = resolvedSlots.length >= MIN_PLAYERS;

  const selectableProfiles = useMemo(
    () => profiles.filter((profile) => !isGenericPlaceholderPlayerName(profile.name)),
    [profiles],
  );

  const savedProfiles = useMemo(
    () => selectableProfiles.filter((profile) => !profile.id.startsWith("guest-")),
    [selectableProfiles],
  );

  const recentGuestNames = useMemo(
    () =>
      selectableProfiles
        .filter((profile) => profile.id.startsWith("guest-"))
        .map((profile) => profile.name)
        .slice(0, 5),
    [selectableProfiles],
  );

  const filteredGuestSuggestions = useMemo(() => {
    const query = guestName.trim().toLowerCase();
    const matches = !query
      ? recentGuestNames
      : recentGuestNames.filter((name) => name.toLowerCase().includes(query));

    return matches.slice(0, 5);
  }, [guestName, recentGuestNames]);

  const selectedStartingRule = STARTING_PLAYER_RULE_OPTIONS.find(
    (option) => option.id === startingPlayerRule,
  );

  const playersFooter = loading ? "Loading saved players..." : undefined;

  const pendingSlot = pendingSlotId
    ? slots.find((slot) => slot.id === pendingSlotId)
    : undefined;

  const pendingSlotLabel = useMemo(() => {
    if (!pendingSlotId) {
      return "player";
    }

    const slotIndex = slots.findIndex((slot) => slot.id === pendingSlotId);
    if (slotIndex === -1) {
      return "player";
    }

    if (teamsEnabled && pendingSlot) {
      const teamSlots = slots.filter((slot) => slot.teamId === pendingSlot.teamId);
      const teamIndex = teamSlots.findIndex((slot) => slot.id === pendingSlotId);
      return `Player ${teamIndex + 1}`;
    }

    return `Player ${slotIndex + 1}`;
  }, [pendingSlot, pendingSlotId, slots, teamsEnabled]);

  const resetAddPlayerSheetState = () => {
    setAddPlayerSheetView("pick");
    setCreateProfileError(null);
    setGuestName("");
  };

  const openAddPlayerSheet = (slotId: string, teamId?: number) => {
    pendingSlotIdRef.current = slotId;
    pendingAddTeamIdRef.current =
      teamId ?? slots.find((entry) => entry.id === slotId)?.teamId ?? null;
    setPendingSlotId(slotId);
    setPendingAddTeamId(pendingAddTeamIdRef.current);
    resetAddPlayerSheetState();
    setAddPlayerSheetOpen(true);
  };

  const openNewPlayerSheet = (teamId?: number) => {
    if (slots.length >= MAX_PLAYERS) {
      return;
    }

    pendingSlotIdRef.current = null;
    pendingAddTeamIdRef.current = teamId ?? null;
    setPendingSlotId(null);
    setPendingAddTeamId(teamId ?? null);
    resetAddPlayerSheetState();
    setAddPlayerSheetOpen(true);
  };

  const closeAddPlayerSheet = () => {
    setAddPlayerSheetOpen(false);
    resetAddPlayerSheetState();
    pendingSlotIdRef.current = null;
    pendingAddTeamIdRef.current = null;
    setPendingSlotId(null);
    setPendingAddTeamId(null);
  };

  const applyPlayerSelection = (selection: {
    name: string;
    nickname?: string | null;
    source: PlayerSetupSlot["source"];
    profileId?: string;
    color?: string;
    avatarUrl?: string;
  }) => {
    const slotId = pendingSlotIdRef.current;
    const targetTeamId = pendingAddTeamIdRef.current ?? slots.length % 2;

    setSlots((current) => {
      if (slotId) {
        const slotIndex = current.findIndex((slot) => slot.id === slotId);
        if (slotIndex === -1) {
          return current;
        }

        return current.map((slot, index) => {
          if (slot.id !== slotId) {
            return slot;
          }

          return {
            ...slot,
            name: selection.name,
            nickname: selection.nickname ?? null,
            source: selection.source,
            profileId: selection.profileId,
            color: selection.color ?? MATCH_PLAYER_COLORS[index % MATCH_PLAYER_COLORS.length],
            avatarUrl: selection.avatarUrl,
            filled: true,
          };
        });
      }

      if (current.length >= MAX_PLAYERS) {
        return current;
      }

      const index = current.length;
      return [
        ...current,
        {
          id: createSlotId(),
          name: selection.name,
          nickname: selection.nickname ?? null,
          source: selection.source,
          profileId: selection.profileId,
          color: selection.color ?? MATCH_PLAYER_COLORS[index % MATCH_PLAYER_COLORS.length],
          avatarUrl: selection.avatarUrl,
          teamId: targetTeamId,
          filled: true,
        },
      ];
    });
    closeAddPlayerSheet();
  };

  const fillSlot = (profile: SavedPlayerProfile) => {
    const isGuestProfile = profile.id.startsWith("guest-");

    applyPlayerSelection({
      name: profile.name,
      nickname: profile.nickname,
      source: isGuestProfile ? "guest" : "profile",
      profileId: isGuestProfile ? undefined : profile.id,
      color: profile.color ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
    });
  };

  const fillGuestSlot = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    applyPlayerSelection({
      name: trimmedName,
      source: "guest",
    });
  };

  const handleCreateProfile = async (input: {
    name: string;
    nickname?: string;
    color: string | null;
    avatarFile?: File | null;
  }) => {
    setCreateProfileError(null);

    try {
      const created = await createProfile(input);
      fillSlot(created);
    } catch (caught) {
      setCreateProfileError(
        caught instanceof Error ? caught.message : "Unable to save player profile.",
      );
    }
  };

  const removePlayer = (slotId: string) => {
    setSlots((current) => {
      if (current.length <= MIN_PLAYERS) {
        return current.map((slot, index) =>
          slot.id === slotId ? createEmptySlot(index, slot.teamId) : slot,
        );
      }

      return current.filter((slot) => slot.id !== slotId);
    });
  };

  const handlePlayerModeChange = (mode: "individual" | "teams") => {
    setPlayerMode(mode);

    if (mode === "teams") {
      setSlots((current) =>
        current.map((slot, index) => ({
          ...slot,
          teamId: index % 2,
        })),
      );
    }
  };

  const updateTeamName = (teamId: 0 | 1, name: string) => {
    setTeamNames((current) =>
      teamId === 0 ? [name, current[1]] : [current[0], name],
    );
  };

  const normalizedTeamNames = useMemo<MatchTeamNames>(
    () => [teamNames[0].trim() || DEFAULT_TEAM_NAMES[0], teamNames[1].trim() || DEFAULT_TEAM_NAMES[1]],
    [teamNames],
  );

  const openCoinTossSheet = () => {
    setCoinTossFlipped(false);
    setCoinTossStarterIndex(null);
    setCoinTossOpen(true);
  };

  const closeCoinTossSheet = () => {
    setCoinTossOpen(false);
    setCoinTossFlipped(false);
    setCoinTossStarterIndex(null);
  };

  const beginStart = (onStart: (starterIndex?: number) => void | Promise<void>) => {
    if (!canStart) {
      return;
    }

    if (startingPlayerRule === "coin_toss" && coinTossStarterIndex == null) {
      openCoinTossSheet();
      return;
    }

    void onStart(coinTossStarterIndex ?? undefined);
  };

  const confirmCoinTossStart = () => {
    if (coinTossStarterIndex == null) {
      return;
    }

    setCoinTossOpen(false);
    setCoinTossFlipped(false);
    void onCoinTossStart(coinTossStarterIndex);
  };

  const playersGroup = (
    <SettingsGroup
      title="Players"
      footer={playersFooter}
      tabs={
        <SegmentedTabs
          ariaLabel="Player mode"
          value={playerMode}
          onChange={handlePlayerModeChange}
          options={[
            { value: "individual", label: "Individual Players" },
            { value: "teams", label: "Teams" },
          ]}
        />
      }
    >
      {teamsEnabled ? (
        <div className="team-blocks">
          <MatchTeamPlayersSection
            teamId={0}
            name={teamNames[0]}
            onNameChange={(name) => updateTeamName(0, name)}
            slots={slots}
            canAdd={slots.length < MAX_PLAYERS}
            onAdd={openAddPlayerSheet}
            onRemove={removePlayer}
            onOpenAddSheet={openNewPlayerSheet}
          />
          <MatchTeamPlayersSection
            teamId={1}
            name={teamNames[1]}
            onNameChange={(name) => updateTeamName(1, name)}
            slots={slots}
            canAdd={slots.length < MAX_PLAYERS}
            onAdd={openAddPlayerSheet}
            onRemove={removePlayer}
            onOpenAddSheet={openNewPlayerSheet}
          />
        </div>
      ) : (
        <>
          {slots.map((slot, index) => (
            <MatchPlayerRow
              key={slot.id}
              placeholderLabel={`Player ${index + 1}`}
              slot={slot}
              color={slot.color ?? MATCH_PLAYER_COLORS[index % MATCH_PLAYER_COLORS.length]!}
              canRemove={canRemovePlayers(slots)}
              onAdd={() => openAddPlayerSheet(slot.id)}
              onRemove={() => removePlayer(slot.id)}
            />
          ))}

          {slots.length < MAX_PLAYERS ? (
            <button
              type="button"
              className="settings-row settings-row--action"
              onClick={() => openNewPlayerSheet()}
            >
              <span className="settings-row__action-label">Add player</span>
            </button>
          ) : null}
        </>
      )}
    </SettingsGroup>
  );

  const sheets = (
    <>
      <BottomSheet
        open={addPlayerSheetOpen}
        className={cn(addPlayerSheetView === "guest" && "app-modal--guest")}
        title={
          addPlayerSheetView === "create"
            ? "New player profile"
            : addPlayerSheetView === "guest"
              ? "Guest player"
              : pendingSlotId == null
                ? "Add player"
                : pendingAddTeamId == null
                  ? `Add ${pendingSlotLabel}`
                  : `Add ${pendingSlotLabel} · ${getTeamName(normalizedTeamNames, pendingAddTeamId)}`
        }
        onClose={closeAddPlayerSheet}
      >
        {addPlayerSheetView === "create" ? (
          <div className="sheet-form">
            {!user && isCloudConfigured ? (
              <div className="player-picker__sign-in">
                <p className="player-picker__status">
                  Sign in to save player profiles to your account.
                </p>
                <Link href={LOGIN_PATH}>
                  <TouchButton fullWidth size="lg">
                    Sign in
                  </TouchButton>
                </Link>
                <TouchButton
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={() => setAddPlayerSheetView("pick")}
                >
                  Back
                </TouchButton>
              </div>
            ) : (
              <CreatePlayerProfileForm
                submitting={saving}
                error={createProfileError}
                submitLabel="Save and add"
                onCancel={() => {
                  setAddPlayerSheetView("pick");
                  setCreateProfileError(null);
                }}
                onSubmit={handleCreateProfile}
              />
            )}
          </div>
        ) : addPlayerSheetView === "guest" ? (
          <div className="player-picker__guest-form">
            <label className="guest-name-input create-player-form__field">
              <span className="create-player-form__label">Guest name</span>
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                className="setup-input guest-name-input__field"
                placeholder="Enter guest name"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter" && guestName.trim()) {
                    fillGuestSlot(guestName);
                  }
                }}
              />
              {filteredGuestSuggestions.length > 0 ? (
                <div className="guest-name-input__recent create-player-form__field">
                  <span className="create-player-form__label">Recent guest players</span>
                  <div className="guest-name-input__suggestions sheet-options" role="listbox">
                    {filteredGuestSuggestions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        role="option"
                        className="sheet-option"
                        onClick={() => fillGuestSlot(name)}
                      >
                        <span className="sheet-option__text">
                          <span className="sheet-option__label">{name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </label>
            <div className="player-picker__guest-actions">
              <TouchButton
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => setAddPlayerSheetView("pick")}
              >
                Back
              </TouchButton>
              <TouchButton
                fullWidth
                size="lg"
                disabled={!guestName.trim()}
                onClick={() => fillGuestSlot(guestName)}
              >
                Add guest
              </TouchButton>
            </div>
          </div>
        ) : (
          <div className="player-picker">
            <div className="player-picker__actions">
              <button
                type="button"
                className="sheet-option sheet-option--guest"
                onClick={() => {
                  setGuestName("");
                  setAddPlayerSheetView("guest");
                }}
              >
                <span className="player-picker__avatar player-picker__avatar--guest">
                  <TargetIcon className="player-picker__avatar-icon" />
                </span>
                <span className="sheet-option__text sheet-option__text--grow">
                  <span className="sheet-option__label">Guest player</span>
                  <span className="sheet-option__description">
                    Play without saving a profile
                  </span>
                </span>
              </button>

              {isCloudConfigured && user ? (
                <button
                  type="button"
                  className="sheet-option sheet-option--guest"
                  onClick={() => {
                    setCreateProfileError(null);
                    setAddPlayerSheetView("create");
                  }}
                >
                  <span className="player-picker__avatar player-picker__avatar--guest">+</span>
                  <span className="sheet-option__text">
                    <span className="sheet-option__label">Create new profile</span>
                    <span className="sheet-option__description">Save to your account</span>
                  </span>
                </button>
              ) : null}
            </div>

            <div className="player-picker__saved">
              <div className="player-picker__saved-list">
                {loading ? (
                  <p className="player-picker__status player-picker__status--saved">
                    Loading saved players...
                  </p>
                ) : savedProfiles.length > 0 ? (
                  savedProfiles.map((profile) => {
                    const color =
                      profile.color ??
                      MATCH_PLAYER_COLORS[profile.name.length % MATCH_PLAYER_COLORS.length]!;

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        className="sheet-option sheet-option--profile"
                        onClick={() => fillSlot(profile)}
                      >
                        <PlayerAvatar
                          name={profile.name}
                          color={color}
                          avatarUrl={profile.avatarUrl}
                          isGuest={false}
                        />
                        <span className="sheet-option__text">
                          <span className="sheet-option__label">{profile.name}</span>
                          {profile.isAccountOwner ? (
                            <span className="sheet-option__description">Your profile</span>
                          ) : profile.nickname ? (
                            <span className="sheet-option__description">{profile.nickname}</span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="player-picker__status player-picker__status--saved">
                    No saved players yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        open={starterSheetOpen}
        title="Starting player"
        onClose={() => setStarterSheetOpen(false)}
      >
        <div className="sheet-options">
          {STARTING_PLAYER_RULE_OPTIONS.map((option) => {
            const selected = startingPlayerRule === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={cn("sheet-option", selected && "sheet-option--selected")}
                onClick={() => {
                  setStartingPlayerRule(option.id);
                  if (option.id !== "coin_toss") {
                    setCoinTossStarterIndex(null);
                    setCoinTossFlipped(false);
                  }
                  setStarterSheetOpen(false);
                }}
              >
                <span className="sheet-option__text">
                  <span className="sheet-option__label">{option.label}</span>
                  <span className="sheet-option__description">{option.description}</span>
                </span>
                {selected ? <span className="sheet-option__check" aria-hidden>✓</span> : null}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <BottomSheet
        open={coinTossOpen}
        title="Coin toss"
        className="app-modal--coin-toss"
        onClose={closeCoinTossSheet}
      >
        <div className={cn("sheet-coin-toss", coinTossFlipped && "sheet-coin-toss--pick")}>
          {!coinTossFlipped ? (
            <>
              <p className="sheet-coin-toss__copy">Flip to decide who starts leg 1.</p>
              <div className="sheet-coin-toss__actions">
                <TouchButton
                  size="xl"
                  fullWidth
                  onClick={() => {
                    setCoinTossFlipped(true);
                    setCoinTossStarterIndex(null);
                  }}
                >
                  Flip coin
                </TouchButton>
                <TouchButton variant="secondary" size="lg" fullWidth onClick={closeCoinTossSheet}>
                  Cancel
                </TouchButton>
              </div>
            </>
          ) : (
            <>
              <p className="sheet-coin-toss__copy">Who won the toss?</p>
              <div className="sheet-options sheet-coin-toss__options">
                {resolvedSlots.map((slot, index) => {
                  const slotIndex = slots.findIndex((entry) => entry.id === slot.id);
                  const selected = coinTossStarterIndex === index;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      className={cn(
                        "sheet-option sheet-option--profile",
                        selected && "sheet-option--selected",
                      )}
                      onClick={() => setCoinTossStarterIndex(index)}
                    >
                      <PlayerAvatar
                        name={slot.name}
                        color={getSlotColor(slot, Math.max(slotIndex, 0))}
                        avatarUrl={slot.avatarUrl}
                        isGuest={slot.source === "guest" && !slot.avatarUrl}
                      />
                      <span className="sheet-option__text">
                        <span className="sheet-option__label">{slot.name}</span>
                        {teamsEnabled && slot.teamId != null ? (
                          <span className="sheet-option__description">
                            {getTeamName(normalizedTeamNames, slot.teamId)}
                          </span>
                        ) : null}
                      </span>
                      {selected ? <span className="sheet-option__check" aria-hidden>✓</span> : null}
                    </button>
                  );
                })}
              </div>
              {coinTossStarterIndex != null ? (
                <p className="sheet-coin-toss__winner">
                  {resolvedSlots[coinTossStarterIndex]?.name ?? "Player"} starts leg 1
                </p>
              ) : null}
              <div className="sheet-coin-toss__actions">
                <TouchButton
                  size="xl"
                  fullWidth
                  disabled={coinTossStarterIndex == null}
                  onClick={confirmCoinTossStart}
                >
                  Start match
                </TouchButton>
                <TouchButton
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setCoinTossFlipped(false);
                    setCoinTossStarterIndex(null);
                  }}
                >
                  Flip again
                </TouchButton>
                <TouchButton variant="secondary" size="lg" fullWidth onClick={closeCoinTossSheet}>
                  Cancel
                </TouchButton>
              </div>
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );

  return {
    canStart,
    teamsEnabled,
    teamNames: normalizedTeamNames,
    startingPlayerRule,
    resolvedSlots,
    selectedStartingRule,
    playersGroup,
    sheets,
    setStarterSheetOpen,
    beginStart,
    coinTossOpen,
    coinTossStarterIndex,
  };
}
