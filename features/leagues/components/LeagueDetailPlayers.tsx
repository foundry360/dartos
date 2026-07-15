"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { AddLeaguePlayerModal } from "@/features/leagues/components/AddLeaguePlayerModal";
import { LeaguePlayerDetailDrawer } from "@/features/leagues/components/LeaguePlayerDetailDrawer";
import {
  LeaguePlayerCheckbox,
  LeaguePlayerRowMenu,
} from "@/features/leagues/components/LeaguePlayerRowMenu";
import {
  LeagueStatusBadge,
  VectorAccountStatus,
} from "@/features/leagues/components/LeaguePlayerStatus";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import {
  formatLeagueAverage,
  leaguePlayerDisplayName,
  leaguePlayerRecord,
} from "@/features/leagues/lib/league-players";
import { cn } from "@/utils/cn";

type RosterFilter = "all" | "vector" | "guest" | "unassigned";

const FILTERS: Array<{ id: RosterFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "vector", label: "Vector" },
  { id: "guest", label: "Guest" },
  { id: "unassigned", label: "Unassigned" },
];

interface LeagueDetailPlayersProps {
  leagueId: string;
}

export function LeagueDetailPlayers({ leagueId }: LeagueDetailPlayersProps) {
  const {
    players,
    loading,
    saving,
    error,
    searchDirectory,
    createPlayer,
    addFromDirectory,
    removePlayers,
    assignTeam,
    sendInvites,
  } = useLeaguePlayers(leagueId);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RosterFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [customTeamName, setCustomTeamName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const teamOptions = useMemo(() => {
    const names = new Set<string>();

    for (const player of players) {
      const teamName = player.teamName?.trim();

      if (teamName) {
        names.add(teamName);
      }
    }

    return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [players]);

  useEffect(() => {
    setSelectedIds([]);
    setDetailId(null);
  }, [leagueId]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const detailPlayer = players.find((player) => player.id === detailId) ?? null;

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return players.filter((player) => {
      const isVector = player.vectorAccount === "connected";
      const unassigned = !player.teamName;

      if (filter === "vector" && !isVector) {
        return false;
      }
      if (filter === "guest" && isVector) {
        return false;
      }
      if (filter === "unassigned" && !unassigned) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        leaguePlayerDisplayName(player),
        player.nickname ?? "",
        player.teamName ?? "Unassigned",
        player.email ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [players, filter, query]);

  const allFilteredSelected =
    filteredPlayers.length > 0 &&
    filteredPlayers.every((player) => selectedIds.includes(player.id));

  const showToast = (message: string) => setToast(message);

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((entry) => entry !== id),
    );
  };

  const toggleAllFiltered = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredPlayers.some((player) => player.id === id)),
      );
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      filteredPlayers.forEach((player) => next.add(player.id));
      return [...next];
    });
  };

  const handleRemove = async (ids: string[]) => {
    try {
      await removePlayers(ids);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      if (detailId && ids.includes(detailId)) {
        setDetailId(null);
      }
      setRemoveIds([]);
      showToast(
        ids.length === 1
          ? "Player removed from league."
          : "Players removed from league.",
      );
    } catch {
      showToast("Unable to remove players.");
    }
  };

  const handleAssignTeam = async (ids: string[], teamName: string | null) => {
    try {
      await assignTeam(ids, teamName);
      setAssignIds([]);
      showToast(teamName ? `Assigned to ${teamName}.` : "Marked as Unassigned.");
    } catch {
      showToast("Unable to assign team.");
    }
  };

  const handleSendInvites = async (ids: string[]) => {
    try {
      await sendInvites(ids);
      setSelectedIds([]);
      showToast(ids.length === 1 ? "Invitation sent." : "Invitations sent.");
    } catch {
      showToast("Unable to send invitations.");
    }
  };

  const body = loading ? (
    <section className="league-detail-card">
      <div className="league-empty league-empty--players">
        <p className="league-empty__title">Loading players…</p>
      </div>
    </section>
  ) : players.length === 0 ? (
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <p className="league-empty__title">No players added yet.</p>
            <p className="league-empty__sub">
              Add existing Vector player profiles or create new league players to
              build your roster.
            </p>
            <button
              type="button"
              className="league-btn league-btn--primary"
              onClick={() => setAddOpen(true)}
            >
              Add Player
            </button>
          </div>
        </section>
      ) : (
        <section className="league-detail-card league-players-table-card">
          <div className="league-players__header">
            <h2 className="league-detail-card__title">Players</h2>
          </div>

          <div className="league-players__toolbar">
            <div className="league-players__search-row">
              <label className="league-players__search">
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
                  placeholder="Search players or teams"
                />
              </label>
              <p className="league-players__summary">
                {players.length} on roster
                {selectedIds.length > 0
                  ? ` · ${selectedIds.length} selected`
                  : null}
              </p>
            </div>

            <div className="league-players__filters-row">
              <div
                className="league-players__filters"
                role="tablist"
                aria-label="Filter players"
              >
                {FILTERS.map((option) => {
                  const active = filter === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={cn(
                        "league-players__filter",
                        active && "league-players__filter--active",
                      )}
                      onClick={() => setFilter(option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="league-btn league-btn--primary league-players__add"
                disabled={saving}
                onClick={() => setAddOpen(true)}
              >
                Add Player
              </button>
            </div>
          </div>

          {selectedIds.length > 0 ? (
            <div className="league-players-bulk">
              <span>{selectedIds.length} selected</span>
              <div className="league-players-bulk__actions">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setAssignIds(selectedIds)}
                >
                  Assign Team
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSendInvites(selectedIds)}
                >
                  Send Invitations
                </button>
                <button
                  type="button"
                  className="is-danger"
                  disabled={saving}
                  onClick={() => setRemoveIds(selectedIds)}
                >
                  Remove Players
                </button>
              </div>
            </div>
          ) : null}

          {filteredPlayers.length === 0 ? (
            <div className="league-empty">
              <p className="league-empty__title">No matches</p>
              <p className="league-empty__sub">
                Try a different search or filter.
              </p>
            </div>
          ) : (
            <div className="league-players-table-wrap">
              <table className="league-players-table">
                <colgroup>
                  <col className="league-col-check" />
                  <col className="league-col-player" />
                  <col className="league-col-team" />
                  <col className="league-col-status" />
                  <col className="league-col-vector" />
                  <col className="league-col-matches" />
                  <col className="league-col-record" />
                  <col className="league-col-average" />
                  <col className="league-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="league-players-table__check">
                      <LeaguePlayerCheckbox
                        checked={allFilteredSelected}
                        onChange={toggleAllFiltered}
                        label="Select all visible players"
                      />
                    </th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>League Status</th>
                    <th>Vector Account</th>
                    <th>Matches Played</th>
                    <th>Record</th>
                    <th>Average</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => {
                    const selected = selectedIds.includes(player.id);

                    return (
                      <tr
                        key={player.id}
                        className={cn(selected && "is-selected")}
                        onClick={() => setDetailId(player.id)}
                      >
                        <td
                          className="league-players-table__check"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <LeaguePlayerCheckbox
                            checked={selected}
                            onChange={(checked) =>
                              toggleSelected(player.id, checked)
                            }
                            label={`Select ${leaguePlayerDisplayName(player)}`}
                          />
                        </td>
                        <td>
                          <div className="league-players-table__player">
                            <PlayerAvatar
                              name={leaguePlayerDisplayName(player)}
                              color={player.color}
                              avatarUrl={player.avatarUrl}
                              size="sm"
                            />
                            <div>
                              <p className="league-players-table__name">
                                {leaguePlayerDisplayName(player)}
                              </p>
                              {player.nickname ? (
                                <p className="league-players-table__nickname">
                                  &ldquo;{player.nickname}&rdquo;
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="league-players-table__team">
                            {player.teamName ?? "Unassigned"}
                          </span>
                        </td>
                        <td>
                          <LeagueStatusBadge status={player.leagueStatus} />
                        </td>
                        <td>
                          <VectorAccountStatus state={player.vectorAccount} />
                        </td>
                        <td>{player.matchesPlayed}</td>
                        <td>{leaguePlayerRecord(player)}</td>
                        <td>{formatLeagueAverage(player.average)}</td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <LeaguePlayerRowMenu
                            onViewProfile={() => setDetailId(player.id)}
                            onEdit={() =>
                              showToast("Player editing is coming soon.")
                            }
                            onAssignTeam={() => setAssignIds([player.id])}
                            onSendInvitation={() =>
                              void handleSendInvites([player.id])
                            }
                            onRemove={() => setRemoveIds([player.id])}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      );

  return (
    <div className="league-players-admin">
      {toast ? <div className="league-players-toast">{toast}</div> : null}
      {error ? (
        <div className="league-players-toast" role="alert">
          {error}
        </div>
      ) : null}

      {body}

      <AddLeaguePlayerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSearch={searchDirectory}
        onConfirm={async (staged) => {
          let added = 0;

          for (const entry of staged) {
            if (entry.kind === "directory") {
              await addFromDirectory(entry.hit);
            } else {
              await createPlayer(entry.input);
            }
            added += 1;
          }

          showToast(
            added === 1
              ? "1 player added to the league."
              : `${added} players added to the league.`,
          );
        }}
      />

      <LeaguePlayerDetailDrawer
        open={Boolean(detailPlayer)}
        player={detailPlayer}
        onClose={() => setDetailId(null)}
        onEdit={() => showToast("Player editing is coming soon.")}
        onAssignTeam={(player) => setAssignIds([player.id])}
        onSendInvite={(player) => void handleSendInvites([player.id])}
        onRemove={(player) => setRemoveIds([player.id])}
      />

      <ConfirmDialog
        open={removeIds.length > 0}
        title={
          removeIds.length > 1 ? "Remove players from league?" : "Remove player?"
        }
        description="They will be removed from this league roster. You can add them again later."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={() => void handleRemove(removeIds)}
        onCancel={() => setRemoveIds([])}
      />

      <BottomSheet
        open={assignIds.length > 0}
        title="Assign Team"
        onClose={() => {
          setAssignIds([]);
          setCustomTeamName("");
        }}
        className="league-player-modal"
      >
        <div className="league-player-modal__body">
          <p className="league-player-modal__hint">
            Choose an existing team or create a new one.
          </p>
          <div className="league-team-assign">
            <button
              type="button"
              className="league-team-assign__option"
              disabled={saving}
              onClick={() => void handleAssignTeam(assignIds, null)}
            >
              Unassigned
            </button>
            {teamOptions.map((team) => (
              <button
                key={team}
                type="button"
                className="league-team-assign__option"
                disabled={saving}
                onClick={() => void handleAssignTeam(assignIds, team)}
              >
                {team}
              </button>
            ))}
          </div>
          <label className="league-player-modal__field">
            <span className="league-player-modal__label">New team name</span>
            <input
              value={customTeamName}
              onChange={(event) => setCustomTeamName(event.target.value)}
              className="setup-input"
              placeholder="e.g. Board Room A"
              maxLength={60}
              disabled={saving}
            />
          </label>
          <button
            type="button"
            className="league-btn league-btn--primary"
            disabled={saving || !customTeamName.trim()}
            onClick={() => {
              const nextTeam = customTeamName.trim();

              if (!nextTeam) {
                return;
              }

              void handleAssignTeam(assignIds, nextTeam).then(() => {
                setCustomTeamName("");
              });
            }}
          >
            Assign new team
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
