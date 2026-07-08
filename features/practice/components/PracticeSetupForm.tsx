"use client";

import {
  PRACTICE_CHECKOUT_GAMES,
  PRACTICE_SCORING_GAMES,
  PRACTICE_TARGET_CATEGORIES,
  buildCheckoutSetup,
  buildScoringPracticeSetup,
  buildTargetSetup,
  buildTimedSetup,
} from "@/features/practice/lib/practice-routines";
import type {
  CheckoutGameId,
  PracticeSetup,
  PracticeTargetCategory,
  ScoringPracticeGameId,
} from "@/types/practice";
import { PracticeOptionRow, PracticeSetupSection } from "@/features/practice/components/PracticeSetupRows";

interface PracticeSetupFormProps {
  onStart: (setup: PracticeSetup) => void | Promise<void>;
}

export function PracticeSetupForm({ onStart }: PracticeSetupFormProps) {
  const startTarget = (targetCategory: PracticeTargetCategory) => {
    void onStart(buildTargetSetup(targetCategory));
  };

  const startScoring = (game: ScoringPracticeGameId) => {
    void onStart(buildScoringPracticeSetup(game));
  };

  const startCheckout = (game: CheckoutGameId) => {
    void onStart(buildCheckoutSetup(game));
  };

  const startTimed = () => {
    void onStart(buildTimedSetup());
  };

  return (
    <div className="setup-screen practice-setup-screen">
      <div className="setup-screen__scroll">
        <PracticeSetupSection title="Timed Practice">
          <PracticeOptionRow label="Timed Practice" onPress={startTimed} />
        </PracticeSetupSection>

        <PracticeSetupSection title="Target Practice">
          {PRACTICE_TARGET_CATEGORIES.map((category) => (
            <PracticeOptionRow
              key={category.id}
              label={category.label}
              onPress={() => startTarget(category.id)}
            />
          ))}
        </PracticeSetupSection>

        <PracticeSetupSection title="Scoring Practice">
          {PRACTICE_SCORING_GAMES.map((game) => (
            <PracticeOptionRow
              key={game.id}
              label={game.label}
              onPress={() => startScoring(game.id as ScoringPracticeGameId)}
            />
          ))}
        </PracticeSetupSection>

        <PracticeSetupSection title="Checkout Practice">
          {PRACTICE_CHECKOUT_GAMES.map((game) => (
            <PracticeOptionRow
              key={game.id}
              label={game.label}
              onPress={() => startCheckout(game.id as CheckoutGameId)}
            />
          ))}
        </PracticeSetupSection>
      </div>
    </div>
  );
}
