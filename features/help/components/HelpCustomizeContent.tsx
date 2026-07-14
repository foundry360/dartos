import { GlassPanel } from "@/components/ui/GlassPanel";
import { HelpBulletList } from "@/features/help/components/HelpBulletList";

const OPEN_SETTINGS_STEPS = [
  "Open the menu from the home screen",
  "Select Settings",
  "Choose Appearance or Gameplay",
];

const BOARD_THEME_CATEGORIES = [
  "DartOS — the signature DartOS look",
  "Classic — traditional sisal and colorways",
  "Bold Themes — team-inspired and high-contrast boards",
];

const GAMEPLAY_SETTINGS = [
  "Haptic feedback — vibration on hits, swipes, and actions",
  "Sound effects — board tones and crowd cheers for 180s, double bulls, and match wins",
  "Voice announcements — George calls out visit totals and player turns",
  "Confirm finish turn — ask before ending a visit early",
];

const PROFILE_PREFERENCES = [
  "Display name, nickname, and avatar",
  "Throwing hand — right-handed or left-handed",
  "Skill level — Beginner, Intermediate, Advanced, or Pro",
  "Preferred game — 501, 301, 701, or Cricket",
  "Home league",
  "Favorite double — D1 through D20 or Bull",
  "Favorite practice routine",
  "Default match — 501 Double Out, 301 Double Out, 701 Double Out, or Cricket",
];

const CUSTOMIZE_TIPS = [
  "Try a board theme before a long match to make sure scoring colors feel right",
  "Enable voice announcements for hands-free scoring during league nights",
  "Turn on Confirm finish turn if you often tap Finish Turn by accident",
  "Set a default match to speed up setup for your usual format",
  "Install the app from Settings → Install app for full-screen play from your Home Screen",
  "Sign in to keep appearance, gameplay, and profile preferences synced across devices",
];

export function HelpCustomizeContent() {
  return (
    <div className="help-overview">
      <GlassPanel className="help-overview__intro">
        <h3 className="help-overview__title">Make DartOS Yours</h3>
        <p className="help-overview__body">
          Customize how DartOS looks, sounds, and feels during play. Adjust board themes and
          gameplay feedback in Settings, then fine-tune your identity and defaults from Profile.
        </p>
      </GlassPanel>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Open Settings</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">To change appearance or gameplay options:</p>
          <HelpBulletList items={OPEN_SETTINGS_STEPS} />
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Appearance</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">Board Themes</h4>
          <p className="help-overview__body">
            Under Settings → Appearance, pick a dartboard theme. Themes update the board
            surround, segment colors, scoring rings, and related UI accents during matches and
            practice.
          </p>
          <p className="help-overview__body">Themes are grouped into:</p>
          <HelpBulletList items={BOARD_THEME_CATEGORIES} />
          <p className="help-overview__body">
            Tap a theme to preview it live. Your selection applies immediately across the app.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Gameplay</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">Feedback and Scoring</h4>
          <p className="help-overview__body">
            Under Settings → Gameplay, control how DartOS responds while you score:
          </p>
          <HelpBulletList items={GAMEPLAY_SETTINGS} />
          <p className="help-overview__body">
            Sound effects and voice announcements include a quick test when you turn them on so
            you can hear the result before your next throw.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Profile Preferences</h3>
        <GlassPanel className="help-overview__card">
          <h4 className="help-overview__card-title">Your Player Identity</h4>
          <p className="help-overview__body">
            Open Profile from the menu, then tap Edit Profile to set personal details and
            defaults. These apply to your signed-in account and are separate from saved player
            profiles used in Match Play.
          </p>
          <p className="help-overview__body">You can customize:</p>
          <HelpBulletList items={PROFILE_PREFERENCES} />
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Sync Across Devices</h3>
        <GlassPanel className="help-overview__card">
          <p className="help-overview__body">
            When you are signed in, DartOS saves your board theme, gameplay toggles, and profile
            preferences to your account. Sign in on another device to pick up the same look,
            sounds, and defaults.
          </p>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <h3 className="help-overview__section-title">Tips</h3>
        <GlassPanel className="help-overview__card">
          <ul className="help-overview__tips">
            {CUSTOMIZE_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </GlassPanel>
      </section>

      <section className="help-overview__section">
        <GlassPanel className="help-overview__intro">
          <h3 className="help-overview__title">Your Board. Your Style. Your Game.</h3>
          <p className="help-overview__body">
            Small changes add up. Set DartOS up once, then focus on the throws that matter.
          </p>
        </GlassPanel>
      </section>
    </div>
  );
}
