export type GameShotOutcome = "leg" | "first-leg" | "match";

export const GAME_SHOT_CLIP_BASE_PATH = "/sounds/game-shot";

const GAME_SHOT_PHRASES: Record<GameShotOutcome, string> = {
  leg: "Game shot!",
  "first-leg": "Game shot and the first leg.",
  match: "Game shot and the match.",
};

const GAME_SHOT_SLUGS: Record<GameShotOutcome, string> = {
  leg: "game-shot",
  "first-leg": "game-shot-and-the-first-leg",
  match: "game-shot-and-the-match",
};

export function buildGameShotPhrase(outcome: GameShotOutcome): string {
  return GAME_SHOT_PHRASES[outcome];
}

export function buildGameShotClipPath(outcome: GameShotOutcome): string {
  return `${GAME_SHOT_CLIP_BASE_PATH}/${GAME_SHOT_SLUGS[outcome]}.wav`;
}

export function getGameShotClipEntries(): Array<{ slug: string; phrase: string }> {
  return (Object.keys(GAME_SHOT_PHRASES) as GameShotOutcome[]).map((outcome) => ({
    slug: GAME_SHOT_SLUGS[outcome],
    phrase: GAME_SHOT_PHRASES[outcome],
  }));
}

interface GameShotProgressState {
  legsPlayed: number;
  status: "setup" | "playing" | "finished";
}

export function resolveGameShotOutcome(
  before: GameShotProgressState,
  after: GameShotProgressState,
): GameShotOutcome | null {
  if (after.status === "finished") {
    return "match";
  }

  if (after.legsPlayed > before.legsPlayed) {
    return after.legsPlayed === 1 ? "first-leg" : "leg";
  }

  return null;
}
