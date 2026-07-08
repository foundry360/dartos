export type TicTacToeCallout =
  | { type: "game-title" }
  | { type: "player-starts"; playerNumber: number }
  | { type: "targets-displayed" }
  | { type: "square-claimed" }
  | { type: "already-claimed" }
  | { type: "no-claim" }
  | { type: "three-in-a-row" }
  | { type: "player-wins"; playerNumber: number }
  | { type: "game-complete" };

export const TIC_TAC_TOE_CLIP_BASE_PATH = "/sounds/tic-tac-toe";

export const TIC_TAC_TOE_MAX_PLAYER_CLIP = 2;

export function buildGameTitlePhrase(): string {
  return "Tic Tac Toe";
}

export function buildGameTitleClipPath(): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/tic-tac-toe.wav`;
}

export function buildPlayerStartsPhrase(playerNumber: number): string {
  return `Player ${playerNumber} starts`;
}

export function buildPlayerStartsSlug(playerNumber: number): string {
  return `player-${playerNumber}-starts`;
}

export function buildPlayerStartsClipPath(playerNumber: number): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/${buildPlayerStartsSlug(playerNumber)}.wav`;
}

export function buildTargetsDisplayedPhrase(): string {
  return "Your targets are displayed";
}

export function buildTargetsDisplayedClipPath(): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/your-targets-are-displayed.wav`;
}

export function buildSquareClaimedPhrase(): string {
  return "Square claimed";
}

export function buildSquareClaimedClipPath(): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/square-claimed.wav`;
}

export function buildAlreadyClaimedPhrase(): string {
  return "Already claimed";
}

export function buildAlreadyClaimedClipPath(): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/already-claimed.wav`;
}

export function buildNoClaimPhrase(): string {
  return "No claim";
}

export function buildNoClaimClipPath(): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/no-claim.wav`;
}

export function buildThreeInARowPhrase(): string {
  return "Three in a row";
}

export function buildThreeInARowClipPath(): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/three-in-a-row.wav`;
}

export function buildPlayerWinsPhrase(playerNumber: number): string {
  return `Player ${playerNumber} wins`;
}

export function buildPlayerWinsSlug(playerNumber: number): string {
  return `player-${playerNumber}-wins`;
}

export function buildPlayerWinsClipPath(playerNumber: number): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/${buildPlayerWinsSlug(playerNumber)}.wav`;
}

export function buildGameCompletePhrase(): string {
  return "Game complete";
}

export function buildGameCompleteClipPath(): string {
  return `${TIC_TAC_TOE_CLIP_BASE_PATH}/game-complete.wav`;
}

export function canUsePlayerStartsClip(playerNumber: number): boolean {
  return playerNumber >= 1 && playerNumber <= TIC_TAC_TOE_MAX_PLAYER_CLIP;
}

export function canUsePlayerWinsClip(playerNumber: number): boolean {
  return playerNumber >= 1 && playerNumber <= TIC_TAC_TOE_MAX_PLAYER_CLIP;
}

export function getTicTacToePlayerStartsClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: TIC_TAC_TOE_MAX_PLAYER_CLIP }, (_, index) => {
    const playerNumber = index + 1;
    return {
      slug: buildPlayerStartsSlug(playerNumber),
      phrase: buildPlayerStartsPhrase(playerNumber),
    };
  });
}

export function getTicTacToePlayerWinsClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: TIC_TAC_TOE_MAX_PLAYER_CLIP }, (_, index) => {
    const playerNumber = index + 1;
    return {
      slug: buildPlayerWinsSlug(playerNumber),
      phrase: buildPlayerWinsPhrase(playerNumber),
    };
  });
}

export function getTicTacToeCalloutPhrase(callout: TicTacToeCallout): string {
  switch (callout.type) {
    case "game-title":
      return buildGameTitlePhrase();
    case "player-starts":
      return buildPlayerStartsPhrase(callout.playerNumber);
    case "targets-displayed":
      return buildTargetsDisplayedPhrase();
    case "square-claimed":
      return buildSquareClaimedPhrase();
    case "already-claimed":
      return buildAlreadyClaimedPhrase();
    case "no-claim":
      return buildNoClaimPhrase();
    case "three-in-a-row":
      return buildThreeInARowPhrase();
    case "player-wins":
      return buildPlayerWinsPhrase(callout.playerNumber);
    case "game-complete":
      return buildGameCompletePhrase();
  }
}

export function getTicTacToeCalloutClipPath(callout: TicTacToeCallout): string | null {
  switch (callout.type) {
    case "game-title":
      return buildGameTitleClipPath();
    case "player-starts":
      return canUsePlayerStartsClip(callout.playerNumber)
        ? buildPlayerStartsClipPath(callout.playerNumber)
        : null;
    case "targets-displayed":
      return buildTargetsDisplayedClipPath();
    case "square-claimed":
      return buildSquareClaimedClipPath();
    case "already-claimed":
      return buildAlreadyClaimedClipPath();
    case "no-claim":
      return buildNoClaimClipPath();
    case "three-in-a-row":
      return buildThreeInARowClipPath();
    case "player-wins":
      return canUsePlayerWinsClip(callout.playerNumber)
        ? buildPlayerWinsClipPath(callout.playerNumber)
        : null;
    case "game-complete":
      return buildGameCompleteClipPath();
  }
}
