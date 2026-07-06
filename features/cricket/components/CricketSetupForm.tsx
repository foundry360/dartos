"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { MIN_PLAYERS, MAX_PLAYERS } from "@/lib/constants";
import type { CricketVariant } from "@/lib/constants";
import { useAuth } from "@/components/providers/AuthProvider";
import { TargetIcon } from "@/components/ui/AvatarPlaceholder";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CreatePlayerProfileForm } from "@/features/players/components/CreatePlayerProfileForm";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { STARTING_PLAYER_RULE_OPTIONS } from "@/features/cricket/lib/starting-player";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import type {
  CricketMatchSetup,
  PlayerSetupSlot,
  SavedPlayerProfile,
} from "@/types/player-setup";
import type { CricketStartingPlayerRule } from "@/types/cricket";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";

const PLAYER_COLORS = [
  "#84c126",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
  "#6366f1",
] as const;

interface CricketSetupFormProps {
  legsToWin: number;
  setsToWin: number;
  onLegsChange: (legs: number) => void;
  onSetsChange: (sets: number) => void;
  onStart: (setup: CricketMatchSetup) => void | Promise<void>;
}

function createSlotId() {
  return `slot-${crypto.randomUUID()}`;
}

function createEmptySlot(index: number, teamId = index % 2): PlayerSetupSlot {
  return {
    id: createSlotId(),
    name: "",
    source: "guest",
    teamId,
    filled: false,
  };
}

function createInitialSlots(count: number) {
  return Array.from({ length: count }, (_, index) => createEmptySlot(index));
}

function isSlotFilled(slot: PlayerSetupSlot): boolean {
  return slot.filled === true;
}

function isGenericPlaceholderPlayerName(name: string): boolean {
  return /^player \d+$/i.test(name.trim());
}

function canRemovePlayers(slots: PlayerSetupSlot[]): boolean {
  return slots.length > MIN_PLAYERS;
}

function PlusIcon() {
  return (
    <svg
      className="player-row__action-icon"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 4v12M4 10h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="player-row__action-icon"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M4.5 6h11M8 6V4.75h4V6M7.25 9v5M10 9v5M12.75 9v5M6.25 6l.5 9.25c0 .69.56 1.25 1.25 1.25h4c.69 0 1.25-.56 1.25-1.25L13.75 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PlayerRowProps {
  placeholderLabel: string;
  slot: PlayerSetupSlot;
  color: string;
  canRemove: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

function PlayerRow({
  placeholderLabel,
  slot,
  color,
  canRemove,
  onAdd,
  onRemove,
}: PlayerRowProps) {
  const filled = isSlotFilled(slot);

  return (
    <div className="player-row">
      {filled ? (
        <PlayerAvatar
          name={slot.name}
          color={color}
          avatarUrl={slot.avatarUrl}
          isGuest={slot.source === "guest" && !slot.avatarUrl}
        />
      ) : (
        <span className="player-avatar player-avatar--guest" aria-hidden>
          <TargetIcon className="player-avatar__icon" />
        </span>
      )}

      <span
        className={cn(
          "player-row__label",
          !filled && "player-row__label--placeholder",
        )}
      >
        {filled ? slot.name : placeholderLabel}
      </span>

      <div className="player-row__actions">
        {!filled ? (
          <button
            type="button"
            className="player-row__add"
            onClick={onAdd}
            aria-label={`Add ${placeholderLabel}`}
          >
            <PlusIcon />
          </button>
        ) : null}

        {canRemove ? (
          <button
            type="button"
            className="player-row__remove"
            onClick={onRemove}
            aria-label={
              filled ? `Remove ${slot.name}` : `Remove ${placeholderLabel}`
            }
          >
            <TrashIcon />
          </button>
        ) : !filled ? null : (
          <span className="player-row__spacer" aria-hidden />
        )}
      </div>
    </div>
  );
}

interface TeamPlayersSectionProps {
  teamId: number;
  label: string;
  slots: PlayerSetupSlot[];
  canAdd: boolean;
  onAdd: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onOpenAddSheet: (teamId: number) => void;
}

function TeamPlayersSection({
  teamId,
  label,
  slots,
  canAdd,
  onAdd,
  onRemove,
  onOpenAddSheet,
}: TeamPlayersSectionProps) {
  const teamEntries = slots
    .map((slot, slotIndex) => ({ slot, slotIndex }))
    .filter((entry) => entry.slot.teamId === teamId);

  return (
    <div className={cn("team-block", teamId === 1 && "team-block--second")}>
      <div className="team-block__header">{label}</div>

      {teamEntries.map(({ slot, slotIndex }) => (
        <PlayerRow
          key={slot.id}
          placeholderLabel={`Player ${slotIndex + 1}`}
          slot={slot}
          color={slot.color ?? PLAYER_COLORS[slotIndex % PLAYER_COLORS.length]!}
          canRemove={canRemovePlayers(slots)}
          onAdd={() => onAdd(slot.id)}
          onRemove={() => onRemove(slot.id)}
        />
      ))}

      {canAdd ? (
        <button
          type="button"
          className="settings-row settings-row--action team-block__add"
          onClick={() => onOpenAddSheet(teamId)}
        >
          <span className="settings-row__action-label">Add player</span>
        </button>
      ) : null}
    </div>
  );
}

export function CricketSetupForm({
  legsToWin,
  setsToWin,
  onLegsChange,
  onSetsChange,
  onStart,
}: CricketSetupFormProps) {
  const { user } = useAuth();
  const { profiles, loading, saving, createProfile, isCloudConfigured } =
    useSavedPlayerProfiles();
  const [slots, setSlots] = useState<PlayerSetupSlot[]>(() => createInitialSlots(MIN_PLAYERS));
  const [variant, setVariant] = useState<CricketVariant>("classic");
  const [playerMode, setPlayerMode] = useState<"individual" | "teams">("individual");
  const teamsEnabled = playerMode === "teams";
  const [startingPlayerRule, setStartingPlayerRule] =
    useState<CricketStartingPlayerRule>("winner_previous_leg");
  const [starterSheetOpen, setStarterSheetOpen] = useState(false);
  const [addPlayerSheetOpen, setAddPlayerSheetOpen] = useState(false);
  const [addPlayerSheetView, setAddPlayerSheetView] = useState<"pick" | "create">("pick");
  const [createProfileError, setCreateProfileError] = useState<string | null>(null);
  const [guestAccordionOpen, setGuestAccordionOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestNameMode, setGuestNameMode] = useState<"recent" | "custom">("custom");
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [pendingAddTeamId, setPendingAddTeamId] = useState<number | null>(null);
  const pendingSlotIdRef = useRef<string | null>(null);
  const pendingAddTeamIdRef = useRef<number | null>(null);
  const [coinTossOpen, setCoinTossOpen] = useState(false);
  const [coinTossStarterIndex, setCoinTossStarterIndex] = useState<number | null>(null);

  const resolvedSlots = useMemo(
    () =>
      slots
        .filter(isSlotFilled)
        .map((slot, index) => ({
          ...slot,
          name: slot.name.trim() || `Player ${index + 1}`,
        })),
    [slots],
  );

  const canStart = resolvedSlots.length >= MIN_PLAYERS;

  const selectableProfiles = useMemo(
    () => profiles.filter((profile) => !isGenericPlaceholderPlayerName(profile.name)),
    [profiles],
  );

  const recentGuestNames = useMemo(
    () =>
      selectableProfiles
        .filter((profile) => profile.id.startsWith("guest-"))
        .map((profile) => profile.name),
    [selectableProfiles],
  );

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
    setGuestAccordionOpen(false);
    setGuestName("");
    setGuestNameMode("custom");
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

  const resetGuestForm = () => {
    setGuestName("");
    setGuestNameMode(recentGuestNames.length > 0 ? "recent" : "custom");
    if (recentGuestNames.length > 0) {
      setGuestName(recentGuestNames[0]!);
    }
  };

  const toggleGuestAccordion = () => {
    setGuestAccordionOpen((open) => {
      if (!open) {
        resetGuestForm();
      }

      return !open;
    });
  };

  const closeGuestAccordion = () => {
    setGuestAccordionOpen(false);
    setGuestName("");
    setGuestNameMode("custom");
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
    const targetTeamId =
      pendingAddTeamIdRef.current ?? slots.length % 2;

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
            color:
              selection.color ?? PLAYER_COLORS[index % PLAYER_COLORS.length],
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
          color:
            selection.color ?? PLAYER_COLORS[index % PLAYER_COLORS.length],
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

  const handleGuestNameModeChange = (value: string) => {
    if (value === "__custom__") {
      setGuestNameMode("custom");
      setGuestName("");
      return;
    }

    setGuestNameMode("recent");
    setGuestName(value);
  };

  const submitGuestPlayer = () => {
    fillGuestSlot(guestName);
  };

  const handleCreateProfile = async (input: {
    name: string;
    nickname?: string;
    color: string | null;
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

  const buildSetup = (starterIndex?: number): CricketMatchSetup => ({
    variant,
    legsToWin,
    setsToWin,
    teamsEnabled,
    startingPlayerRule,
    players: resolvedSlots,
    coinTossStarterIndex: starterIndex,
  });

  const handleStart = () => {
    if (!canStart) {
      return;
    }

    if (startingPlayerRule === "coin_toss" && coinTossStarterIndex == null) {
      setCoinTossOpen(true);
      return;
    }

    void onStart(buildSetup(coinTossStarterIndex ?? undefined));
  };

  const handleCoinToss = () => {
    setCoinTossStarterIndex(Math.floor(Math.random() * resolvedSlots.length));
  };

  const handleConfirmCoinToss = () => {
    if (coinTossStarterIndex == null) {
      return;
    }

    setCoinTossOpen(false);
    void onStart(buildSetup(coinTossStarterIndex));
  };

  return (
    <div className="setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Format">
          <SettingsRow label="Match Style">
            <SegmentedTabs
              className="format-variant-toggle"
              ariaLabel="Cricket variant"
              value={variant}
              onChange={setVariant}
              options={[
                { value: "classic", label: "Cricket" },
                { value: "tactics", label: "Tactics" },
              ]}
            />
          </SettingsRow>
          <SettingsRow label="Legs per set">
            <StepperControl
              value={legsToWin}
              min={1}
              max={7}
              onChange={onLegsChange}
            />
          </SettingsRow>
          <SettingsRow label="Sets to win">
            <StepperControl
              value={setsToWin}
              min={1}
              max={5}
              onChange={onSetsChange}
            />
          </SettingsRow>
        </SettingsGroup>

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
              <TeamPlayersSection
                teamId={0}
                label="Team 1"
                slots={slots}
                canAdd={slots.length < MAX_PLAYERS}
                onAdd={openAddPlayerSheet}
                onRemove={removePlayer}
                onOpenAddSheet={openNewPlayerSheet}
              />
              <TeamPlayersSection
                teamId={1}
                label="Team 2"
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
                <PlayerRow
                  key={slot.id}
                  placeholderLabel={`Player ${index + 1}`}
                  slot={slot}
                  color={slot.color ?? PLAYER_COLORS[index % PLAYER_COLORS.length]!}
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

        <SettingsGroup title="Rules">
          <SettingsRow
            label="Starting player"
            value={selectedStartingRule?.label ?? "Winner of previous leg"}
            chevron
            onPress={() => setStarterSheetOpen(true)}
          />
        </SettingsGroup>
      </div>

      <div className="setup-screen__footer">
        <TouchButton fullWidth size="xl" onClick={handleStart} disabled={!canStart}>
          Start Match
        </TouchButton>
      </div>

      <BottomSheet
        open={addPlayerSheetOpen}
        title={
          addPlayerSheetView === "create"
            ? "New player profile"
            : pendingSlotId == null
              ? "Add player"
              : pendingAddTeamId == null
                ? `Add ${pendingSlotLabel}`
                : `Add ${pendingSlotLabel} · Team ${pendingAddTeamId + 1}`
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
        ) : (
          <div className="player-picker">
            <div className="player-picker__actions">
              <div className="player-picker__guest-accordion">
                <button
                  type="button"
                  className={cn(
                    "sheet-option sheet-option--guest",
                    guestAccordionOpen && "sheet-option--selected",
                  )}
                  aria-expanded={guestAccordionOpen}
                  onClick={toggleGuestAccordion}
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
                  <span
                    className={cn(
                      "player-picker__accordion-chevron-wrap",
                      guestAccordionOpen && "player-picker__accordion-chevron-wrap--open",
                    )}
                    aria-hidden
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>

                {guestAccordionOpen ? (
                  <div className="player-picker__guest-panel">
                    <label className="create-player-form__field">
                      <span className="create-player-form__label">Guest name</span>
                      {recentGuestNames.length > 0 ? (
                        <select
                          className="setup-input setup-input--select"
                          value={guestNameMode === "custom" ? "__custom__" : guestName}
                          onChange={(event) => handleGuestNameModeChange(event.target.value)}
                        >
                          <option value="__custom__">Enter name manually</option>
                          {recentGuestNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      {guestNameMode === "custom" || recentGuestNames.length === 0 ? (
                        <input
                          value={guestName}
                          onChange={(event) => setGuestName(event.target.value)}
                          className="setup-input"
                          placeholder="Enter guest name"
                          autoFocus
                        />
                      ) : null}
                    </label>

                    <div className="player-picker__guest-actions">
                      <TouchButton
                        variant="secondary"
                        fullWidth
                        size="lg"
                        onClick={closeGuestAccordion}
                      >
                        Back
                      </TouchButton>
                      <TouchButton
                        fullWidth
                        size="lg"
                        disabled={!guestName.trim()}
                        onClick={submitGuestPlayer}
                      >
                        Add guest
                      </TouchButton>
                    </div>
                  </div>
                ) : null}
              </div>

              {isCloudConfigured && user ? (
                <button
                  type="button"
                  className="sheet-option sheet-option--guest"
                  onClick={() => {
                    setCreateProfileError(null);
                    setGuestAccordionOpen(false);
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
                ) : selectableProfiles.length > 0 ? (
                  selectableProfiles.map((profile) => {
                    const color =
                      profile.color ?? PLAYER_COLORS[profile.name.length % PLAYER_COLORS.length]!;

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
                          isGuest={profile.id.startsWith("guest-")}
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

      <BottomSheet open={coinTossOpen} title="Coin toss" onClose={() => setCoinTossOpen(false)}>
        <div className="sheet-coin-toss">
          <p className="sheet-coin-toss__copy">Flip to decide who starts leg 1.</p>
          {coinTossStarterIndex != null ? (
            <p className="sheet-coin-toss__winner">
              {resolvedSlots[coinTossStarterIndex]?.name ?? "Player"} starts
            </p>
          ) : null}
          <div className="sheet-coin-toss__actions">
            {coinTossStarterIndex == null ? (
              <TouchButton size="xl" fullWidth onClick={handleCoinToss}>
                Flip coin
              </TouchButton>
            ) : (
              <TouchButton size="xl" fullWidth onClick={handleConfirmCoinToss}>
                Start match
              </TouchButton>
            )}
            <TouchButton
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => setCoinTossOpen(false)}
            >
              Cancel
            </TouchButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
