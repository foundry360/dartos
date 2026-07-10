import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import type {
  HalveItGameState,
  HalveItHistoryEntry,
  HalveItMatchSetup,
  HalveItPlayerState,
  HalveItScoringMode,
  HalveItTarget,
} from "@/types/halve-it";
import type { HalveItCallout } from "@/lib/halve-it-callouts";
import type { DartHit } from "@/types/dart";

function clonePlayer(player: HalveItPlayerState): HalveItPlayerState {
  return { ...player };
}

export function doesHitMatchHalveItTarget(hit: DartHit, target: HalveItTarget): boolean {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return false;
  }

  if (target.segment === "bull") {
    return hit.segment === "bull";
  }

  if (hit.segment !== target.segment) {
    return false;
  }

  if (!target.multiplier) {
    return true;
  }

  return hit.multiplier === target.multiplier;
}

export function calculateHalveItVisitPoints(
  visitDarts: DartHit[],
  target: HalveItTarget,
  scoringMode: HalveItScoringMode,
): number {
  const matchingDarts = visitDarts.filter((dart) => doesHitMatchHalveItTarget(dart, target));

  if (matchingDarts.length === 0) {
    return 0;
  }

  if (scoringMode === "open") {
    return visitDarts.reduce((total, dart) => total + dart.score, 0);
  }

  return matchingDarts.reduce((total, dart) => total + dart.score, 0);
}

function resolveMatchWinner(players: HalveItPlayerState[]): string {
  let bestIndex = 0;

  for (let index = 1; index < players.length; index += 1) {
    if (players[index]!.score > players[bestIndex]!.score) {
      bestIndex = index;
    }
  }

  return players[bestIndex]!.id;
}

function finishGame(state: HalveItGameState, players: HalveItPlayerState[]): HalveItGameState {
  return {
    ...state,
    players,
    visitDarts: [],
    status: "finished",
    winnerId: resolveMatchWinner(players),
  };
}

function resetVisitForPlayer(
  state: HalveItGameState,
  players: HalveItPlayerState[],
  playerIndex: number,
): HalveItGameState {
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
  state: HalveItGameState,
  players: HalveItPlayerState[],
  fromIndex: number,
): HalveItGameState {
  const nextIndex = (fromIndex + 1) % players.length;

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
  state: HalveItGameState,
  playerIndex: number,
): HalveItGameState {
  const player = state.players[playerIndex];
  const target = state.targets[state.roundIndex];
  if (!player || !target) {
    return state;
  }

  const visitPoints = calculateHalveItVisitPoints(
    state.visitDarts,
    target,
    state.scoringMode,
  );
  const halved = visitPoints === 0;
  const nextScore = halved ? Math.floor(player.score / 2) : player.score + visitPoints;

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      score: nextScore,
      lastVisitPoints: visitPoints,
      lastVisitHalved: halved,
    };
  });

  return advanceAfterVisit(state, updatedPlayers, playerIndex);
}

export function createHalveItPlayer(
  slot: HalveItMatchSetup["players"][number],
  color: string,
  startingScore: number,
): HalveItPlayerState {
  return {
    id: slot.id,
    name: slot.name,
    nickname: slot.nickname ?? null,
    color,
    profileId: slot.profileId,
    isGuest: slot.source === "guest",
    avatarUrl: slot.avatarUrl,
    score: startingScore,
    lastVisitPoints: null,
    lastVisitHalved: false,
    playerKind: slot.source === "bot" ? "bot" : "human",
    botDifficultyId: slot.botDifficultyId,
  };
}

export function createHalveItGame(setup: HalveItMatchSetup): HalveItGameState {
  const players = setup.players.map((slot, index) =>
    createHalveItPlayer(
      slot,
      slot.color ?? "#84c126",
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
    targetSequenceId: setup.targetSequenceId,
    scoringMode: setup.scoringMode,
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

function buildHistoryRevert(state: HalveItGameState): Omit<HalveItGameState, "history"> {
  return {
    startingScore: state.startingScore,
    roundCount: state.roundCount,
    targetSequenceId: state.targetSequenceId,
    scoringMode: state.scoringMode,
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

export function applyHalveItDart(state: HalveItGameState, hit: DartHit): HalveItGameState {
  if (state.status !== "playing") {
    return state;
  }

  if (state.visitDarts.length >= DARTS_PER_VISIT) {
    return state;
  }

  const historyEntry: HalveItHistoryEntry = {
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

export function finishHalveItVisit(state: HalveItGameState): HalveItGameState {
  if (state.status !== "playing" || state.visitDarts.length === 0) {
    return state;
  }

  if (state.visitDarts.length < DARTS_PER_VISIT) {
    return state;
  }

  return applyVisitResult(state, state.currentPlayerIndex);
}

export function undoHalveItDart(state: HalveItGameState): HalveItGameState {
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

export function getHalveItCurrentTarget(state: HalveItGameState): HalveItTarget | null {
  return state.targets[state.roundIndex] ?? null;
}

export function formatHalveItProgress(state: HalveItGameState): string {
  const target = getHalveItCurrentTarget(state);
  if (!target) {
    return "Halve-It";
  }

  const roundNumber = state.roundIndex + 1;
  const isFinalRound = roundNumber === state.targets.length;

  if (isFinalRound) {
    return `Final round — ${target.displayLabel}`;
  }

  return `Round ${roundNumber}/${state.targets.length} — Target ${target.displayLabel}`;
}

export function getHalveItDartboardHighlight(state: HalveItGameState): {
  practiceHighlightSegment?: number | "bull";
  practiceTarget?: { segment: number | "bull"; multiplier: "single" | "double" | "triple" };
  practiceHighlightBulls?: boolean;
} {
  const target = getHalveItCurrentTarget(state);
  if (!target) {
    return {};
  }

  if (target.segment === "bull") {
    return { practiceHighlightBulls: true };
  }

  if (target.multiplier) {
    return {
      practiceTarget: {
        segment: target.segment,
        multiplier: target.multiplier,
      },
    };
  }

  return { practiceHighlightSegment: target.segment };
}

function didCompleteRound(
  before: HalveItGameState,
  after: HalveItGameState,
  completedPlayerIndex: number,
): boolean {
  if (before.roundIndex !== after.roundIndex) {
    return true;
  }

  if (after.status !== "finished" || before.status === "finished") {
    return false;
  }

  const nextIndex = (completedPlayerIndex + 1) % before.players.length;
  return nextIndex === before.roundStarterIndex;
}

export function resolveHalveItRoundCalloutFromState(
  state: HalveItGameState,
): HalveItCallout | null {
  const target = getHalveItCurrentTarget(state);
  if (!target) {
    return null;
  }

  const roundNumber = state.roundIndex + 1;
  const isFinalRound = roundNumber === state.targets.length;

  if (isFinalRound && target.segment === "bull") {
    return { type: "final-round-bull" };
  }

  return {
    type: "round",
    roundNumber,
    targetLabel: target.displayLabel,
    targetSegment: target.segment,
  };
}

export function resolveHalveItAnnouncementsAfterVisit(
  before: HalveItGameState,
  after: HalveItGameState,
  completedPlayerIndex: number,
): HalveItCallout[] {
  const announcements: HalveItCallout[] = [];
  const completedPlayer = after.players[completedPlayerIndex];

  if (completedPlayer?.lastVisitHalved) {
    announcements.push({ type: "score-halved" });
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

    const nextRound = resolveHalveItRoundCalloutFromState(after);
    if (nextRound) {
      announcements.push(nextRound);
    }
  }

  return announcements;
}
