import {
  hasCheckoutPath,
  X01_CHECKOUT_DISPLAY_MAX,
} from "@/features/x01/lib/x01-checkout";
import type { X01GameState, X01OutRule } from "@/types/x01";
import { isPlayerScoredIn } from "@/features/x01/lib/x01-rules";

export type CheckoutCallout =
  | { type: "require"; remaining: number }
  | { type: "no-finish" };

export const CHECKOUT_CLIP_BASE_PATH = "/sounds/checkout";

export function buildCheckoutRequirePhrase(remaining: number): string {
  return `You require ${remaining}`;
}

export function buildCheckoutRequireSlug(remaining: number): string {
  return `you-require-${remaining}`;
}

export function buildCheckoutRequireClipPath(remaining: number): string {
  return `${CHECKOUT_CLIP_BASE_PATH}/${buildCheckoutRequireSlug(remaining)}.wav`;
}

export function buildNoFinishPhrase(): string {
  return "No Finish";
}

export function buildNoFinishClipPath(): string {
  return `${CHECKOUT_CLIP_BASE_PATH}/no-finish.wav`;
}

export function getCheckoutRequireClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: X01_CHECKOUT_DISPLAY_MAX - 1 }, (_, index) => {
    const remaining = index + 2;
    return {
      slug: buildCheckoutRequireSlug(remaining),
      phrase: buildCheckoutRequirePhrase(remaining),
    };
  });
}

export function resolveCheckoutCallout(input: {
  remaining: number;
  outRule: X01OutRule;
  dartsAvailable: number;
  scoredIn: boolean;
}): CheckoutCallout | null {
  const { remaining, outRule, dartsAvailable, scoredIn } = input;

  if (
    !scoredIn ||
    remaining <= 0 ||
    remaining > X01_CHECKOUT_DISPLAY_MAX ||
    dartsAvailable <= 0
  ) {
    return null;
  }

  if (hasCheckoutPath(remaining, outRule, dartsAvailable)) {
    return { type: "require", remaining };
  }

  return { type: "no-finish" };
}

export function resolveCheckoutCalloutForPlayer(
  game: X01GameState,
  playerIndex: number,
  dartsAvailable: number,
): CheckoutCallout | null {
  const player = game.players[playerIndex];
  if (!player) {
    return null;
  }

  return resolveCheckoutCallout({
    remaining: player.remaining,
    outRule: game.outRule,
    dartsAvailable,
    scoredIn: isPlayerScoredIn(game.inRule, player.scoredIn),
  });
}
