/** Brief pause after turn callout finishes, before the first bot dart. */
export const BOT_POST_VOICE_DELAY_MS = 450;

/** Pause between each bot dart (after the scorecard updates). */
export const BOT_DART_DELAY_MS = 1_600;

/** Extra beat after UI paint so each dart read is visible. */
export const BOT_POST_DART_PAUSE_MS = 350;

export function waitForScorecardPaint(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** Beat to show the bot aim highlight immediately before each simulated dart. */
export const BOT_AIM_HIGHLIGHT_MS = 850;

export async function pauseForBotAimHighlight(): Promise<void> {
  await waitForScorecardPaint();
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, BOT_AIM_HIGHLIGHT_MS);
  });
}

export async function pauseAfterBotDart(): Promise<void> {
  await waitForScorecardPaint();
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, BOT_POST_DART_PAUSE_MS);
  });
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, BOT_DART_DELAY_MS);
  });
}

/** Hold the final dart on the scorecard before handing off to the next player. */
export const BOT_VISIT_END_PAUSE_MS = 1_400;

export async function pauseBeforeEndBotVisit(): Promise<void> {
  await waitForScorecardPaint();
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, BOT_POST_DART_PAUSE_MS);
  });
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, BOT_VISIT_END_PAUSE_MS);
  });
}
