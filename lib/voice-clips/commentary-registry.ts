import {
  buildChallengeCompletePhrase,
  buildCheckout121Phrase,
  buildCheckoutPhrase,
  buildGameTitlePhrase,
  buildHighestCheckoutPhrase,
  buildHighestCheckoutSlug,
  buildLastDartPhrase,
  buildNewHighScorePhrase,
  buildNextTargetPhrase,
  buildNextTargetSlug,
  buildNoCheckoutPhrase,
  buildPersonalBestPhrase,
  buildRemainingPhrase,
  buildRemainingSlug,
  buildStartingTargetPhrase,
  buildStartingTargetSlug,
  buildTargetClearedPhrase,
  buildTargetPhrase,
  buildTargetRemainsPhrase,
  buildTargetRemainsSlug,
  buildTargetSlug,
  buildThreeDartsRemainingPhrase,
  buildVisitCompletePhrase,
  CHECKOUT_121_MAX_SCORE_CLIP,
  CHECKOUT_121_MIN_SCORE_CLIP,
  getCheckout121ScoreClipEntries,
} from "@/lib/checkout-121-callouts";
import {
  buildNoFinishPhrase,
  buildNoFinishClipPath,
  getCheckoutRequireClipEntries,
} from "@/lib/checkout-callouts";
import {
  buildEndOfInningPhrase,
  buildEndOfInningClipPath,
  buildFinalScorePhrase as buildBaseballFinalScorePhrase,
  buildFinalScoreClipPath as buildBaseballFinalScoreClipPath,
  buildHomeRunPhrase,
  buildHomeRunClipPath,
  buildStrikeoutPhrase,
  buildStrikeoutClipPath,
  getBaseballInningClipEntries,
} from "@/lib/baseball-callouts";
import {
  buildFinalTargetBullPhrase,
  buildFinalTargetBullClipPath,
  buildPlayerEliminatedPhrase,
  buildPlayerEliminatedClipPath,
  buildRoundCompletePhrase as buildBobs27RoundCompletePhrase,
  buildRoundCompleteClipPath as buildBobs27RoundCompleteClipPath,
  buildScoreReducedPhrase,
  buildScoreReducedClipPath,
  buildStartingScorePhrase,
  buildStartingScoreClipPath,
  getBobs27GameCompleteClipEntries,
  getBobs27TargetDoubleClipEntries,
} from "@/lib/bobs-27-callouts";
import { getCricketClosedClipEntries } from "@/lib/cricket/cricket-closed-callouts";
import {
  buildBirdiePhrase,
  buildBirdieClipPath,
  buildEaglePhrase,
  buildEagleClipPath,
  buildFinalScorePhrase as buildGolfFinalScorePhrase,
  buildFinalScoreClipPath as buildGolfFinalScoreClipPath,
  buildHoleCompletePhrase,
  buildHoleCompleteClipPath,
  getGolfHoleClipEntries,
} from "@/lib/golf-callouts";
import { getGameShotClipEntries } from "@/lib/game-shot-callouts";
import {
  buildFinalRoundBullPhrase,
  buildFinalRoundBullClipPath,
  buildRoundCompletePhrase as buildHalveItRoundCompletePhrase,
  buildRoundCompleteClipPath as buildHalveItRoundCompleteClipPath,
  buildScoreHalvedPhrase,
  buildScoreHalvedClipPath,
  getHalveItGameCompleteClipEntries,
  getHalveItRoundClipEntries,
} from "@/lib/halve-it-callouts";
import {
  buildDoubleHitPhrase,
  buildDoubleHitClipPath,
  buildPlayerEliminatedPhrase as buildKillerPlayerEliminatedPhrase,
  buildPlayerEliminatedClipPath as buildKillerPlayerEliminatedClipPath,
  buildPlayerNumbersAssignedPhrase,
  buildPlayerNumbersAssignedClipPath,
  getKillerIsKillerClipEntries,
  getKillerPlayerTargetClipEntries,
  getKillerPlayerWinsClipEntries,
} from "@/lib/killer-callouts";
import {
  buildAlreadyClaimedPhrase,
  buildAlreadyClaimedClipPath,
  buildGameCompletePhrase as buildTicTacToeGameCompletePhrase,
  buildGameCompleteClipPath as buildTicTacToeGameCompleteClipPath,
  buildGameTitlePhrase as buildTicTacToeGameTitlePhrase,
  buildGameTitleClipPath as buildTicTacToeGameTitleClipPath,
  buildNoClaimPhrase,
  buildNoClaimClipPath,
  buildSquareClaimedPhrase,
  buildSquareClaimedClipPath,
  buildTargetsDisplayedPhrase,
  buildTargetsDisplayedClipPath,
  buildThreeInARowPhrase,
  buildThreeInARowClipPath,
  getTicTacToePlayerStartsClipEntries,
  getTicTacToePlayerWinsClipEntries,
} from "@/lib/tic-tac-toe-callouts";
import {
  buildFinalRoundBullPhrase as buildShanghaiFinalRoundBullPhrase,
  buildFinalRoundBullClipPath as buildShanghaiFinalRoundBullClipPath,
  buildRoundCompletePhrase as buildShanghaiRoundCompletePhrase,
  buildRoundCompleteClipPath as buildShanghaiRoundCompleteClipPath,
  buildShanghaiAchievedPhrase,
  buildShanghaiAchievedClipPath,
  getShanghaiPlayerWinsClipEntries,
  getShanghaiRoundClipEntries,
} from "@/lib/shanghai-callouts";
import { buildHitMissPhrase, type HitMissCallout } from "@/lib/hit-miss-callouts";
import { buildVisitTotalCallout } from "@/utils/score-callout";
import { buildVisitScoreSlug } from "@/utils/score-audio";
import { parseLegacySoundClipPath } from "@/utils/commentary-audio";

export interface VoiceClipSeedEntry {
  /** Supabase path relative to voice-clips bucket */
  storagePath: string;
  phrase: string;
}

function commentaryEntry(category: string, slug: string, phrase: string): VoiceClipSeedEntry {
  return {
    storagePath: `commentary/${category}/${slug}.wav`,
    phrase,
  };
}

function legacyPathEntry(clipPath: string, phrase: string): VoiceClipSeedEntry | null {
  const parsed = parseLegacySoundClipPath(clipPath);
  if (!parsed) {
    return null;
  }

  return commentaryEntry(parsed.category, parsed.slug, phrase);
}

function scoreEntry(slug: string, phrase: string): VoiceClipSeedEntry {
  return {
    storagePath: `scores/${slug}.wav`,
    phrase,
  };
}

export function getAllVoiceClipSeedEntries(): VoiceClipSeedEntry[] {
  const entries: VoiceClipSeedEntry[] = [];

  const add = (entry: VoiceClipSeedEntry | null) => {
    if (entry) {
      entries.push(entry);
    }
  };

  add(scoreEntry("no-score", "No score"));
  for (let score = 0; score <= 180; score += 1) {
    add(scoreEntry(String(score), String(score)));
  }

  for (const callout of ["hit", "miss"] as HitMissCallout[]) {
    add(commentaryEntry("hit-miss", callout, buildHitMissPhrase(callout)));
  }

  for (const entry of getGameShotClipEntries()) {
    add(commentaryEntry("game-shot", entry.slug, entry.phrase));
  }

  for (const entry of getCheckoutRequireClipEntries()) {
    add(commentaryEntry("checkout", entry.slug, entry.phrase));
  }
  add(legacyPathEntry(buildNoFinishClipPath(), buildNoFinishPhrase()));

  for (const variant of ["classic", "tactics"] as const) {
    for (const entry of getCricketClosedClipEntries(variant)) {
      add(commentaryEntry("cricket-closed", entry.slug, entry.phrase));
    }
  }

  for (const entry of getKillerPlayerTargetClipEntries()) {
    add(commentaryEntry("killer", entry.slug, entry.phrase));
  }
  for (const entry of getKillerIsKillerClipEntries()) {
    add(commentaryEntry("killer", entry.slug, entry.phrase));
  }
  for (const entry of getKillerPlayerWinsClipEntries()) {
    add(commentaryEntry("killer", entry.slug, entry.phrase));
  }
  add(
    legacyPathEntry(
      buildPlayerNumbersAssignedClipPath(),
      buildPlayerNumbersAssignedPhrase(),
    ),
  );
  add(legacyPathEntry(buildDoubleHitClipPath(), buildDoubleHitPhrase()));
  add(
    legacyPathEntry(
      buildKillerPlayerEliminatedClipPath(),
      buildKillerPlayerEliminatedPhrase(),
    ),
  );

  for (const entry of getGolfHoleClipEntries()) {
    add(commentaryEntry("golf", entry.slug, entry.phrase));
  }
  add(legacyPathEntry(buildBirdieClipPath(), buildBirdiePhrase()));
  add(legacyPathEntry(buildEagleClipPath(), buildEaglePhrase()));
  add(legacyPathEntry(buildHoleCompleteClipPath(), buildHoleCompletePhrase()));
  add(legacyPathEntry(buildGolfFinalScoreClipPath(), buildGolfFinalScorePhrase()));

  for (const entry of getBaseballInningClipEntries()) {
    add(commentaryEntry("baseball", entry.slug, entry.phrase));
  }
  add(legacyPathEntry(buildStrikeoutClipPath(), buildStrikeoutPhrase()));
  add(legacyPathEntry(buildHomeRunClipPath(), buildHomeRunPhrase()));
  add(legacyPathEntry(buildEndOfInningClipPath(), buildEndOfInningPhrase()));
  add(legacyPathEntry(buildBaseballFinalScoreClipPath(), buildBaseballFinalScorePhrase()));

  for (const entry of getHalveItRoundClipEntries()) {
    add(commentaryEntry("halve-it", entry.slug, entry.phrase));
  }
  for (const entry of getHalveItGameCompleteClipEntries()) {
    add(commentaryEntry("halve-it", entry.slug, entry.phrase));
  }
  add(legacyPathEntry(buildFinalRoundBullClipPath(), buildFinalRoundBullPhrase()));
  add(
    legacyPathEntry(buildHalveItRoundCompleteClipPath(), buildHalveItRoundCompletePhrase()),
  );
  add(legacyPathEntry(buildScoreHalvedClipPath(), buildScoreHalvedPhrase()));

  for (const entry of getShanghaiRoundClipEntries()) {
    add(commentaryEntry("shanghai", entry.slug, entry.phrase));
  }
  for (const entry of getShanghaiPlayerWinsClipEntries()) {
    add(commentaryEntry("shanghai", entry.slug, entry.phrase));
  }
  add(
    legacyPathEntry(
      buildShanghaiFinalRoundBullClipPath(),
      buildShanghaiFinalRoundBullPhrase(),
    ),
  );
  add(
    legacyPathEntry(
      buildShanghaiRoundCompleteClipPath(),
      buildShanghaiRoundCompletePhrase(),
    ),
  );
  add(legacyPathEntry(buildShanghaiAchievedClipPath(), buildShanghaiAchievedPhrase()));

  for (const entry of getBobs27TargetDoubleClipEntries()) {
    add(commentaryEntry("bobs-27", entry.slug, entry.phrase));
  }
  for (const entry of getBobs27GameCompleteClipEntries()) {
    add(commentaryEntry("bobs-27", entry.slug, entry.phrase));
  }
  add(legacyPathEntry(buildStartingScoreClipPath(27), buildStartingScorePhrase(27)));
  add(legacyPathEntry(buildFinalTargetBullClipPath(), buildFinalTargetBullPhrase()));
  add(
    legacyPathEntry(buildBobs27RoundCompleteClipPath(), buildBobs27RoundCompletePhrase()),
  );
  add(legacyPathEntry(buildScoreReducedClipPath(), buildScoreReducedPhrase()));
  add(legacyPathEntry(buildPlayerEliminatedClipPath(), buildPlayerEliminatedPhrase()));

  for (const entry of getTicTacToePlayerStartsClipEntries()) {
    add(commentaryEntry("tic-tac-toe", entry.slug, entry.phrase));
  }
  for (const entry of getTicTacToePlayerWinsClipEntries()) {
    add(commentaryEntry("tic-tac-toe", entry.slug, entry.phrase));
  }
  add(legacyPathEntry(buildTicTacToeGameTitleClipPath(), buildTicTacToeGameTitlePhrase()));
  add(legacyPathEntry(buildTargetsDisplayedClipPath(), buildTargetsDisplayedPhrase()));
  add(legacyPathEntry(buildSquareClaimedClipPath(), buildSquareClaimedPhrase()));
  add(legacyPathEntry(buildAlreadyClaimedClipPath(), buildAlreadyClaimedPhrase()));
  add(legacyPathEntry(buildNoClaimClipPath(), buildNoClaimPhrase()));
  add(legacyPathEntry(buildThreeInARowClipPath(), buildThreeInARowPhrase()));
  add(
    legacyPathEntry(
      buildTicTacToeGameCompleteClipPath(),
      buildTicTacToeGameCompletePhrase(),
    ),
  );

  const checkout121Fixed: Array<{ slug: string; phrase: string }> = [
    { slug: "121-checkout", phrase: buildGameTitlePhrase() },
    { slug: "visit-complete", phrase: buildVisitCompletePhrase() },
    { slug: "three-darts-remaining", phrase: buildThreeDartsRemainingPhrase() },
    { slug: "last-dart", phrase: buildLastDartPhrase() },
    { slug: "checkout", phrase: buildCheckoutPhrase() },
    { slug: "checkout-121", phrase: buildCheckout121Phrase() },
    { slug: "target-cleared", phrase: buildTargetClearedPhrase() },
    { slug: "no-checkout", phrase: buildNoCheckoutPhrase() },
    { slug: "new-high-score", phrase: buildNewHighScorePhrase() },
    { slug: "personal-best", phrase: buildPersonalBestPhrase() },
    { slug: "challenge-complete", phrase: buildChallengeCompletePhrase() },
  ];

  for (const entry of checkout121Fixed) {
    add(commentaryEntry("checkout-121", entry.slug, entry.phrase));
  }

  const checkout121ScoreBuilders = [
    { buildSlug: buildStartingTargetSlug, phrase: buildStartingTargetPhrase },
    { buildSlug: buildRemainingSlug, phrase: buildRemainingPhrase },
    { buildSlug: buildNextTargetSlug, phrase: buildNextTargetPhrase },
    { buildSlug: buildTargetSlug, phrase: buildTargetPhrase },
    { buildSlug: buildTargetRemainsSlug, phrase: buildTargetRemainsPhrase },
    { buildSlug: buildHighestCheckoutSlug, phrase: buildHighestCheckoutPhrase },
  ] as const;

  for (const builder of checkout121ScoreBuilders) {
    for (const entry of getCheckout121ScoreClipEntries("", builder.phrase, builder.buildSlug)) {
      add(commentaryEntry("checkout-121", entry.slug, entry.phrase));
    }
  }

  const deduped = new Map<string, VoiceClipSeedEntry>();
  for (const entry of entries) {
    deduped.set(entry.storagePath, entry);
  }

  return [...deduped.values()];
}

/** Visit score slugs for tests and tooling. */
export function getVisitScoreSeedEntries(): VoiceClipSeedEntry[] {
  const entries: VoiceClipSeedEntry[] = [
    scoreEntry("no-score", buildVisitTotalCallout(0, true)),
  ];

  for (let total = 0; total <= 180; total += 1) {
    entries.push(scoreEntry(buildVisitScoreSlug(total), buildVisitTotalCallout(total)));
  }

  return entries;
}
