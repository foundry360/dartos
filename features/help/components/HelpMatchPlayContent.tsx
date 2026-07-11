import { GlassPanel } from "@/components/ui/GlassPanel";
import { HelpBulletList } from "@/features/help/components/HelpBulletList";

const CREATE_MATCH_STEPS = [
  "Select Match Play",
  "Choose your game format",
  "Add players or teams",
  "Configure match settings",
  "Start scoring",
];

const X01_FORMATS = ["201", "301", "501", "701", "1001"];

const X01_RULES = [
  "Score down from the starting total",
  "Finish with an exact checkout",
  "Going below zero results in a bust",
];

const CRICKET_POINTS = [
  "Closing numbers 15–20 and Bull",
  "Scoring points on open numbers",
  "Controlling the board",
];

const TEAM_FEATURES = [
  "Multiple players",
  "Team scoring",
  "Match progression",
  "Individual statistics",
];

const LEGS_SETS_OPTIONS = [
  "First to a number of legs",
  "Best of series formats",
  "Set-based competition",
];

const STARTING_ORDER_OPTIONS = [
  "Random selection",
  "Manual selection",
  "Previous winner",
];

const RULES_OPTIONS = [
  "Double out",
  "Master out",
  "Straight start",
  "Handicap options",
];

const TURN_TRACKING = [
  "Current player",
  "Remaining score",
  "Leg progress",
  "Match status",
];

const MATCH_HISTORY_ITEMS = [
  "Previous legs",
  "Scores",
  "Averages",
  "Checkout performance",
];

const PLAYER_STATISTICS = [
  "3 Dart Average",
  "First 9 Average",
  "Checkout Percentage",
  "Highest Checkout",
  "180s & High Scores",
];

const TOURNAMENT_FEATURES = [
  "League matches",
  "Tournament games",
  "Practice matches",
  "Player rankings",
  "Performance tracking",
];

const QUICK_TIPS = [
  "Set your preferred match rules before starting",
  "Use checkout guidance to improve finishing",
  "Track averages to measure improvement",
  "Review match history after every game",
];

export function HelpMatchPlayContent() {
  return (
    <div className="help-overview">
      <GlassPanel className="help-overview__intro">
        <h3 className="help-overview__title">Competitive Darts Made Simple</h3>
        <p className="help-overview__body">
          Match Play is designed for head-to-head competition, league play, and tournament-style
          matches. Create a match, configure your format, and let DartOS handle scoring, rules,
          and game progression.
        </p>
      </GlassPanel>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Get Started</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">Create a Match</h4>
          <HelpBulletList items={CREATE_MATCH_STEPS} />
          <p className="help-overview__body">
            DartOS will automatically manage turns, scoring, and match progress.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Available Match Formats</h3>
        <div className="help-overview__grid help-overview__grid--modes">
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">01 Games</h4>
            <p className="help-overview__body">
              Classic countdown darts where players race from a starting score to exactly zero.
            </p>
            <p className="help-overview__body">Common formats:</p>
            <HelpBulletList items={X01_FORMATS} />
            <p className="help-overview__body">Key rules:</p>
            <HelpBulletList items={X01_RULES} />
          </GlassPanel>

          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Cricket</h4>
            <p className="help-overview__body">
              A strategic game focused on closing numbers and scoring points.
            </p>
            <p className="help-overview__body">Players compete by:</p>
            <HelpBulletList items={CRICKET_POINTS} />
            <p className="help-overview__body">
              Win by closing all numbers and having the highest score.
            </p>
          </GlassPanel>

          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Team Matches</h4>
            <p className="help-overview__body">Play with partners and track team performance.</p>
            <p className="help-overview__body">Features:</p>
            <HelpBulletList items={TEAM_FEATURES} />
          </GlassPanel>
        </div>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Match Settings</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">Customize your competition:</p>
          <div className="help-overview__stack">
            <div>
              <h4 className="help-overview__card-title">Legs &amp; Sets</h4>
              <p className="help-overview__body">Choose how matches are won:</p>
              <HelpBulletList items={LEGS_SETS_OPTIONS} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Starting Order</h4>
              <p className="help-overview__body">Determine who throws first:</p>
              <HelpBulletList items={STARTING_ORDER_OPTIONS} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Rules</h4>
              <p className="help-overview__body">Configure:</p>
              <HelpBulletList items={RULES_OPTIONS} />
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">During a Match</h3>
        <p className="help-overview__section-lead">
          DartOS helps you stay focused on playing.
        </p>
        <GlassPanel className="help-overview__card">
          <div className="help-overview__stack">
            <div>
              <h4 className="help-overview__card-title">Score Entry</h4>
              <p className="help-overview__body">Quickly enter each player&apos;s turn.</p>
            </div>
            <div>
              <h4 className="help-overview__card-title">Turn Management</h4>
              <p className="help-overview__body">Automatically tracks:</p>
              <HelpBulletList items={TURN_TRACKING} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Checkout Guidance</h4>
              <p className="help-overview__body">
                View possible finishes and recommended routes.
              </p>
            </div>
            <div>
              <h4 className="help-overview__card-title">Match History</h4>
              <p className="help-overview__body">Review:</p>
              <HelpBulletList items={MATCH_HISTORY_ITEMS} />
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Competitive Features</h3>
        <div className="help-overview__grid help-overview__grid--modes">
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Player Statistics</h4>
            <p className="help-overview__body">Track performance over time:</p>
            <HelpBulletList items={PLAYER_STATISTICS} />
          </GlassPanel>
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Match Results</h4>
            <p className="help-overview__body">
              Review outcomes, leg winners, and head-to-head records after each match.
            </p>
          </GlassPanel>
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Tournament Ready</h4>
            <p className="help-overview__body">DartOS is built to support competitive play:</p>
            <HelpBulletList items={TOURNAMENT_FEATURES} />
          </GlassPanel>
        </div>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Quick Tips</h3>
        <GlassPanel className="help-overview__card">
          <ul className="help-overview__tips">
            {QUICK_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </GlassPanel>
      </section>
    </div>
  );
}
