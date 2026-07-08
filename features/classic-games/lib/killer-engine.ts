import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import { formatKillerAssignedNumber } from "@/features/classic-games/lib/killer-config";
import type {
  KillerAssignedNumber,
  KillerGameState,
  KillerHistoryEntry,
  KillerHitRules,
  KillerMatchSetup,
  KillerNumberAssignment,
  KillerPlayerState,
} from "@/types/killer";
import type { KillerCallout } from "@/lib/killer-callouts";
import type { DartHit } from "@/types/dart";

function clonePlayer(player: KillerPlayerState): KillerPlayerState {
  return { ...player };
}

function lifeDeltaFromHit(hit: DartHit, hitRules: KillerHitRules): number {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return 0;
  }

  if (hitRules === "flat") {
    return 1;
  }

  if (hit.multiplier === "triple") {
    return 3;
  }

  if (hit.multiplier === "double") {
    return 2;
  }

  return 1;
}

function hitSegmentMatchesTarget(hit: DartHit, target: KillerAssignedNumber): boolean {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return false;
  }

  if (target === "bull") {
    return hit.segment === "bull";
  }

  return hit.segment === target;
}

function getAssignedNumbers(players: KillerPlayerState[]): KillerAssignedNumber[] {
  return players
    .map((player) => player.assignedNumber)
    .filter((value): value is KillerAssignedNumber => value != null);
}

function findOpponentForHit(
  players: KillerPlayerState[],
  attackerIndex: number,
  hit: DartHit,
  gameType: KillerGameState["gameType"],
): number | null {
  const attacker = players[attackerIndex];
  if (!attacker) {
    return null;
  }

  for (let index = 0; index < players.length; index += 1) {
    if (index === attackerIndex) {
      continue;
    }

    const opponent = players[index]!;
    if (opponent.eliminated || opponent.assignedNumber == null) {
      continue;
    }

    if (gameType === "team" && opponent.teamId === attacker.teamId) {
      continue;
    }

    if (hitSegmentMatchesTarget(hit, opponent.assignedNumber)) {
      return index;
    }
  }

  return null;
}

function countActivePlayers(players: KillerPlayerState[], gameType: KillerGameState["gameType"]): number {
  if (gameType === "team") {
    const activeTeams = new Set<number>();
    for (const player of players) {
      if (!player.eliminated) {
        activeTeams.add(player.teamId);
      }
    }
    return activeTeams.size;
  }

  return players.filter((player) => !player.eliminated).length;
}

function resolveWinner(players: KillerPlayerState[], gameType: KillerGameState["gameType"]): string {
  if (gameType === "team") {
    const survivingTeamId = players.find((player) => !player.eliminated)?.teamId;
    return players.find((player) => player.teamId === survivingTeamId)?.id ?? players[0]!.id;
  }

  return players.find((player) => !player.eliminated)?.id ?? players[0]!.id;
}

function finishGame(state: KillerGameState, players: KillerPlayerState[]): KillerGameState {
  return {
    ...state,
    players,
    visitDarts: [],
    status: "finished",
    winnerId: resolveWinner(players, state.gameType),
  };
}

function resetVisitForPlayer(
  state: KillerGameState,
  players: KillerPlayerState[],
  playerIndex: number,
): KillerGameState {
  return {
    ...state,
    players,
    currentPlayerIndex: playerIndex,
    visitDarts: [],
  };
}

function nextActivePlayerIndex(players: KillerPlayerState[], fromIndex: number): number {
  const playerCount = players.length;

  for (let offset = 1; offset <= playerCount; offset += 1) {
    const index = (fromIndex + offset) % playerCount;
    if (!players[index]!.eliminated) {
      return index;
    }
  }

  return fromIndex;
}

function advanceTurn(
  state: KillerGameState,
  players: KillerPlayerState[],
  fromIndex: number,
): KillerGameState {
  if (countActivePlayers(players, state.gameType) <= 1) {
    return finishGame(state, players);
  }

  const nextIndex = nextActivePlayerIndex(players, fromIndex);
  return resetVisitForPlayer(state, players, nextIndex);
}

function allNumbersAssigned(players: KillerPlayerState[]): boolean {
  return players.every((player) => player.assignedNumber != null);
}

function resolveAssignmentFromHit(
  hit: DartHit,
  targetRules: KillerGameState["targetRules"],
  takenNumbers: KillerAssignedNumber[],
): KillerAssignedNumber | null {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return null;
  }

  if (hit.segment === "bull") {
    if (targetRules !== "include_bull" || takenNumbers.includes("bull")) {
      return null;
    }

    return "bull";
  }

  if (typeof hit.segment !== "number" || hit.segment < 1 || hit.segment > 20) {
    return null;
  }

  if (takenNumbers.includes(hit.segment)) {
    return null;
  }

  return hit.segment;
}

function applyAssignmentDart(
  state: KillerGameState,
  playerIndex: number,
): KillerGameState {
  const player = state.players[playerIndex];
  const dart = state.visitDarts[0];
  if (!player || !dart) {
    return state;
  }

  const assigned = resolveAssignmentFromHit(
    dart,
    state.targetRules,
    getAssignedNumbers(state.players),
  );

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex || assigned == null) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      assignedNumber: assigned,
    };
  });

  const nextState: KillerGameState = {
    ...state,
    players: updatedPlayers,
  };

  if (allNumbersAssigned(updatedPlayers)) {
    nextState.phase = "playing";
  }

  return advanceTurn(nextState, updatedPlayers, playerIndex);
}

function applyPlayingDartEffect(
  players: KillerPlayerState[],
  playerIndex: number,
  hit: DartHit,
  hitRules: KillerHitRules,
  startingLives: number,
  gameType: KillerGameState["gameType"],
): { players: KillerPlayerState[]; visitDelta: number } {
  const player = players[playerIndex];
  if (!player || player.eliminated || player.assignedNumber == null) {
    return { players, visitDelta: 0 };
  }

  let visitDelta = 0;
  let updatedPlayers = players;

  if (hitSegmentMatchesTarget(hit, player.assignedNumber)) {
    const gain =
      hitRules === "classic"
        ? lifeDeltaFromHit(hit, hitRules)
        : player.isKiller
          ? 1
          : startingLives;
    updatedPlayers = updatedPlayers.map((entry, index) => {
      if (index !== playerIndex) {
        return entry;
      }

      const nextLives = entry.lives + gain;
      visitDelta += gain;

      return {
        ...clonePlayer(entry),
        isKiller: true,
        lives: nextLives,
      };
    });
  }

  const opponentIndex = findOpponentForHit(updatedPlayers, playerIndex, hit, gameType);
  if (opponentIndex != null) {
    const opponent = updatedPlayers[opponentIndex];
    if (opponent?.isKiller) {
      const damage = lifeDeltaFromHit(hit, hitRules);
      updatedPlayers = updatedPlayers.map((entry, index) => {
        if (index !== opponentIndex) {
          return entry;
        }

        const nextLives = Math.max(0, entry.lives - damage);
        visitDelta -= damage;

        return {
          ...clonePlayer(entry),
          lives: nextLives,
          eliminated: nextLives <= 0,
        };
      });
    }
  }

  return { players: updatedPlayers, visitDelta };
}

function applyPlayingVisit(
  state: KillerGameState,
  playerIndex: number,
): KillerGameState {
  let updatedPlayers = state.players;
  let totalVisitDelta = 0;

  for (const dart of state.visitDarts) {
    const result = applyPlayingDartEffect(
      updatedPlayers,
      playerIndex,
      dart,
      state.hitRules,
      state.startingLives,
      state.gameType,
    );
    updatedPlayers = result.players;
    totalVisitDelta += result.visitDelta;
  }

  updatedPlayers = updatedPlayers.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      lastVisitDelta: totalVisitDelta === 0 ? null : totalVisitDelta,
    };
  });

  return advanceTurn(
    {
      ...state,
      players: updatedPlayers,
    },
    updatedPlayers,
    playerIndex,
  );
}

function applyVisitResult(state: KillerGameState, playerIndex: number): KillerGameState {
  if (state.phase === "number_assignment") {
    return applyAssignmentDart(state, playerIndex);
  }

  return applyPlayingVisit(state, playerIndex);
}

export function createKillerPlayer(
  slot: KillerMatchSetup["players"][number],
  color: string,
  assignedNumber: KillerAssignedNumber | null,
  numberAssignment: KillerNumberAssignment,
): KillerPlayerState {
  return {
    id: slot.id,
    name: slot.name,
    nickname: slot.nickname ?? null,
    color,
    profileId: slot.profileId,
    isGuest: slot.source === "guest",
    avatarUrl: slot.avatarUrl,
    teamId: slot.teamId,
    assignedNumber: numberAssignment === "first_dart" ? null : assignedNumber,
    lives: 0,
    isKiller: false,
    eliminated: false,
    lastVisitDelta: null,
  };
}

export function createKillerGame(setup: KillerMatchSetup): KillerGameState {
  const players = setup.players.map((slot, index) =>
    createKillerPlayer(
      slot,
      slot.color ?? "#84c126",
      setup.playerNumbers[index] ?? null,
      setup.numberAssignment,
    ),
  );

  const starterIndex = resolveLegStarterIndex(setup.startingPlayerRule, {
    playerCount: players.length,
    legNumber: 1,
    coinTossStarterIndex: setup.coinTossStarterIndex,
  });

  return {
    gameType: setup.gameType,
    numberAssignment: setup.numberAssignment,
    startingLives: setup.startingLives,
    targetRules: setup.targetRules,
    hitRules: setup.hitRules,
    startingPlayerRule: setup.startingPlayerRule,
    coinTossStarterIndex: setup.coinTossStarterIndex,
    phase: setup.numberAssignment === "first_dart" ? "number_assignment" : "playing",
    players,
    currentPlayerIndex: starterIndex,
    visitDarts: [],
    history: [],
    status: "playing",
  };
}

function buildHistoryRevert(state: KillerGameState): Omit<KillerGameState, "history"> {
  return {
    gameType: state.gameType,
    numberAssignment: state.numberAssignment,
    startingLives: state.startingLives,
    targetRules: state.targetRules,
    hitRules: state.hitRules,
    startingPlayerRule: state.startingPlayerRule,
    coinTossStarterIndex: state.coinTossStarterIndex,
    phase: state.phase,
    players: state.players.map(clonePlayer),
    currentPlayerIndex: state.currentPlayerIndex,
    visitDarts: [...state.visitDarts],
    status: state.status,
    winnerId: state.winnerId,
    matchId: state.matchId,
  };
}

export function getKillerVisitLimit(state: KillerGameState): number {
  return state.phase === "number_assignment" ? 1 : DARTS_PER_VISIT;
}

export function applyKillerDart(state: KillerGameState, hit: DartHit): KillerGameState {
  if (state.status !== "playing") {
    return state;
  }

  const visitLimit = getKillerVisitLimit(state);
  if (state.visitDarts.length >= visitLimit) {
    return state;
  }

  const historyEntry: KillerHistoryEntry = {
    playerIndex: state.currentPlayerIndex,
    dart: hit,
    revert: buildHistoryRevert(state),
  };

  return {
    ...state,
    visitDarts: [...state.visitDarts, hit],
    history: [...state.history, historyEntry],
  };
}

export function finishKillerVisit(state: KillerGameState): KillerGameState {
  const visitLimit = getKillerVisitLimit(state);
  if (state.status !== "playing" || state.visitDarts.length === 0) {
    return state;
  }

  if (state.visitDarts.length < visitLimit) {
    return state;
  }

  return applyVisitResult(state, state.currentPlayerIndex);
}

export function undoKillerDart(state: KillerGameState): KillerGameState {
  if (state.history.length === 0) {
    return state;
  }

  const lastEntry = state.history.at(-1);
  if (!lastEntry) {
    return state;
  }

  return {
    ...lastEntry.revert,
    history: state.history.slice(0, -1),
  };
}

export function formatKillerProgress(state: KillerGameState): string {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    return "Killer";
  }

  if (state.phase === "number_assignment") {
    return "Throw to claim your number";
  }

  if (currentPlayer.assignedNumber != null) {
    return `Target ${formatKillerAssignedNumber(currentPlayer.assignedNumber)}`;
  }

  return "Killer";
}

export function getKillerDartboardHighlight(state: KillerGameState): {
  practiceHighlightSegment?: number | "bull";
  practiceHighlightBulls?: boolean;
} {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || state.phase !== "playing") {
    return {};
  }

  if (!currentPlayer.isKiller) {
    if (currentPlayer.assignedNumber == null) {
      return {};
    }

    if (currentPlayer.assignedNumber === "bull") {
      return { practiceHighlightBulls: true };
    }

    return { practiceHighlightSegment: currentPlayer.assignedNumber };
  }

  for (let index = 0; index < state.players.length; index += 1) {
    if (index === state.currentPlayerIndex) {
      continue;
    }

    const opponent = state.players[index]!;
    if (
      opponent.eliminated ||
      !opponent.isKiller ||
      opponent.assignedNumber == null ||
      (state.gameType === "team" && opponent.teamId === currentPlayer.teamId)
    ) {
      continue;
    }

    if (opponent.assignedNumber === "bull") {
      return { practiceHighlightBulls: true };
    }

    return { practiceHighlightSegment: opponent.assignedNumber };
  }

  return {};
}

export function resolveKillerAnnouncementsAfterVisit(
  before: KillerGameState,
  after: KillerGameState,
  completedPlayerIndex: number,
  visitDarts: DartHit[],
): KillerCallout[] {
  const announcements: KillerCallout[] = [];

  if (before.phase === "number_assignment") {
    const beforePlayer = before.players[completedPlayerIndex];
    const afterPlayer = after.players[completedPlayerIndex];

    if (
      afterPlayer &&
      beforePlayer?.assignedNumber == null &&
      afterPlayer.assignedNumber != null
    ) {
      announcements.push({
        type: "player-target",
        playerNumber: completedPlayerIndex + 1,
        target: afterPlayer.assignedNumber,
      });
    }

    if (after.phase === "playing") {
      announcements.push({ type: "player-numbers-assigned" });
    }

    return announcements;
  }

  let hadDoubleHit = false;

  for (let index = 0; index < after.players.length; index += 1) {
    const beforePlayer = before.players[index];
    const afterPlayer = after.players[index];

    if (!beforePlayer || !afterPlayer) {
      continue;
    }

    if (!beforePlayer.isKiller && afterPlayer.isKiller) {
      announcements.push({ type: "is-killer", playerNumber: index + 1 });
    }

    if (!beforePlayer.eliminated && afterPlayer.eliminated) {
      announcements.push({ type: "player-eliminated" });
    }
  }

  for (const dart of visitDarts) {
    if (before.hitRules !== "classic" || dart.multiplier !== "double") {
      continue;
    }

    const opponentIndex = findOpponentForHit(
      before.players,
      completedPlayerIndex,
      dart,
      before.gameType,
    );

    if (opponentIndex != null && before.players[opponentIndex]?.isKiller) {
      hadDoubleHit = true;
      break;
    }
  }

  if (hadDoubleHit) {
    announcements.push({ type: "double-hit" });
  }

  if (after.status === "finished" && after.winnerId) {
    const winnerIndex = after.players.findIndex((player) => player.id === after.winnerId);
    if (winnerIndex >= 0) {
      announcements.push({ type: "player-wins", playerNumber: winnerIndex + 1 });
    }
  }

  return announcements;
}
