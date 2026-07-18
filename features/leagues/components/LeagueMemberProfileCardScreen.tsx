"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ProfileCard } from "@/features/profile/components/ProfileCard";
import { ProfileValueGauge } from "@/features/profile/components/ProfileValueGauge";
import {
  ProfileAchievementIconGlyph,
  ProfileOneEightyIcon,
} from "@/features/profile/components/ProfileIcons";
import { HomeCricketGameModeIcon } from "@/features/home/components/HomeGameModeIcons";
import { useLeagueMemberCard } from "@/features/leagues/hooks/useLeagueMemberCards";
import {
  getLeagueContext,
  type LeagueMemberProfileCard,
} from "@/features/leagues/lib/league-member-profile-card";
import { recordRecentLeaguePlayerCard } from "@/features/leagues/lib/league-player-card-recent-storage";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import { averageToGaugePercent } from "@/features/profile/lib/profile-dashboard";
import {
  LEAGUE_PLAY_PATH,
  LEAGUE_PLAYER_CARD_PATH,
  LOGIN_PATH,
} from "@/lib/auth/routes";
import { cn } from "@/utils/cn";
import "@/features/profile/profile-page.css";
import "@/features/leagues/league-member-profile-card.css";

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="profile-sidebar__location-icon">
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="11" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function MiniStatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "target" | "trophy" | "cricket" | "one-eighty";
}) {
  return (
    <div className="profile-hero-stat">
      <div className="profile-hero-stat__icon" aria-hidden>
        {icon === "cricket" ? (
          <HomeCricketGameModeIcon className="profile-hero-stat__cricket-icon" />
        ) : icon === "one-eighty" ? (
          <ProfileOneEightyIcon />
        ) : (
          <ProfileAchievementIconGlyph icon={icon === "trophy" ? "trophy" : "target"} />
        )}
      </div>
      <div className="profile-hero-stat__copy">
        <span className="profile-hero-stat__label">{label}</span>
        <span className="profile-hero-stat__value">{value}</span>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number;
  children?: ReactNode;
}) {
  return (
    <div className="league-member-card__meta-row">
      <span className="league-member-card__meta-label">{label}</span>
      {children ?? (
        <span className="league-member-card__meta-value">{value}</span>
      )}
    </div>
  );
}

function LeagueMemberProfileCardContent({
  card,
}: {
  card: LeagueMemberProfileCard;
}) {
  const [selectedLeagueId, setSelectedLeagueId] = useState(
    () => getLeagueContext(card)?.id ?? "",
  );

  useEffect(() => {
    const next = getLeagueContext(card)?.id ?? "";
    setSelectedLeagueId(next);
  }, [card]);

  const league = getLeagueContext(card, selectedLeagueId);

  if (!league) {
    return (
      <div className="league-member-card-page__wrap">
        <Link href={LEAGUE_PLAYER_CARD_PATH} className="league-member-card__back">
          ← Back to Player Cards
        </Link>
        <ProfileCard>
          <p className="profile-sidebar__empty">No league memberships found.</p>
        </ProfileCard>
      </div>
    );
  }

  const hasMultipleLeagues = card.leagues.length > 1;
  const winRateLabel = `${league.seasonStats.winPercentage}%`;
  const heroAverage =
    league.x01Performance?.averageScore ?? league.cricketPerformance?.mpr ?? 0;
  const heroCaption = league.x01Performance
    ? "Season Average"
    : league.cricketPerformance
      ? "Season MPR"
      : "Season Form";
  const heroValue = league.x01Performance
    ? league.x01Performance.averageScore.toFixed(1)
    : league.cricketPerformance
      ? league.cricketPerformance.mpr.toFixed(2)
      : "—";
  const heroFill = league.x01Performance
    ? averageToGaugePercent(heroAverage)
    : league.cricketPerformance
      ? Math.min((league.cricketPerformance.mpr / 5) * 100, 100)
      : 0;

  return (
    <div className="league-member-card-page__wrap">
      <div className="league-member-card__toolbar-slot">
        <ProfileCard className="league-member-card__toolbar">
          <Link href={LEAGUE_PLAYER_CARD_PATH} className="league-member-card__back">
            ← Back to Player Cards
          </Link>

          <label className="league-member-card__league-select">
            <span className="league-member-card__league-select-label">
              Current League
            </span>
            {hasMultipleLeagues ? (
              <select
                value={selectedLeagueId}
                onChange={(event) => setSelectedLeagueId(event.target.value)}
              >
                {card.leagues.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.leagueName}
                  </option>
                ))}
              </select>
            ) : (
              <span className="league-member-card__league-select-value">
                {league.leagueName}
              </span>
            )}
          </label>
        </ProfileCard>
      </div>

      <div className="profile-page__dashboard">
        <aside className="profile-sidebar">
          <ProfileCard className="profile-sidebar__identity league-member-card__identity">
            <div className="league-member-card__avatar-wrap">
              <PlayerAvatar
                name={card.playerName}
                color={card.avatarColor}
                avatarUrl={card.avatarUrl}
                className="league-member-card__avatar"
              />
            </div>

            <div className="profile-sidebar__identity-copy league-member-card__identity-copy">
              <h2 className="profile-sidebar__name league-member-card__name">
                {card.playerName}
              </h2>
              <p className="profile-sidebar__nickname">{league.teamName}</p>
              <span className="profile-sidebar__rank">{league.role}</span>
              <p className="profile-sidebar__location">
                <LocationIcon />
                <span>{league.leagueName}</span>
              </p>
              {hasMultipleLeagues ? (
                <p className="league-member-card__league-count">
                  {card.leagues.length} leagues
                </p>
              ) : null}
              <p className="league-member-card__season">{league.seasonName}</p>
              <span
                className={cn(
                  "league-member-card__status-pill",
                  league.membershipStatus === "active"
                    ? "league-member-card__status-pill--active"
                    : "league-member-card__status-pill--inactive",
                )}
              >
                {league.membershipStatus === "active" ? "Active Member" : "Inactive"}
              </span>
            </div>

            <div className="profile-sidebar__quick-stats">
              <div className="profile-sidebar__quick-stat">
                <span className="profile-sidebar__quick-stat-value">
                  {league.seasonStats.matchesPlayed}
                </span>
                <span className="profile-sidebar__quick-stat-label">Played</span>
              </div>
              <div className="profile-sidebar__quick-stat">
                <span className="profile-sidebar__quick-stat-value">
                  {league.seasonStats.wins}
                </span>
                <span className="profile-sidebar__quick-stat-label">Won</span>
              </div>
              <div className="profile-sidebar__quick-stat">
                <span className="profile-sidebar__quick-stat-value">{winRateLabel}</span>
                <span className="profile-sidebar__quick-stat-label">Win %</span>
              </div>
            </div>
          </ProfileCard>

          <ProfileCard>
            <h3 className="profile-sidebar__section-title">Recent Form</h3>
            {league.recentMatches.length > 0 ? (
              <div className="profile-sidebar__form-row">
                {league.recentMatches.map((match) => (
                  <span
                    key={match.id}
                    className={cn(
                      "profile-sidebar__form-chip",
                      match.won
                        ? "profile-sidebar__form-chip--win"
                        : "profile-sidebar__form-chip--loss",
                    )}
                    title={`${match.dateLabel} vs ${match.opponent} · ${match.resultLabel}`}
                  >
                    {match.won ? "W" : "L"}
                  </span>
                ))}
              </div>
            ) : (
              <p className="profile-sidebar__empty">No recent league matches yet.</p>
            )}
          </ProfileCard>

          <ProfileCard>
            <h3 className="profile-sidebar__section-title">Achievements</h3>
            {card.achievements.length > 0 ? (
              <ul className="profile-sidebar__badge-list">
                {card.achievements.map((achievement) => (
                  <li key={achievement.id} className="profile-sidebar__badge-item">
                    <span className="profile-sidebar__badge-icon" aria-hidden>
                      <ProfileAchievementIconGlyph icon={achievement.icon} />
                    </span>
                    <span className="profile-sidebar__badge-label">
                      {achievement.label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="profile-sidebar__empty">Earn badges as you hit milestones.</p>
            )}
          </ProfileCard>
        </aside>

        <div className="profile-page__main">
          <ProfileCard className="profile-hero-stats">
            <div className="profile-hero-stats__gauge-wrap">
              <div className="profile-hero-stats__gauge-box">
                <ProfileValueGauge
                  value={heroValue}
                  caption={heroCaption}
                  fillPercent={heroFill}
                  tone="accent"
                  fill
                />
              </div>
            </div>

            <div className="profile-hero-stats__grid">
              {league.x01Performance ? (
                <>
                  <MiniStatCard
                    label="Checkout %"
                    value={`${league.x01Performance.checkoutPercent}%`}
                    icon="target"
                  />
                  <MiniStatCard
                    label="Highest Checkout"
                    value={String(league.x01Performance.highestCheckout)}
                    icon="trophy"
                  />
                  <MiniStatCard
                    label="180s"
                    value={String(league.x01Performance.oneEighties)}
                    icon="one-eighty"
                  />
                  <MiniStatCard
                    label="Streak"
                    value={league.seasonStats.currentStreakLabel}
                    icon="cricket"
                  />
                </>
              ) : league.cricketPerformance ? (
                <>
                  <MiniStatCard
                    label="MPR"
                    value={league.cricketPerformance.mpr.toFixed(2)}
                    icon="cricket"
                  />
                  <MiniStatCard
                    label="Marks"
                    value={String(league.cricketPerformance.marks)}
                    icon="target"
                  />
                  <MiniStatCard
                    label="Games Won"
                    value={String(league.cricketPerformance.gamesWon)}
                    icon="trophy"
                  />
                  <MiniStatCard
                    label="Streak"
                    value={league.seasonStats.currentStreakLabel}
                    icon="one-eighty"
                  />
                </>
              ) : (
                <>
                  <MiniStatCard
                    label="Wins"
                    value={String(league.seasonStats.wins)}
                    icon="trophy"
                  />
                  <MiniStatCard
                    label="Losses"
                    value={String(league.seasonStats.losses)}
                    icon="target"
                  />
                  <MiniStatCard
                    label="Win %"
                    value={winRateLabel}
                    icon="cricket"
                  />
                  <MiniStatCard
                    label="Streak"
                    value={league.seasonStats.currentStreakLabel}
                    icon="one-eighty"
                  />
                </>
              )}
            </div>
          </ProfileCard>

          <div className="profile-page__insights">
            <ProfileCard className="league-member-card__insight league-member-card__insight--league-info">
              <h3 className="profile-panel-title">League Information</h3>
              <div className="league-member-card__meta-list">
                <MetaRow label="Season" value={league.seasonName} />
                <MetaRow label="Current League" value={league.leagueName} />
                <MetaRow label="Leagues" value={card.leagues.length} />
                <MetaRow label="Team" value={league.teamName} />
                <MetaRow label="Role" value={league.role} />
                <MetaRow label="Joined" value={league.joinedLeagueLabel} />
                <MetaRow label="Seasons Played" value={league.seasonsPlayed} />
              </div>
            </ProfileCard>

            <ProfileCard className="league-member-card__insight">
              <h3 className="profile-panel-title">
                {league.teamContribution ? "Team Contribution" : "Season Record"}
              </h3>
              {league.teamContribution ? (
                <div className="league-member-card__meta-list">
                  <MetaRow label="Team" value={league.teamContribution.teamName} />
                  <MetaRow
                    label="Points Earned"
                    value={league.teamContribution.pointsEarned}
                  />
                  <MetaRow
                    label="Match Wins"
                    value={league.teamContribution.matchWins}
                  />
                  <MetaRow
                    label="Singles"
                    value={league.teamContribution.singlesRecord}
                  />
                  <MetaRow
                    label="Doubles"
                    value={league.teamContribution.doublesRecord}
                  />
                </div>
              ) : (
                <div className="league-member-card__meta-list">
                  <MetaRow
                    label="Matches Played"
                    value={league.seasonStats.matchesPlayed}
                  />
                  <MetaRow label="Wins" value={league.seasonStats.wins} />
                  <MetaRow label="Losses" value={league.seasonStats.losses} />
                  <MetaRow label="Win %" value={winRateLabel} />
                  <MetaRow
                    label="Current Streak"
                    value={league.seasonStats.currentStreakLabel}
                  />
                </div>
              )}
            </ProfileCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeagueMemberProfileCardScreen({
  playerId,
}: {
  playerId: string;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { loading: accessLoading, allowed: canManageLeagues } =
    useLeagueManagementAccess();
  const { card, loading: cardLoading, error } = useLeagueMemberCard(playerId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(
        `${LOGIN_PATH}?next=${encodeURIComponent(
          `${LEAGUE_PLAYER_CARD_PATH}/${encodeURIComponent(playerId)}`,
        )}`,
      );
    }
  }, [authLoading, playerId, router, user]);

  useEffect(() => {
    if (!authLoading && !accessLoading && user && !canManageLeagues) {
      router.replace(LEAGUE_PLAY_PATH);
    }
  }, [accessLoading, authLoading, canManageLeagues, router, user]);

  useEffect(() => {
    if (card) {
      recordRecentLeaguePlayerCard(card.id);
    }
  }, [card]);

  const showLoading =
    authLoading ||
    accessLoading ||
    cardLoading ||
    !user ||
    !canManageLeagues;

  if (showLoading) {
    return (
      <MobileAppShell
        title="Player Card"
        className="profile-page shell-page league-member-card-page"
      >
        <div className="league-member-card-page__wrap">
          <ProfileCard>
            <p className="profile-sidebar__empty">Loading player card…</p>
          </ProfileCard>
        </div>
      </MobileAppShell>
    );
  }

  if (!card) {
    return (
      <MobileAppShell
        title="Player Card"
        className="profile-page shell-page league-member-card-page"
      >
        <div className="league-member-card-page__wrap">
          <div className="league-member-card__toolbar-slot">
            <ProfileCard className="league-member-card__toolbar">
              <Link
                href={LEAGUE_PLAYER_CARD_PATH}
                className="league-member-card__back"
              >
                ← Back to Player Cards
              </Link>
            </ProfileCard>
          </div>
          <ProfileCard>
            <p className="profile-sidebar__empty">
              {error ?? "Player not found."}
            </p>
          </ProfileCard>
        </div>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell
      title={card.playerName}
      className="profile-page shell-page league-member-card-page"
    >
      <LeagueMemberProfileCardContent card={card} />
    </MobileAppShell>
  );
}
