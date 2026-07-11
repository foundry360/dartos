import { GlassPanel } from "@/components/ui/GlassPanel";
import { HelpBulletList } from "@/features/help/components/HelpBulletList";

const CREATE_PROFILE_STEPS = [
  "Open Settings → Players",
  "Select Add Player",
  "Enter player information",
  "Save the profile",
];

const PLAYER_INFORMATION = [
  "Name",
  "Avatar or profile image",
  "Nickname",
  "Profile color",
];

const PERFORMANCE_DATA = [
  "Games played",
  "Match history",
  "Statistics",
  "Personal records",
];

const ACHIEVEMENTS = [
  "Milestones",
  "High scores",
  "Accomplishments",
];

const THROW_SETTINGS = [
  "Starting preferences",
  "Game preferences",
  "Default options",
];

const DISPLAY_OPTIONS = ["Player name", "Profile image", "Personal identifiers"];

const COMPETITION_SETTINGS = [
  "Match preferences",
  "League information (future)",
  "Rankings (future)",
];

const MULTIPLE_PLAYERS_USES = [
  "Family game nights",
  "Local competitions",
  "League practice",
  "Tournament scoring",
  "Friends playing together",
];

const PLAYER_HISTORY_ITEMS = [
  "Games completed",
  "Best performances",
  "Average scores",
  "Checkout success",
  "Improvement trends",
];

const PLAYER_TIPS = [
  "Create a profile before playing to track progress",
  "Use unique profiles for accurate statistics",
  "Review player history to identify improvement areas",
  "Keep profiles updated as your game evolves",
];

export function HelpPlayersContent() {
  return (
    <div className="help-overview">
      <GlassPanel className="help-overview__intro">
        <h3 className="help-overview__title">Manage Your Players. Track Every Journey.</h3>
        <p className="help-overview__body">
          The Players section allows you to create profiles, manage competitors, and track
          performance over time.
        </p>
        <p className="help-overview__body">
          Whether you&apos;re playing solo practice, casual games with friends, or competitive
          matches, DartOS keeps every player&apos;s experience organized.
        </p>
      </GlassPanel>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Get Started</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">Create a Player Profile</h4>
          <p className="help-overview__body">To add a player:</p>
          <HelpBulletList items={CREATE_PROFILE_STEPS} />
          <p className="help-overview__body">
            Once created, saved profiles can be used in Match Play and Statistics. Practice mode
            is available for the signed-in account holder only.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Player Profiles</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">
            Each player profile stores important information about their darts journey.
          </p>
          <p className="help-overview__body">Profiles include:</p>
          <div className="help-overview__stack">
            <div>
              <h4 className="help-overview__card-title">Player Information</h4>
              <HelpBulletList items={PLAYER_INFORMATION} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Performance Data</h4>
              <HelpBulletList items={PERFORMANCE_DATA} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Achievements</h4>
              <HelpBulletList items={ACHIEVEMENTS} />
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Using Players</h3>
        <GlassPanel className="help-overview__card">
          <div className="help-overview__stack">
            <div>
              <h4 className="help-overview__card-title">Match Play</h4>
              <p className="help-overview__body">
                Add saved profiles to competitive matches with friends, teammates, or opponents.
              </p>
            </div>
            <div>
              <h4 className="help-overview__card-title">Statistics</h4>
              <p className="help-overview__body">
                View performance and progress for saved profiles from completed matches.
              </p>
            </div>
            <div>
              <h4 className="help-overview__card-title">Practice</h4>
              <p className="help-overview__body">
                Practice drills run under your signed-in account only. Saved profiles cannot be
                selected for practice sessions.
              </p>
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Player Settings</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">Customize each player&apos;s experience:</p>
          <div className="help-overview__stack">
            <div>
              <h4 className="help-overview__card-title">Throw Settings</h4>
              <HelpBulletList items={THROW_SETTINGS} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Display Options</h4>
              <HelpBulletList items={DISPLAY_OPTIONS} />
            </div>
            <div>
              <h4 className="help-overview__card-title">Competition Settings</h4>
              <HelpBulletList items={COMPETITION_SETTINGS} />
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Multiple Players</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">
            DartOS supports multiple players on the same device.
          </p>
          <p className="help-overview__body">Perfect for:</p>
          <HelpBulletList items={MULTIPLE_PLAYERS_USES} />
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Player History</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">Each player builds a complete darts record.</p>
          <p className="help-overview__body">Review:</p>
          <HelpBulletList items={PLAYER_HISTORY_ITEMS} />
          <p className="help-overview__body">Your player profile grows with every throw.</p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Tips</h3>
        <GlassPanel className="help-overview__card">
          <ul className="help-overview__tips">
            {PLAYER_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <GlassPanel className="help-overview__intro">
          <h3 className="help-overview__title">Your Darts Identity</h3>
          <p className="help-overview__body">
            Your player profile is the foundation of your DartOS experience.
          </p>
          <p className="help-overview__body">
            Every match, practice session, and achievement contributes to your journey as a
            player.
          </p>
        </GlassPanel>
      </section>
    </div>
  );
}
