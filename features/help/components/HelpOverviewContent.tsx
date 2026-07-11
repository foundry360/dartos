import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { APP_HOME_PATH } from "@/lib/auth/routes";

const MATCH_PLAY_GAMES = ["X01", "Cricket", "League formats", "Tournament matches"];

const CLASSIC_FORMATS = [
  "121 Checkout",
  "Shanghai",
  "Halve-It",
  "Killer",
  "Baseball",
  "Golf",
  "Tic Tac Toe",
];

const PRACTICE_FOCUS = [
  "Accuracy",
  "Checkouts",
  "Scoring consistency",
  "Pressure situations",
];

const PLAYER_STATS = [
  "Average score",
  "Checkout percentage",
  "Highest turns",
  "Game history",
  "Personal records",
];

const DURING_GAME_FEATURES = [
  {
    title: "Undo",
    body: "Made a mistake? Reverse your last scoring action.",
  },
  {
    title: "Score History",
    body: "Review previous turns and scoring patterns.",
  },
  {
    title: "Checkout Help",
    body: "Need a finish? View recommended checkout combinations.",
  },
  {
    title: "Announcer Mode",
    body: "Add a professional match experience with voice announcements.",
  },
];

const TIPS = [
  "Practice with purpose",
  "Track your averages",
  "Review missed opportunities",
  "Challenge yourself with different formats",
  "Use statistics to improve consistency",
];

export function HelpOverviewContent() {
  return (
    <div className="help-overview">
      <GlassPanel className="help-overview__intro">
        <h3 className="help-overview__title">Welcome to DartOS</h3>
        <p className="help-overview__lead">
          Your complete darts companion for scoring, practice, competition, and improving your
          game.
        </p>
        <p className="help-overview__body">
          Whether you&apos;re playing a casual match, competing in a league, or working on your
          skills, DartOS helps you track every throw, manage games, and analyze your performance.
        </p>
        <Link href={APP_HOME_PATH} className="help-overview__action">
          <TouchButton size="lg">Go to Home</TouchButton>
        </Link>
      </GlassPanel>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Get Started</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">Start a Game</h4>
          <p className="help-overview__body">
            Choose from multiple game formats including:
          </p>
          <dl className="help-overview__definition-list">
            <div>
              <dt>Match Play</dt>
              <dd>Competitive formats like X01, Cricket, and tournament-style games</dd>
            </div>
            <div>
              <dt>Classic Formats</dt>
              <dd>
                Traditional darts games including 121 Checkout, Shanghai, Halve-It, and more
              </dd>
            </div>
            <div>
              <dt>Practice</dt>
              <dd>Improve specific skills with targeted drills and challenges</dd>
            </div>
          </dl>
          <p className="help-overview__body">
            Select your game, configure players and settings, and begin scoring.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Scoring Basics</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">Enter Your Throw</h4>
          <p className="help-overview__body">After each turn:</p>
          <ul className="help-overview__bullets">
            <li>Select the dart value scored</li>
            <li>Review your turn total</li>
            <li>Confirm your score</li>
            <li>Continue to the next player</li>
          </ul>
          <p className="help-overview__body">DartOS automatically handles:</p>
          <ul className="help-overview__bullets">
            <li>Score calculations</li>
            <li>Turn changes</li>
            <li>Checkout rules</li>
            <li>Bust rules</li>
            <li>Game progression</li>
          </ul>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Game Setup</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">Before starting a match, you can customize:</p>
          <div className="help-overview__columns">
            <div>
              <h4 className="help-overview__card-title">Players</h4>
              <ul className="help-overview__bullets">
                <li>Add players</li>
                <li>Select player order</li>
                <li>Track player statistics</li>
              </ul>
            </div>
            <div>
              <h4 className="help-overview__card-title">Game Settings</h4>
              <ul className="help-overview__bullets">
                <li>Starting score</li>
                <li>Number of legs or rounds</li>
                <li>Difficulty settings</li>
                <li>Match options</li>
              </ul>
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Explore Game Modes</h3>
        <div className="help-overview__grid help-overview__grid--modes">
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Match Play</h4>
            <p className="help-overview__body">Designed for competitive games:</p>
            <ul className="help-overview__bullets">
              {MATCH_PLAY_GAMES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </GlassPanel>
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Classic Formats</h4>
            <p className="help-overview__body">Traditional darts challenges:</p>
            <ul className="help-overview__bullets">
              {CLASSIC_FORMATS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </GlassPanel>
          <GlassPanel className="help-overview__card">
            <h4 className="help-overview__card-title">Practice</h4>
            <p className="help-overview__body">Improve specific skills:</p>
            <ul className="help-overview__bullets">
              {PRACTICE_FOCUS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Player Performance</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">Track your progress with:</p>
          <ul className="help-overview__bullets">
            {PLAYER_STATS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="help-overview__body">
            Use your stats to identify strengths and improve weaknesses.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">During a Game</h3>
        <p className="help-overview__section-lead">Helpful features:</p>
        <div className="help-overview__grid help-overview__grid--features">
          {DURING_GAME_FEATURES.map((feature) => (
            <GlassPanel key={feature.title} className="help-overview__card">
              <h4 className="help-overview__card-title">{feature.title}</h4>
              <p className="help-overview__body">{feature.body}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Tips for Better Darts</h3>
        <GlassPanel className="help-overview__card help-overview__card--tips">
          <ul className="help-overview__tips">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </GlassPanel>
      </section>
    </div>
  );
}
