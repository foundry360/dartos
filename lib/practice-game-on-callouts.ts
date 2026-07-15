export const PRACTICE_GAME_ON_CLIP_BASE_PATH = "/sounds/practice";

export function buildPracticeGameOnPhrase(gameTitle: string): string {
  const spoken = gameTitle
    .replace(/\s*·\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

  if (!spoken) {
    return "Game on.";
  }

  return `${spoken}. Game on.`;
}

export function buildPracticeGameOnSlug(gameTitle: string): string {
  const slug = gameTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug ? `game-on-${slug}` : "game-on";
}

export function buildPracticeGameOnClipPath(gameTitle: string): string {
  return `${PRACTICE_GAME_ON_CLIP_BASE_PATH}/${buildPracticeGameOnSlug(gameTitle)}.wav`;
}
