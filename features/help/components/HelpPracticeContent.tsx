import { GlassPanel } from "@/components/ui/GlassPanel";
import { HelpBulletList } from "@/features/help/components/HelpBulletList";

const START_PRACTICE_STEPS = [
  "Select Practice",
  "Choose a training drill",
  "Configure your settings",
  "Start throwing",
  "Review your results",
];

const SCORING_FOCUS = [
  "Treble 20 consistency",
  "High scoring turns",
  "Grouping and accuracy",
  "Scoring averages",
];

const CHECKOUT_PRACTICE = [
  "Common finishes",
  "Difficult outs",
  "Double accuracy",
  "Pressure situations",
];

const CHECKOUT_GUIDANCE = [
  "Recommended checkout routes",
  "Remaining combinations",
  "Preferred finishing strategies",
];

const ACCURACY_TARGETS = ["Singles", "Doubles", "Trebles", "Bullseye"];

const ACCURACY_TRACKING = ["Hit percentage", "Miss patterns", "Consistency"];

const AROUND_BOARD_TARGETS = ["Single numbers", "Doubles", "Trebles", "Bull"];

const TARGET_CATEGORIES = ["Singles", "Doubles", "Trebles", "Bulls"];

const DRILL_CATEGORIES = [
  "Timed Practice",
  "Target Practice",
  "Scoring Practice",
  "Checkout Practice",
];

const SCORING_DRILLS = ["Scoring 99", "Big Fish"];

const CHECKOUT_DRILLS = ["Random Checkout", "3-Dart Checkout Challenge"];

const SESSION_OPTIONS = [
  "Timed sessions: 5, 10, or 15 minutes",
  "Visits: 10 or 20 (Scoring 99, Big Fish)",
  "Checkout attempts: 10, 20, or 50",
  "Random Checkout ranges: 2–40 through 121–170, or full range",
  "Out rules: Double out or Master out",
  "Treble 20: 30, 60, or 90 darts",
  "Consecutive Bulls: 3, 5, or 10 in a row",
];

const PERFORMANCE_METRICS = [
  "Average score",
  "Accuracy percentage",
  "Best results",
  "Improvement trends",
];

const SKILL_DEVELOPMENT = [
  "Strong areas",
  "Weak areas",
  "Consistency patterns",
  "Areas needing more practice",
];

const PRACTICE_TIPS = [
  "Practice with a purpose",
  "Focus on consistency before speed",
  "Repeat difficult shots until they become automatic",
  "Track progress instead of individual misses",
  "Practice the shots you avoid",
];

export function HelpPracticeContent() {
  return (
    <div className="help-overview">
      <GlassPanel className="help-overview__intro">
        <h3 className="help-overview__title">Improve Your Game One Throw at a Time</h3>
        <p className="help-overview__body">
          Practice mode helps you build consistency, improve accuracy, and develop the skills needed
          to perform under pressure.
        </p>
        <p className="help-overview__body">
          Create focused practice sessions, track your progress, and identify areas where you can
          improve.
        </p>
      </GlassPanel>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Get Started</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">Start a Practice Session</h4>
          <HelpBulletList items={START_PRACTICE_STEPS} />
          <p className="help-overview__body">
            DartOS tracks your performance so you can measure improvement over time.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Practice Modes</h3>
        <div className="help-overview__grid help-overview__grid--modes">
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Scoring Practice</h4>
            <p className="help-overview__body">
              Improve your ability to hit high-value targets.
            </p>
            <p className="help-overview__body">Focus on:</p>
            <HelpBulletList items={SCORING_FOCUS} />
          </GlassPanel>

          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Checkout Practice</h4>
            <p className="help-overview__body">Develop your finishing ability.</p>
            <p className="help-overview__body">Practice:</p>
            <HelpBulletList items={CHECKOUT_PRACTICE} />
            <p className="help-overview__body">DartOS can help you learn:</p>
            <HelpBulletList items={CHECKOUT_GUIDANCE} />
          </GlassPanel>

          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Accuracy Training</h4>
            <p className="help-overview__body">Improve your ability to hit specific targets.</p>
            <p className="help-overview__body">Practice:</p>
            <HelpBulletList items={ACCURACY_TARGETS} />
            <p className="help-overview__body">Track:</p>
            <HelpBulletList items={ACCURACY_TRACKING} />
          </GlassPanel>

          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Around the Board</h4>
            <p className="help-overview__body">Build complete board control.</p>
            <p className="help-overview__body">Targets include:</p>
            <HelpBulletList items={AROUND_BOARD_TARGETS} />
            <p className="help-overview__body">
              Perfect for improving accuracy across every section of the board.
            </p>
          </GlassPanel>
        </div>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Practice Settings</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">Customize your training session:</p>
          <div className="help-overview__stack">
            <div>
              <h4 className="help-overview__card-title">Drill Categories</h4>
              <p className="help-overview__body">Choose from the practice setup screen:</p>
              <HelpBulletList items={DRILL_CATEGORIES} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Target Practice</h4>
              <p className="help-overview__body">Pick a focus area, then choose a drill:</p>
              <HelpBulletList items={TARGET_CATEGORIES} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Scoring &amp; Checkout Drills</h4>
              <p className="help-overview__body">Scoring Practice:</p>
              <HelpBulletList items={SCORING_DRILLS} />
              <p className="help-overview__body">Checkout Practice:</p>
              <HelpBulletList items={CHECKOUT_DRILLS} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Session Options</h4>
              <p className="help-overview__body">Many drills let you configure:</p>
              <HelpBulletList items={SESSION_OPTIONS} />
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Track Your Progress</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">
            Every practice session helps build your signed-in account profile.
          </p>
          <div className="help-overview__stack">
            <div>
              <h4 className="help-overview__card-title">Performance Metrics</h4>
              <p className="help-overview__body">Review:</p>
              <HelpBulletList items={PERFORMANCE_METRICS} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Skill Development</h4>
              <p className="help-overview__body">Identify:</p>
              <HelpBulletList items={SKILL_DEVELOPMENT} />
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Practice Tips</h3>
        <GlassPanel className="help-overview__card">
          <ul className="help-overview__tips">
            {PRACTICE_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <GlassPanel className="help-overview__intro">
          <h3 className="help-overview__title">Make Every Throw Count</h3>
          <p className="help-overview__body">
            Great players are built through focused practice.
          </p>
          <p className="help-overview__body">
            Use DartOS Practice Mode to create structured training sessions, measure improvement,
            and prepare for competition.
          </p>
        </GlassPanel>
      </section>
    </div>
  );
}
