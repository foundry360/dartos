import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import type {
  ShanghaiGameState,
  ShanghaiHistoryEntry,
  ShanghaiMatchSetup,
  ShanghaiPlayerState,
  ShanghaiRule,
  ShanghaiTarget,
  ShanghaiWinningMode,
} from "@/types/shanghai";
import type { ShanghaiCallout } from "@/lib/shanghai-callouts";
import type { DartHit } from "@/types/dart";

function clonePlayer(player: ShanghaiPlayerState): ShanghaiPlayerState {
  return { ...player };
}

export function doesHitMatchShanghaiTarget(hit: DartHit, target: ShanghaiTarget): boolean {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return false;
  }

  if (target.segment === "bull") {
    return hit.segment === "bull";
  }

  return hit.segment === target.segment;
}

export function calculateShanghaiVisitPoints(
  visitDarts: DartHit[],
  target: ShanghaiTarget,
): number {
  return visitDarts
    .filter((dart) => doesHitMatchShanghaiTarget(dart, target))
    .reduce((total, dart) => total + dart.score, 0);
}

export function detectShanghaiInVisit(visitDarts: DartHit[], target: ShanghaiTarget): boolean {
  if (target.segment === "bull") {
    return false;
  }

  let hasSingle = false;
  let hasDouble = false;
  let hasTriple = false;

  for (const dart of visitDarts) {
    if (!doesHitMatchShanghaiTarget(dart, target)) {
      continue;
    }

    if (dart.multiplier === "single") {
      hasSingle = true;
    } else if (dart.multiplier === "double") {
      hasDouble = true;
    } else if (dart.multiplier === "triple") {
      hasTriple = true;
    }
  }

  return hasSingle && hasDouble && hasTriple;
}

function resolveMatchWinner(players: ShanghaiPlayerState[]): string {
  let bestIndex = 0;

  for (let index = 1; index < players.length; index += 1) {
    if (players[index]!.score > players[bestIndex]!.score) {
      bestIndex = index;
    }
  }

  return players[bestIndex]!.id;
}

function shouldWinOnShanghai(
  shanghaiAchieved: boolean,
  shanghaiRule: ShanghaiRule,
  winningMode: ShanghaiWinningMode,
): boolean {
  if (!shanghaiAchieved) {
    return false;
  }

  if (winningMode === "race_to_shanghai") {
    return true;
  }

  return shanghaiRule === "instant_win";
}

function calculateVisitTotalPoints(
  visitPoints: number,
  shanghaiAchieved: boolean,
  shanghaiRule: ShanghaiRule,
): number {
  if (!shanghaiAchieved || shanghaiRule !== "bonus_points") {
    return visitPoints;
  }

  return visitPoints * 2;
}

function finishGameWithWinner(
  state: ShanghaiGameState,
  players: ShanghaiPlayerState[],
  winnerId: string,
): ShanghaiGameState {
  return {
    ...state,
    players,
    visitDarts: [],
    status: "finished",
    winnerId,
  };
}

function finishGame(state: ShanghaiGameState, players: ShanghaiPlayerState[]): ShanghaiGameState {
  return finishGameWithWinner(state, players, resolveMatchWinner(players));
}

function resetVisitForPlayer(
  state: ShanghaiGameState,
  players: ShanghaiPlayerState[],
  playerIndex: number,
): ShanghaiGameState {
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
  state: ShanghaiGameState,
  players: ShanghaiPlayerState[],
  fromIndex: number,
): ShanghaiGameState {
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
  state: ShanghaiGameState,
  playerIndex: number,
): ShanghaiGameState {
  const player = state.players[playerIndex];
  const target = state.targets[state.roundIndex];
  if (!player || !target) {
    return state;
  }

  const visitPoints = calculateShanghaiVisitPoints(state.visitDarts, target);
  const shanghaiAchieved = detectShanghaiInVisit(state.visitDarts, target);
  const totalPoints = calculateVisitTotalPoints(
    visitPoints,
    shanghaiAchieved,
    state.shanghaiRule,
  );

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      score: entry.score + totalPoints,
      lastVisitPoints: totalPoints,
      lastVisitShanghai: shanghaiAchieved,
    };
  });

  const winnerPlayer = updatedPlayers[playerIndex];
  if (
    winnerPlayer &&
    shouldWinOnShanghai(shanghaiAchieved, state.shanghaiRule, state.winningMode)
  ) {
    return finishGameWithWinner(state, updatedPlayers, winnerPlayer.id);
  }

  return advanceAfterVisit(state, updatedPlayers, playerIndex);
}

export function createShanghaiPlayer(
  slot: ShanghaiMatchSetup["players"][number],
  color: string,
  startingScore: number,
): ShanghaiPlayerState {
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
    lastVisitShanghai: false,
    playerKind: slot.source === "bot" ? "bot" : "human",
    botDifficultyId: slot.botDifficultyId,
  };
}

export function createShanghaiGame(setup: ShanghaiMatchSetup): ShanghaiGameState {
  const players = setup.players.map((slot, index) =>
    createShanghaiPlayer(
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
    gameLengthPreset: setup.gameLengthPreset,
    bullRoundIncluded: setup.bullRoundIncluded,
    shanghaiRule: setup.shanghaiRule,
    winningMode: setup.winningMode,
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

function buildHistoryRevert(state: ShanghaiGameState): Omit<ShanghaiGameState, "history"> {
  return {
    startingScore: state.startingScore,
    roundCount: state.roundCount,
    gameLengthPreset: state.gameLengthPreset,
    bullRoundIncluded: state.bullRoundIncluded,
    shanghaiRule: state.shanghaiRule,
    winningMode: state.winningMode,
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

export function applyShanghaiDart(state: ShanghaiGameState, hit: DartHit): ShanghaiGameState {
  if (state.status !== "playing") {
    return state;
  }

  if (state.visitDarts.length >= DARTS_PER_VISIT) {
    return state;
  }

  const historyEntry: ShanghaiHistoryEntry = {
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

export function finishShanghaiVisit(state: ShanghaiGameState): ShanghaiGameState {
  if (state.status !== "playing" || state.visitDarts.length === 0) {
    return state;
  }

  if (state.visitDarts.length < DARTS_PER_VISIT) {
    return state;
  }

  return applyVisitResult(state, state.currentPlayerIndex);
}

export function undoShanghaiDart(state: ShanghaiGameState): ShanghaiGameState {
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

export function getShanghaiCurrentTarget(state: ShanghaiGameState): ShanghaiTarget | null {
  return state.targets[state.roundIndex] ?? null;
}

export function formatShanghaiProgress(state: ShanghaiGameState): string {
  const target = getShanghaiCurrentTarget(state);
  if (!target) {
    return "Shanghai";
  }

  const roundNumber = state.roundIndex + 1;
  const isFinalRound = roundNumber === state.targets.length;

  if (isFinalRound && target.segment === "bull") {
    return "Final round — Bull";
  }

  if (isFinalRound) {
    return `Final round — Target ${target.displayLabel}`;
  }

  return `Round ${roundNumber} — Target ${target.displayLabel}`;
}

export function getShanghaiDartboardHighlight(state: ShanghaiGameState): {
  practiceHighlightSegment?: number | "bull";
  practiceHighlightBulls?: boolean;
} {
  const target = getShanghaiCurrentTarget(state);
  if (!target) {
    return {};
  }

  if (target.segment === "bull") {
    return { practiceHighlightBulls: true };
  }

  return { practiceHighlightSegment: target.segment };
}

function didCompleteRound(
  before: ShanghaiGameState,
  after: ShanghaiGameState,
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

export function resolveShanghaiRoundCalloutFromState(
  state: ShanghaiGameState,
): ShanghaiCallout | null {
  const target = getShanghaiCurrentTarget(state);
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

export function resolveShanghaiAnnouncementsAfterVisit(
  before: ShanghaiGameState,
  after: ShanghaiGameState,
  completedPlayerIndex: number,
): ShanghaiCallout[] {
  const announcements: ShanghaiCallout[] = [];
  const completedPlayer = after.players[completedPlayerIndex];

  if (completedPlayer?.lastVisitShanghai) {
    announcements.push({ type: "shanghai-achieved" });
  }

  const roundComplete = didCompleteRound(before, after, completedPlayerIndex);

  if (after.status === "finished" && after.winnerId) {
    if (roundComplete && !completedPlayer?.lastVisitShanghai) {
      announcements.push({ type: "round-complete" });
    }

    const winnerIndex = after.players.findIndex((player) => player.id === after.winnerId);
    if (winnerIndex >= 0) {
      announcements.push({ type: "player-wins", playerNumber: winnerIndex + 1 });
    }

    return announcements;
  }

  if (roundComplete) {
    announcements.push({ type: "round-complete" });

    const nextRound = resolveShanghaiRoundCalloutFromState(after);
    if (nextRound) {
      announcements.push(nextRound);
    }
  }

  return announcements;
}
