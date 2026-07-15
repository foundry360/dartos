"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { CreateLeagueTeamModal } from "@/features/leagues/components/CreateLeagueTeamModal";
import { LeagueTeamDetailDrawer } from "@/features/leagues/components/LeagueTeamDetailDrawer";
import {
  LeagueTeamCheckbox,
  LeagueTeamRowMenu,
} from "@/features/leagues/components/LeagueTeamRowMenu";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import {
  leaguePlayerDisplayName,
} from "@/features/leagues/lib/league-players";
import {
  LEAGUE_TEAM_STATUS_LABEL,
  leagueTeamRecord,
  type LeagueTeam,
} from "@/features/leagues/lib/league-teams";
import { cn } from "@/utils/cn";

type TeamFilter = "all" | "active" | "inactive";

const FILTERS: Array<{ id: TeamFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

interface LeagueDetailTeamsProps {
  leagueId: string;
}

export function LeagueDetailTeams({ leagueId }: LeagueDetailTeamsProps) {
  const {
    teams,
    loading,
    saving,
    error,
    createTeam,
    updateTeam,
    setTeamsStatus,
    removeTeams,
    bumpPlayerCount,
  } = useLeagueTeams(leagueId);
  const { players, assignTeam, saving: playersSaving } = useLeaguePlayers(leagueId);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TeamFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<LeagueTeam | null>(null);
  const [editName, setEditName] = useState("");
  const [assignTeamId, setAssignTeamId] = useState<string | null>(null);
  const [assignSelected, setAssignSelected] = useState<string[]>([]);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

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

  const detailTeam = teams.find((team) => team.id === detailId) ?? null;
  const assignTarget = teams.find((team) => team.id === assignTeamId) ?? null;
  const busy = saving || playersSaving;

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return teams.filter((team) => {
      if (filter !== "all" && team.status !== filter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return team.name.toLowerCase().includes(normalizedQuery);
    });
  }, [teams, filter, query]);

  const detailMembers = useMemo(() => {
    if (!detailTeam) {
      return [];
    }

    return players.filter((player) => player.teamId === detailTeam.id);
  }, [detailTeam, players]);

  const assignablePlayers = useMemo(() => {
    if (!assignTarget) {
      return [];
    }

    return players.filter(
      (player) => !player.teamId || player.teamId === assignTarget.id,
    );
  }, [assignTarget, players]);

  const allFilteredSelected =
    filteredTeams.length > 0 &&
    filteredTeams.every((team) => selectedIds.includes(team.id));

  const showToast = (message: string) => setToast(message);

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((entry) => entry !== id),
    );
  };

  const toggleAllFiltered = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredTeams.some((team) => team.id === id)),
      );
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      filteredTeams.forEach((team) => next.add(team.id));
      return [...next];
    });
  };

  const handleRemove = async (ids: string[]) => {
    try {
      await removeTeams(ids);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      if (detailId && ids.includes(detailId)) {
        setDetailId(null);
      }
      setRemoveIds([]);
      showToast(ids.length === 1 ? "Team deleted." : "Teams deleted.");
    } catch {
      showToast("Unable to delete teams.");
    }
  };

  const handleSetStatus = async (
    ids: string[],
    status: "active" | "inactive",
  ) => {
    try {
      await setTeamsStatus(ids, status);
      setSelectedIds([]);
      showToast(
        status === "active"
          ? ids.length === 1
            ? "Team marked active."
            : "Teams marked active."
          : ids.length === 1
            ? "Team marked inactive."
            : "Teams marked inactive.",
      );
    } catch {
      showToast("Unable to update team status.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editTeam) {
      return;
    }

    const nextName = editName.trim();
    if (!nextName) {
      showToast("Team name is required.");
      return;
    }

    try {
      await updateTeam(editTeam.id, { name: nextName });
      setEditTeam(null);
      showToast("Team updated.");
    } catch {
      showToast("Unable to update team.");
    }
  };

  const handleAssignPlayers = async () => {
    if (!assignTarget) {
      return;
    }

    const currentlyOnTeam = players
      .filter((player) => player.teamId === assignTarget.id)
      .map((player) => player.id);
    const toAdd = assignSelected.filter((id) => !currentlyOnTeam.includes(id));
    const toRemove = currentlyOnTeam.filter((id) => !assignSelected.includes(id));

    try {
      if (toAdd.length > 0) {
        await assignTeam(toAdd, {
          id: assignTarget.id,
          name: assignTarget.name,
        });
        bumpPlayerCount(assignTarget.id, toAdd.length);
      }

      if (toRemove.length > 0) {
        await assignTeam(toRemove, null);
        bumpPlayerCount(assignTarget.id, -toRemove.length);
      }

      setAssignTeamId(null);
      setAssignSelected([]);
      showToast(`Updated ${assignTarget.name} roster.`);
    } catch {
      showToast("Unable to assign players.");
    }
  };

  const openAssign = (team: LeagueTeam) => {
    setAssignTeamId(team.id);
    setAssignSelected(
      players
        .filter((player) => player.teamId === team.id)
        .map((player) => player.id),
    );
  };

  const body = loading ? (
    <section className="league-detail-card">
      <div className="league-empty league-empty--players">
        <p className="league-empty__title">Loading teams…</p>
      </div>
    </section>
  ) : teams.length === 0 ? (
    <section className="league-detail-card">
      <div className="league-empty league-empty--players">
        <p className="league-empty__title">No teams created yet.</p>
        <p className="league-empty__sub">
          Create teams for this league, then assign players from the roster.
        </p>
        <button
          type="button"
          className="league-btn league-btn--primary"
          onClick={() => setCreateOpen(true)}
        >
          Create Team
        </button>
      </div>
    </section>
  ) : (
    <section className="league-detail-card league-players-table-card">
      <div className="league-players__header">
        <h2 className="league-detail-card__title">Teams</h2>
      </div>

      <div className="league-players__toolbar">
        <div className="league-players__search-row">
          <label className="league-players__search">
            <span className="sr-only">Search teams</span>
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
              placeholder="Search teams"
            />
          </label>
          <p className="league-players__summary">
            {teams.length} team{teams.length === 1 ? "" : "s"}
            {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : null}
          </p>
        </div>

        <div className="league-players__filters-row">
          <div
            className="league-players__filters"
            role="tablist"
            aria-label="Filter teams"
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
            disabled={busy}
            onClick={() => setCreateOpen(true)}
          >
            Create Team
          </button>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="league-players-bulk">
          <span>{selectedIds.length} selected</span>
          <div className="league-players-bulk__actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSetStatus(selectedIds, "active")}
            >
              Mark Active
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSetStatus(selectedIds, "inactive")}
            >
              Mark Inactive
            </button>
            <button
              type="button"
              className="is-danger"
              disabled={busy}
              onClick={() => setRemoveIds(selectedIds)}
            >
              Delete Teams
            </button>
          </div>
        </div>
      ) : null}

      {filteredTeams.length === 0 ? (
        <div className="league-empty">
          <p className="league-empty__title">No matches</p>
          <p className="league-empty__sub">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="league-players-table-wrap">
          <table className="league-players-table">
            <colgroup>
              <col className="league-col-check" />
              <col className="league-col-player" />
              <col className="league-col-status" />
              <col className="league-col-matches" />
              <col className="league-col-record" />
              <col className="league-col-average" />
              <col className="league-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th className="league-players-table__check">
                  <LeagueTeamCheckbox
                    checked={allFilteredSelected}
                    onChange={toggleAllFiltered}
                    label="Select all visible teams"
                  />
                </th>
                <th>Team</th>
                <th>Status</th>
                <th>Players</th>
                <th>Record</th>
                <th>Matches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => {
                const selected = selectedIds.includes(team.id);

                return (
                  <tr
                    key={team.id}
                    className={cn(selected && "is-selected")}
                    onClick={() => setDetailId(team.id)}
                  >
                    <td
                      className="league-players-table__check"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <LeagueTeamCheckbox
                        checked={selected}
                        onChange={(checked) => toggleSelected(team.id, checked)}
                        label={`Select ${team.name}`}
                      />
                    </td>
                    <td>
                      <div className="league-players-table__player">
                        <span
                          className="league-team-avatar league-team-avatar--sm"
                          style={{ backgroundColor: team.color }}
                          aria-hidden
                        >
                          {team.name.trim().charAt(0).toUpperCase() || "T"}
                        </span>
                        <div>
                          <p className="league-players-table__name">{team.name}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "league-status-badge",
                          `league-status-badge--${team.status}`,
                        )}
                      >
                        <span className="league-status-badge__dot" aria-hidden />
                        {LEAGUE_TEAM_STATUS_LABEL[team.status]}
                      </span>
                    </td>
                    <td>{team.playerCount}</td>
                    <td>{leagueTeamRecord(team)}</td>
                    <td>{team.matchesPlayed}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <LeagueTeamRowMenu
                        disabled={busy}
                        onView={() => setDetailId(team.id)}
                        onEdit={() => {
                          setEditTeam(team);
                          setEditName(team.name);
                        }}
                        onAssignPlayers={() => openAssign(team)}
                        onToggleStatus={() =>
                          void handleSetStatus(
                            [team.id],
                            team.status === "active" ? "inactive" : "active",
                          )
                        }
                        statusLabel={
                          team.status === "active"
                            ? "Mark Inactive"
                            : "Mark Active"
                        }
                        onRemove={() => setRemoveIds([team.id])}
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

      <CreateLeagueTeamModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={async (inputs) => {
          for (const input of inputs) {
            await createTeam(input);
          }
          showToast(
            inputs.length === 1
              ? "1 team created."
              : `${inputs.length} teams created.`,
          );
        }}
      />

      <LeagueTeamDetailDrawer
        open={Boolean(detailTeam)}
        team={detailTeam}
        members={detailMembers}
        onClose={() => setDetailId(null)}
        onEdit={(team) => {
          setEditTeam(team);
          setEditName(team.name);
        }}
        onAssignPlayers={openAssign}
        onStatusChange={(team, active) =>
          void handleSetStatus([team.id], active ? "active" : "inactive")
        }
        onRemove={(team) => setRemoveIds([team.id])}
      />

      <ConfirmDialog
        open={removeIds.length > 0}
        title={removeIds.length > 1 ? "Delete teams?" : "Delete team?"}
        description="Players on these teams will become unassigned. You can recreate teams later."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={() => void handleRemove(removeIds)}
        onCancel={() => setRemoveIds([])}
      />

      <BottomSheet
        open={Boolean(editTeam)}
        title="Edit Team"
        onClose={() => setEditTeam(null)}
        className="league-player-modal"
      >
        <div className="league-player-modal__body">
          <label className="league-player-modal__field">
            <span className="league-player-modal__label">Team name</span>
            <input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="setup-input"
              maxLength={60}
              disabled={busy}
            />
          </label>
          <button
            type="button"
            className="league-btn league-btn--primary"
            disabled={busy || !editName.trim()}
            onClick={() => void handleSaveEdit()}
          >
            Save
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={Boolean(assignTarget)}
        title={assignTarget ? `Assign to ${assignTarget.name}` : "Assign Players"}
        onClose={() => {
          setAssignTeamId(null);
          setAssignSelected([]);
        }}
        className="league-player-modal"
      >
        <div className="league-player-modal__body">
          <p className="league-player-modal__hint">
            Select unassigned players or keep members already on this team.
          </p>
          {assignablePlayers.length === 0 ? (
            <p className="league-empty__sub">No available players to assign.</p>
          ) : (
            <ul className="league-team-assign-players">
              {assignablePlayers.map((player) => {
                const checked = assignSelected.includes(player.id);

                return (
                  <li key={player.id}>
                    <label className="league-team-assign-players__row">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setAssignSelected((current) =>
                            next
                              ? [...current, player.id]
                              : current.filter((id) => id !== player.id),
                          );
                        }}
                      />
                      <PlayerAvatar
                        name={leaguePlayerDisplayName(player)}
                        color={player.color}
                        avatarUrl={player.avatarUrl}
                        size="sm"
                      />
                      <span>{leaguePlayerDisplayName(player)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="league-btn league-btn--primary"
            disabled={busy}
            onClick={() => void handleAssignPlayers()}
          >
            Save assignments
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
