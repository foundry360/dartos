import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import type {
  Bobs27GameState,
  Bobs27HistoryEntry,
  Bobs27MatchSetup,
  Bobs27PlayerState,
  Bobs27Target,
} from "@/types/bobs-27";
import type { Bobs27Callout } from "@/lib/bobs-27-callouts";
import type { DartHit } from "@/types/dart";

function clonePlayer(player: Bobs27PlayerState): Bobs27PlayerState {
  return { ...player };
}

export function doesHitMatchBobs27Target(hit: DartHit, target: Bobs27Target): boolean {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return false;
  }

  if (target.segment === "bull") {
    return hit.segment === "bull" && hit.multiplier === "double";
  }

  return hit.segment === target.segment && hit.multiplier === target.multiplier;
}

export function calculateBobs27VisitDelta(
  visitDarts: DartHit[],
  target: Bobs27Target,
): { delta: number; missed: boolean } {
  const matchingDarts = visitDarts.filter((dart) => doesHitMatchBobs27Target(dart, target));

  if (matchingDarts.length === 0) {
    return {
      delta: -target.penaltyValue,
      missed: true,
    };
  }

  return {
    delta: matchingDarts.reduce((total, dart) => total + dart.score, 0),
    missed: false,
  };
}

function resolveMatchWinner(players: Bobs27PlayerState[]): string {
  let bestIndex = 0;

  for (let index = 1; index < players.length; index += 1) {
    if (players[index]!.score > players[bestIndex]!.score) {
      bestIndex = index;
    }
  }

  return players[bestIndex]!.id;
}

function finishGame(state: Bobs27GameState, players: Bobs27PlayerState[]): Bobs27GameState {
  return {
    ...state,
    players,
    visitDarts: [],
    status: "finished",
    winnerId: resolveMatchWinner(players),
  };
}

function findNextActivePlayerIndex(
  players: Bobs27PlayerState[],
  fromIndex: number,
): number | null {
  const playerCount = players.length;

  for (let step = 1; step <= playerCount; step += 1) {
    const candidateIndex = (fromIndex + step) % playerCount;
    if (!players[candidateIndex]?.eliminated) {
      return candidateIndex;
    }
  }

  return null;
}

function resetVisitForPlayer(
  state: Bobs27GameState,
  players: Bobs27PlayerState[],
  playerIndex: number,
): Bobs27GameState {
  const player = players[playerIndex];
  if (!player) {
    return state;
  }

  return {
    ...state,
    players,
    currentPlayerIndex: playerIndex,
    visitDarts: [],
  };
}

function advanceAfterVisit(
  state: Bobs27GameState,
  players: Bobs27PlayerState[],
  fromIndex: number,
): Bobs27GameState {
  const nextIndex = findNextActivePlayerIndex(players, fromIndex);

  if (nextIndex == null) {
    return finishGame(state, players);
  }

  if (nextIndex !== state.roundStarterIndex) {
    return resetVisitForPlayer(state, players, nextIndex);
  }

  const nextRoundIndex = state.roundIndex + 1;
  if (nextRoundIndex >= state.targets.length) {
    return finishGame(state, players);
  }

  return resetVisitForPlayer(
    {
      ...state,
      players,
      roundIndex: nextRoundIndex,
      roundStarterIndex: nextIndex,
    },
    players,
    nextIndex,
  );
}

function applyVisitResult(
  state: Bobs27GameState,
  playerIndex: number,
): Bobs27GameState {
  const player = state.players[playerIndex];
  const target = state.targets[state.roundIndex];
  if (!player || !target || player.eliminated) {
    return state;
  }

  const { delta, missed } = calculateBobs27VisitDelta(state.visitDarts, target);
  const nextScore = player.score + delta;
  const eliminated =
    state.eliminationEnabled && nextScore <= 0 ? true : player.eliminated;

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      score: nextScore,
      eliminated,
      lastVisitDelta: delta,
      lastVisitMissed: missed,
    };
  });

  return advanceAfterVisit(state, updatedPlayers, playerIndex);
}

export function createBobs27Player(
  slot: Bobs27MatchSetup["players"][number],
  color: string,
  startingScore: number,
): Bobs27PlayerState {
  return {
    id: slot.id,
    name: slot.name,
    nickname: slot.nickname ?? null,
    color,
    profileId: slot.profileId,
    isGuest: slot.source === "guest",
    avatarUrl: slot.avatarUrl,
    score: startingScore,
    eliminated: false,
    lastVisitDelta: null,
    lastVisitMissed: false,
    playerKind: slot.source === "bot" ? "bot" : "human",
    botDifficultyId: slot.botDifficultyId,
  };
}

export function createBobs27Game(setup: Bobs27MatchSetup): Bobs27GameState {
  const players = setup.players.map((slot, index) =>
    createBobs27Player(
      slot,
      slot.color ?? "#6f9e24",
      setup.startingScore,
    ),
  );

  const starterIndex = resolveLegStarterIndex(setup.startingPlayerRule, {
    playerCount: players.length,
    legNumber: 1,
    coinTossStarterIndex: setup.coinTossStarterIndex,
  });

  return {
    startingScore: setup.startingScore,
    roundCount: setup.roundCount,
    targetTypeId: setup.targetTypeId,
    eliminationEnabled: setup.eliminationEnabled,
    playerMode: setup.playerMode,
    targets: setup.targets,
    startingPlayerRule: setup.startingPlayerRule,
    coinTossStarterIndex: setup.coinTossStarterIndex,
    players,
    roundIndex: 0,
    roundStarterIndex: starterIndex,
    currentPlayerIndex: starterIndex,
    visitDarts: [],
    history: [],
    status: "playing",
    isBotMatch: setup.isBotMatch ?? false,
  };
}

function buildHistoryRevert(state: Bobs27GameState): Omit<Bobs27GameState, "history"> {
  return {
    startingScore: state.startingScore,
    roundCount: state.roundCount,
    targetTypeId: state.targetTypeId,
    eliminationEnabled: state.eliminationEnabled,
    playerMode: state.playerMode,
    targets: state.targets,
    startingPlayerRule: state.startingPlayerRule,
    coinTossStarterIndex: state.coinTossStarterIndex,
    players: state.players.map(clonePlayer),
    roundIndex: state.roundIndex,
    roundStarterIndex: state.roundStarterIndex,
    currentPlayerIndex: state.currentPlayerIndex,
    visitDarts: [...state.visitDarts],
    status: state.status,
    winnerId: state.winnerId,
    matchId: state.matchId,
  };
}

export function applyBobs27Dart(state: Bobs27GameState, hit: DartHit): Bobs27GameState {
  if (state.status !== "playing") {
    return state;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.eliminated) {
    return state;
  }

  if (state.visitDarts.length >= DARTS_PER_VISIT) {
    return state;
  }

  const historyEntry: Bobs27HistoryEntry = {
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

export function finishBobs27Visit(state: Bobs27GameState): Bobs27GameState {
  if (state.status !== "playing" || state.visitDarts.length === 0) {
    return state;
  }

  if (state.visitDarts.length < DARTS_PER_VISIT) {
    return state;
  }

  return applyVisitResult(state, state.currentPlayerIndex);
}

export function undoBobs27Dart(state: Bobs27GameState): Bobs27GameState {
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

export function getBobs27CurrentTarget(state: Bobs27GameState): Bobs27Target | null {
  return state.targets[state.roundIndex] ?? null;
}

export function formatBobs27Progress(state: Bobs27GameState): string {
  const target = getBobs27CurrentTarget(state);
  if (!target) {
    return "Bob's 27";
  }

  const roundNumber = state.roundIndex + 1;
  const isFinalRound = roundNumber === state.targets.length;

  if (isFinalRound) {
    return `Final target — ${target.displayLabel}`;
  }

  return `Round ${roundNumber}/${state.targets.length} — ${target.displayLabel}`;
}

export function getBobs27DartboardHighlight(state: Bobs27GameState): {
  practiceTarget?: { segment: number | "bull"; multiplier: "single" | "double" | "triple" };
  practiceHighlightBulls?: boolean;
} {
  const target = getBobs27CurrentTarget(state);
  if (!target) {
    return {};
  }

  if (target.segment === "bull") {
    return {
      practiceTarget: {
        segment: "bull",
        multiplier: "double",
      },
    };
  }

  return {
    practiceTarget: {
      segment: target.segment,
      multiplier: target.multiplier,
    },
  };
}

function didCompleteRound(
  before: Bobs27GameState,
  after: Bobs27GameState,
  completedPlayerIndex: number,
): boolean {
  if (before.roundIndex !== after.roundIndex) {
    return true;
  }

  if (after.status !== "finished" || before.status === "finished") {
    return false;
  }

  const nextIndex = findNextActivePlayerIndex(before.players, completedPlayerIndex);
  return nextIndex === before.roundStarterIndex;
}

export function resolveBobs27TargetCalloutFromState(
  state: Bobs27GameState,
): Bobs27Callout | null {
  const target = getBobs27CurrentTarget(state);
  if (!target) {
    return null;
  }

  const roundNumber = state.roundIndex + 1;
  const isFinalRound = roundNumber === state.targets.length;

  if (isFinalRound && target.segment === "bull") {
    return { type: "final-target-bull" };
  }

  if (target.multiplier === "double" && typeof target.segment === "number") {
    return { type: "target-double", segment: target.segment };
  }

  return { type: "target", displayLabel: target.displayLabel };
}

export function resolveBobs27MatchStartAnnouncements(
  state: Bobs27GameState,
): Bobs27Callout[] {
  const announcements: Bobs27Callout[] = [
    { type: "starting-score", score: state.startingScore },
  ];

  const targetCallout = resolveBobs27TargetCalloutFromState(state);
  if (targetCallout) {
    announcements.push(targetCallout);
  }

  return announcements;
}

export function resolveBobs27AnnouncementsAfterVisit(
  before: Bobs27GameState,
  after: Bobs27GameState,
  completedPlayerIndex: number,
): Bobs27Callout[] {
  const announcements: Bobs27Callout[] = [];
  const beforePlayer = before.players[completedPlayerIndex];
  const afterPlayer = after.players[completedPlayerIndex];

  if (afterPlayer?.lastVisitMissed) {
    announcements.push({ type: "score-reduced" });
  }

  if (beforePlayer && afterPlayer && !beforePlayer.eliminated && afterPlayer.eliminated) {
    announcements.push({ type: "player-eliminated" });
  }

  const roundComplete = didCompleteRound(before, after, completedPlayerIndex);

  if (after.status === "finished" && after.winnerId) {
    if (roundComplete) {
      announcements.push({ type: "round-complete" });
    }

    const winnerIndex = after.players.findIndex((player) => player.id === after.winnerId);
    if (winnerIndex >= 0) {
      announcements.push({ type: "game-complete", playerNumber: winnerIndex + 1 });
    }

    return announcements;
  }

  if (roundComplete) {
    announcements.push({ type: "round-complete" });

    const nextTarget = resolveBobs27TargetCalloutFromState(after);
    if (nextTarget) {
      announcements.push(nextTarget);
    }
  }

  return announcements;
}
