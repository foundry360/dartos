"use client";

import { ClubCricketScoringView } from "@/features/match-scoring/components/ClubCricketScoringView";
import { ClubX01ScoringView } from "@/features/match-scoring/components/ClubX01ScoringView";
import { createCricketPlayer } from "@/features/cricket/lib/cricket-engine";
import { createX01Player } from "@/features/x01/lib/x01-engine";
import type { CricketGameState, CricketMarks } from "@/types/cricket";
import type { X01GameState } from "@/types/x01";
import type { DartHit } from "@/types/dart";

export type MarketingShotKind = "x01-301" | "cricket";

const noop = () => undefined;
const noopHit = (_hit: DartHit) => undefined;

function buildX01_301Game(): X01GameState {
  const playerA = createX01Player("p1", "Alex Rivera", "#6F9E24", 301, {
    nickname: "Alex",
    scoredIn: true,
  });
  const playerB = createX01Player("p2", "Jordan Blake", "#3B82F6", 301, {
    nickname: "Jordan",
    scoredIn: true,
  });

  playerA.remaining = 167;
  playerA.visitScores = [60, 45, 29];
  playerA.legsWon = 1;
  playerB.remaining = 221;
  playerB.visitScores = [40, 40];
  playerB.legsWon = 0;

  return {
    gameType: 301,
    players: [playerA, playerB],
    currentPlayerIndex: 0,
    visitDarts: [
      { segment: 20, multiplier: "triple", score: 60, label: "T20" },
      { segment: 19, multiplier: "single", score: 19, label: "19" },
    ],
    visitStartRemaining: 167,
    visitStartScoredIn: true,
    legsToWin: 3,
    setsToWin: 1,
    teamsEnabled: false,
    startingPlayerRule: "winner_previous_leg",
    inRule: "straight_in",
    outRule: "double_out",
    legsPlayed: 1,
    history: [],
    status: "playing",
    matchId: "marketing-x01-301",
  };
}

function marks(partial: Partial<CricketMarks>): CricketMarks {
  return {
    20: 0,
    19: 0,
    18: 0,
    17: 0,
    16: 0,
    15: 0,
    14: 0,
    13: 0,
    12: 0,
    11: 0,
    10: 0,
    bull: 0,
    ...partial,
  };
}

function buildCricketGame(): CricketGameState {
  const playerA = createCricketPlayer("p1", "Alex Rivera", "#6F9E24", {
    nickname: "Alex",
  });
  const playerB = createCricketPlayer("p2", "Jordan Blake", "#3B82F6", {
    nickname: "Jordan",
  });

  playerA.marks = marks({ 20: 3, 19: 3, 18: 2, 17: 1 });
  playerA.score = 40;
  playerA.legsWon = 1;
  playerB.marks = marks({ 20: 3, 19: 1, 18: 0, 17: 0, 16: 2 });
  playerB.score = 0;
  playerB.legsWon = 0;

  return {
    players: [playerA, playerB],
    currentPlayerIndex: 0,
    visitDarts: [
      { segment: 18, multiplier: "triple", score: 54, label: "T18" },
      { segment: 18, multiplier: "single", score: 18, label: "18" },
    ],
    history: [],
    variant: "classic",
    cutThroat: false,
    legsToWin: 3,
    setsToWin: 1,
    teamsEnabled: false,
    startingPlayerRule: "winner_previous_leg",
    legsPlayed: 1,
    status: "playing",
    matchId: "marketing-cricket",
  };
}

export function MarketingMatchShot({ kind }: { kind: MarketingShotKind }) {
  if (kind === "cricket") {
    return (
      <ClubCricketScoringView
        game={buildCricketGame()}
        onDartHit={noopHit}
        onMiss={noop}
        onUndo={noop}
        onConfirmTurn={noop}
        onLeave={noop}
        onOpenStats={noop}
        undoDisabled
        matchKindLabel="Casual Match"
      />
    );
  }

  return (
    <ClubX01ScoringView
      game={buildX01_301Game()}
      onDartHit={noopHit}
      onMiss={noop}
      onUndo={noop}
      onConfirmTurn={noop}
      onLeave={noop}
      onOpenStats={noop}
      undoDisabled
      matchKindLabel="Casual Match"
    />
  );
}
