import { isPhoneLayoutDevice } from "@/utils/fullscreen";

/** Brief pause after turn callout finishes, before the first bot dart. */
export const BOT_POST_VOICE_DELAY_MS = 450;

/**
 * Max time a bot visit will wait for the shared voice queue before throwing.
 * Prevents hung cricket-closed / visit-score fetches from stalling bot play.
 */
export const BOT_VOICE_QUEUE_MAX_WAIT_MS = 12_000;

/** Pause between each bot dart (after the scorecard updates). */
export const BOT_DART_DELAY_MS = 1_600;

/** Extra beat after UI paint so each dart read is visible. */
export const BOT_POST_DART_PAUSE_MS = 350;

/** Beat to show the bot aim highlight immediately before each simulated dart. */
export const BOT_AIM_HIGHLIGHT_MS = 850;

/** Hold the final dart on the scorecard before handing off to the next player. */
export const BOT_VISIT_END_PAUSE_MS = 1_400;

/**
 * iPhone uses the number pad (no dartboard aim highlight), so long desktop
 * pacing feels stuck. Keep desktop theatrical; keep phone snappy.
 */
interface BotTurnTiming {
  postVoiceDelayMs: number;
  voiceQueueMaxWaitMs: number;
  aimHighlightMs: number;
  postDartPauseMs: number;
  dartDelayMs: number;
  visitEndPauseMs: number;
  visitScoreReadyMaxWaitMs: number;
}

const DESKTOP_BOT_TURN_TIMING: BotTurnTiming = {
  postVoiceDelayMs: BOT_POST_VOICE_DELAY_MS,
  voiceQueueMaxWaitMs: BOT_VOICE_QUEUE_MAX_WAIT_MS,
  aimHighlightMs: BOT_AIM_HIGHLIGHT_MS,
  postDartPauseMs: BOT_POST_DART_PAUSE_MS,
  dartDelayMs: BOT_DART_DELAY_MS,
  visitEndPauseMs: BOT_VISIT_END_PAUSE_MS,
  visitScoreReadyMaxWaitMs: 4_000,
};

const IPHONE_BOT_TURN_TIMING: BotTurnTiming = {
  postVoiceDelayMs: 200,
  // Wait for visit total + "{name}'s turn" so bot darts don't overlap callouts.
  // (Still capped — hung fetches cannot freeze the match.)
  voiceQueueMaxWaitMs: 10_000,
  // No dartboard on iPhone scoring — skip aim-highlight theater.
  aimHighlightMs: 0,
  postDartPauseMs: 120,
  dartDelayMs: 650,
  visitEndPauseMs: 280,
  // Prefetch only — never sit on a second clip fetch before calling the next player.
  visitScoreReadyMaxWaitMs: 0,
};

export function getBotTurnTiming(): BotTurnTiming {
  if (typeof window !== "undefined" && isPhoneLayoutDevice()) {
    return IPHONE_BOT_TURN_TIMING;
  }

  return DESKTOP_BOT_TURN_TIMING;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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

export async function pauseForBotAimHighlight(): Promise<void> {
  const { aimHighlightMs } = getBotTurnTiming();
  if (aimHighlightMs <= 0) {
    return;
  }

  await waitForScorecardPaint();
  await delay(aimHighlightMs);
}

export async function pauseAfterBotDart(): Promise<void> {
  const { postDartPauseMs, dartDelayMs } = getBotTurnTiming();
  await waitForScorecardPaint();
  await delay(postDartPauseMs);
  await delay(dartDelayMs);
}

export async function pauseBeforeEndBotVisit(): Promise<void> {
  const { postDartPauseMs, visitEndPauseMs } = getBotTurnTiming();
  await waitForScorecardPaint();
  await delay(postDartPauseMs);
  await delay(visitEndPauseMs);
}
