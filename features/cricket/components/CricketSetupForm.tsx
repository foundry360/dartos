"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { MIN_PLAYERS, MAX_PLAYERS } from "@/lib/constants";
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

function createSlot(index: number): PlayerSetupSlot {
  return {
    id: createSlotId(),
    name: `Player ${index + 1}`,
    source: "guest",
    teamId: index % 2,
  };
}

function createInitialSlots(count: number) {
  return Array.from({ length: count }, (_, index) => createSlot(index));
}

interface PlayerRowProps {
  index: number;
  slot: PlayerSetupSlot;
  canRemove: boolean;
  onChange: (patch: Partial<PlayerSetupSlot>) => void;
  onRemove: () => void;
}

function PlayerRow({
  index,
  slot,
  canRemove,
  onChange,
  onRemove,
}: PlayerRowProps) {
  const color = slot.color ?? PLAYER_COLORS[index % PLAYER_COLORS.length]!;

  return (
    <div className="player-row">
      <PlayerAvatar
        name={slot.name}
        color={color}
        avatarUrl={slot.avatarUrl}
        isGuest={slot.source === "guest" && !slot.avatarUrl}
      />

      <input
        value={slot.name}
        onChange={(event) =>
          onChange({
            name: event.target.value,
            source: "guest",
            profileId: undefined,
            color: undefined,
            avatarUrl: undefined,
          })
        }
        className="player-row__input"
        placeholder={`Player ${index + 1}`}
        aria-label={`Player ${index + 1} name`}
      />

      {canRemove ? (
        <button
          type="button"
          className="player-row__remove"
          onClick={onRemove}
          aria-label={`Remove player ${index + 1}`}
        >
          ×
        </button>
      ) : (
        <span className="player-row__spacer" aria-hidden />
      )}
    </div>
  );
}

interface TeamPlayersSectionProps {
  teamId: number;
  label: string;
  slots: PlayerSetupSlot[];
  canAdd: boolean;
  canRemovePlayer: boolean;
  onChange: (slotId: string, patch: Partial<PlayerSetupSlot>) => void;
  onRemove: (slotId: string) => void;
  onOpenAddSheet: (teamId: number) => void;
}

function TeamPlayersSection({
  teamId,
  label,
  slots,
  canAdd,
  canRemovePlayer,
  onChange,
  onRemove,
  onOpenAddSheet,
}: TeamPlayersSectionProps) {
  const teamEntries = slots
    .map((slot, slotIndex) => ({ slot, slotIndex }))
    .filter((entry) => entry.slot.teamId === teamId);

  return (
    <div className={cn("team-block", teamId === 1 && "team-block--second")}>
      <div className="team-block__header">{label}</div>

      {teamEntries.length === 0 ? (
        <p className="team-block__empty">No players yet</p>
      ) : (
        teamEntries.map(({ slot, slotIndex }) => (
          <PlayerRow
            key={slot.id}
            index={slotIndex}
            slot={slot}
            canRemove={canRemovePlayer}
            onChange={(patch) => onChange(slot.id, patch)}
            onRemove={() => onRemove(slot.id)}
          />
        ))
      )}

      {canAdd ? (
        <button
          type="button"
          className="settings-row settings-row--action team-block__add"
          onClick={() => onOpenAddSheet(teamId)}
        >
          <span className="settings-row__action-label">Add</span>
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
  const [playerMode, setPlayerMode] = useState<"individual" | "teams">("individual");
  const teamsEnabled = playerMode === "teams";
  const [startingPlayerRule, setStartingPlayerRule] =
    useState<CricketStartingPlayerRule>("winner_previous_leg");
  const [starterSheetOpen, setStarterSheetOpen] = useState(false);
  const [addPlayerSheetOpen, setAddPlayerSheetOpen] = useState(false);
  const [addPlayerSheetView, setAddPlayerSheetView] = useState<"pick" | "create">("pick");
  const [createProfileError, setCreateProfileError] = useState<string | null>(null);
  const [pendingAddTeamId, setPendingAddTeamId] = useState<number | null>(null);
  const pendingAddTeamIdRef = useRef<number | null>(null);
  const [coinTossOpen, setCoinTossOpen] = useState(false);
  const [coinTossStarterIndex, setCoinTossStarterIndex] = useState<number | null>(null);

  const resolvedSlots = useMemo(
    () =>
      slots.map((slot, index) => ({
        ...slot,
        name: slot.name.trim() || `Player ${index + 1}`,
      })),
    [slots],
  );

  const selectedStartingRule = STARTING_PLAYER_RULE_OPTIONS.find(
    (option) => option.id === startingPlayerRule,
  );

  const playersFooter = loading ? "Loading saved players..." : undefined;

  const openAddPlayerSheet = (teamId?: number) => {
    if (slots.length >= MAX_PLAYERS) {
      return;
    }

    const nextTeamId = teamId ?? null;
    pendingAddTeamIdRef.current = nextTeamId;
    setPendingAddTeamId(nextTeamId);
    setAddPlayerSheetView("pick");
    setCreateProfileError(null);
    setAddPlayerSheetOpen(true);
  };

  const closeAddPlayerSheet = () => {
    setAddPlayerSheetOpen(false);
    setAddPlayerSheetView("pick");
    setCreateProfileError(null);
    pendingAddTeamIdRef.current = null;
    setPendingAddTeamId(null);
  };

  const createProfileSlot = (
    profile: SavedPlayerProfile,
    teamId: number,
    index: number,
  ): PlayerSetupSlot => {
    const isGuestProfile = profile.id.startsWith("guest-");

    return {
      id: createSlotId(),
      name: profile.name,
      source: isGuestProfile ? "guest" : "profile",
      profileId: isGuestProfile ? undefined : profile.id,
      color: profile.color ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      teamId,
    };
  };

  const addSelectedProfile = (profile: SavedPlayerProfile) => {
    const targetTeamId = pendingAddTeamIdRef.current;

    setSlots((current) => {
      if (current.length >= MAX_PLAYERS) {
        return current;
      }

      const teamId = targetTeamId ?? current.length % 2;
      return [...current, createProfileSlot(profile, teamId, current.length)];
    });
    closeAddPlayerSheet();
  };

  const addGuestPlayer = () => {
    const targetTeamId = pendingAddTeamIdRef.current;

    setSlots((current) => {
      if (current.length >= MAX_PLAYERS) {
        return current;
      }

      return [
        ...current,
        {
          ...createSlot(current.length),
          teamId: targetTeamId ?? current.length % 2,
        },
      ];
    });
    closeAddPlayerSheet();
  };

  const handleCreateProfile = async (input: {
    name: string;
    nickname?: string;
    color: string | null;
  }) => {
    setCreateProfileError(null);

    try {
      const created = await createProfile(input);
      addSelectedProfile(created);
    } catch (caught) {
      setCreateProfileError(
        caught instanceof Error ? caught.message : "Unable to save player profile.",
      );
    }
  };

  const updateSlot = (slotId: string, patch: Partial<PlayerSetupSlot>) => {
    setSlots((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot)),
    );
  };

  const removePlayer = (slotId: string) => {
    setSlots((current) => {
      if (current.length <= MIN_PLAYERS) {
        return current;
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
    legsToWin,
    setsToWin,
    teamsEnabled,
    startingPlayerRule,
    players: resolvedSlots,
    coinTossStarterIndex: starterIndex,
  });

  const handleStart = () => {
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
                canRemovePlayer={slots.length > MIN_PLAYERS}
                onChange={updateSlot}
                onRemove={removePlayer}
                onOpenAddSheet={openAddPlayerSheet}
              />
              <TeamPlayersSection
                teamId={1}
                label="Team 2"
                slots={slots}
                canAdd={slots.length < MAX_PLAYERS}
                canRemovePlayer={slots.length > MIN_PLAYERS}
                onChange={updateSlot}
                onRemove={removePlayer}
                onOpenAddSheet={openAddPlayerSheet}
              />
            </div>
          ) : (
            <>
              {slots.map((slot, index) => (
                <PlayerRow
                  key={slot.id}
                  index={index}
                  slot={slot}
                  canRemove={slots.length > MIN_PLAYERS}
                  onChange={(patch) => updateSlot(slot.id, patch)}
                  onRemove={() => removePlayer(slot.id)}
                />
              ))}

              {slots.length < MAX_PLAYERS ? (
                <button
                  type="button"
                  className="settings-row settings-row--action"
                  onClick={() => openAddPlayerSheet()}
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
        <TouchButton fullWidth size="xl" onClick={handleStart}>
          Start Match
        </TouchButton>
      </div>

      <BottomSheet
        open={addPlayerSheetOpen}
        title={
          addPlayerSheetView === "create"
            ? "New player profile"
            : pendingAddTeamId == null
              ? "Add player"
              : `Add to Team ${pendingAddTeamId + 1}`
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
              <button
                type="button"
                className="sheet-option sheet-option--guest"
                onClick={addGuestPlayer}
              >
                <span className="player-picker__avatar player-picker__avatar--guest">
                  <TargetIcon className="player-picker__avatar-icon" />
                </span>
                <span className="sheet-option__text">
                  <span className="sheet-option__label">Guest player</span>
                  <span className="sheet-option__description">Add a new name manually</span>
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
                ) : profiles.length > 0 ? (
                  profiles.map((profile) => {
                    const color =
                      profile.color ?? PLAYER_COLORS[profile.name.length % PLAYER_COLORS.length]!;

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        className="sheet-option sheet-option--profile"
                        onClick={() => addSelectedProfile(profile)}
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
