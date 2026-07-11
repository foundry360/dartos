import { GlassPanel } from "@/components/ui/GlassPanel";
import { HelpBulletList } from "@/features/help/components/HelpBulletList";

const STATISTICS_SOURCES = [
  "Match Play games",
  "Practice sessions (signed-in account)",
  "Completed matches",
  "Saved player profiles from matches",
];

const MATCH_HISTORY_ITEMS = [
  "Games played",
  "Wins and losses",
  "Match results",
  "Opponents",
  "Game formats",
  "Historical averages",
];

const PROFILE_INCLUDES = [
  "Player name",
  "Games played",
  "Performance history",
  "Personal records",
  "Achievements",
  "Statistics",
];

const IMPROVEMENT_TIPS = [
  "Focus on weak areas",
  "Build confidence in strong areas",
  "Track improvement over time",
  "Prepare for competitive matches",
  "Set measurable goals",
];

const STATISTICS_CATEGORIES = [
  { category: "Scoring", examples: "Average, High Scores, 180s" },
  { category: "Accuracy", examples: "Doubles, Trebles, Bull" },
  { category: "Finishing", examples: "Checkouts, Checkout %" },
  { category: "Competition", examples: "Wins, Losses, Match History" },
  { category: "Practice", examples: "Attempts, Accuracy, Progress" },
] as const;

export function HelpStatisticsContent() {
  return (
    <div className="help-overview">
      <GlassPanel className="help-overview__intro">
        <h3 className="help-overview__title">Understand Your Game. Improve Your Performance.</h3>
        <p className="help-overview__body">
          Statistics gives you insight into every part of your darts game. Track your scoring,
          finishing, consistency, and progress over time to understand what is working and where
          you can improve.
        </p>
      </GlassPanel>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Get Started</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">View Your Performance</h4>
          <p className="help-overview__body">
            Your statistics are automatically collected as you play.
          </p>
          <p className="help-overview__body">Statistics are generated from:</p>
          <HelpBulletList items={STATISTICS_SOURCES} />
          <p className="help-overview__body">
            The more you play, the more accurate your performance insights become.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Player Statistics</h3>
        <div className="help-overview__grid help-overview__grid--modes">
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Scoring Performance</h4>
            <p className="help-overview__body">
              Measure your ability to score consistently.
            </p>
            <p className="help-overview__body">Track:</p>
            <dl className="help-overview__definition-list">
              <div>
                <dt>3 Dart Average</dt>
                <dd>Your average score per three darts.</dd>
              </div>
              <div>
                <dt>Highest Turn</dt>
                <dd>Your highest scoring visit in a game.</dd>
              </div>
              <div>
                <dt>Scoring Consistency</dt>
                <dd>Understand your scoring patterns and performance trends.</dd>
              </div>
              <div>
                <dt>180s &amp; High Scores</dt>
                <dd>Track your biggest scoring achievements.</dd>
              </div>
            </dl>
          </GlassPanel>

          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Checkout Performance</h4>
            <p className="help-overview__body">Analyze your finishing ability.</p>
            <p className="help-overview__body">Track:</p>
            <dl className="help-overview__definition-list">
              <div>
                <dt>Checkout Percentage</dt>
                <dd>How often you successfully complete a finish.</dd>
              </div>
              <div>
                <dt>Highest Checkout</dt>
                <dd>Your biggest completed checkout.</dd>
              </div>
              <div>
                <dt>Double Accuracy</dt>
                <dd>Your success rate when finishing on doubles.</dd>
              </div>
              <div>
                <dt>Favorite Finishes</dt>
                <dd>See which checkout routes you complete most often.</dd>
              </div>
            </dl>
          </GlassPanel>
        </div>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Match History</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">Review your past performance.</p>
          <p className="help-overview__body">View:</p>
          <HelpBulletList items={MATCH_HISTORY_ITEMS} />
          <p className="help-overview__body">
            Use your match history to measure improvement and identify trends.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Progress Tracking</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">
            Statistics help answer important questions:
          </p>
          <dl className="help-overview__definition-list">
            <div>
              <dt>Am I improving?</dt>
              <dd>Compare recent performance against previous sessions.</dd>
            </div>
            <div>
              <dt>Where am I strongest?</dt>
              <dd>Identify your best scoring areas and game formats.</dd>
            </div>
            <div>
              <dt>Where can I improve?</dt>
              <dd>
                Find patterns in missed doubles, scoring drops, or inconsistent play.
              </dd>
            </div>
          </dl>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Player Profiles</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">
            Create a complete record of your darts journey.
          </p>
          <p className="help-overview__body">Profiles can include:</p>
          <HelpBulletList items={PROFILE_INCLUDES} />
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Using Statistics to Improve</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">
            Great players don&apos;t just practice more — they practice smarter.
          </p>
          <p className="help-overview__body">Use your data to:</p>
          <ul className="help-overview__tips">
            {IMPROVEMENT_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Statistics Available</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">
            Depending on the game format, DartOS may track:
          </p>
          <div className="help-overview__table" role="table" aria-label="Statistics categories">
            <div className="help-overview__table-row help-overview__table-row--header" role="row">
              <span className="help-overview__table-cell" role="columnheader">
                Category
              </span>
              <span className="help-overview__table-cell" role="columnheader">
                Examples
              </span>
            </div>
            {STATISTICS_CATEGORIES.map((row) => (
              <div key={row.category} className="help-overview__table-row" role="row">
                <span className="help-overview__table-cell" role="cell">
                  {row.category}
                </span>
                <span className="help-overview__table-cell" role="cell">
                  {row.examples}
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <GlassPanel className="help-overview__intro">
          <h3 className="help-overview__title">Your Game. Your Data. Your Progress.</h3>
          <p className="help-overview__body">
            Every throw tells a story. DartOS transforms your scores into insights that help you
            understand your game and become a better player.
          </p>
        </GlassPanel>
      </section>
    </div>
  );
}
