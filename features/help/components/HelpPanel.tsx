"use client";

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { APP_HOME_PATH } from "@/lib/auth/routes";

const HELP_TOPICS = [
  {
    title: "Start a match",
    body: "From Home, open Match Play and choose Cricket, Tactics, 301, 501, or 701. Set legs, players, and starting rules on the setup screen, then tap the board to score each dart.",
  },
  {
    title: "Practice drills",
    body: "Open Practice from Home to work on singles, doubles, trebles, checkout challenges, and timed scoring sessions. Pick a drill category, choose a game, then throw on the board.",
  },
  {
    title: "Track your stats",
    body: "Statistics and your Profile update as you play. Sign in to sync averages, match history, and saved player profiles across devices.",
  },
  {
    title: "Saved players",
    body: "Add opponents under Settings → Players. Play matches with your account profile against saved players to build head-to-head records on the Matches screen.",
  },
  {
    title: "Customize the board",
    body: "Change dartboard themes under Settings → Appearance. Adjust haptics, sounds, and turn confirmation under Gameplay.",
  },
] as const;

export function HelpPanel() {
  return (
    <div className="help-page">
      <GlassPanel className="help-page__intro">
        <p className="help-page__intro-text">
          Quick answers for getting the most out of DartScorer on the oche.
        </p>
        <Link href={APP_HOME_PATH} className="help-page__home-link">
          Go to Home
        </Link>
      </GlassPanel>

      <ul className="help-page__list">
        {HELP_TOPICS.map((topic) => (
          <li key={topic.title}>
            <GlassPanel className="help-page__topic">
              <h3 className="help-page__topic-title">{topic.title}</h3>
              <p className="help-page__topic-body">{topic.body}</p>
            </GlassPanel>
          </li>
        ))}
      </ul>
    </div>
  );
}
