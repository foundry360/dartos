#!/usr/bin/env node

/**
 * One-off: create a demo user + sample profile/stats for marketing screenshots.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-demo-user.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const EMAIL = "jeffreylucas904@gmail.com";
const DISPLAY_NAME = "Jeffrey Lucas";
const NICKNAME = null;
const PASSWORD =
  process.env.DEMO_USER_PASSWORD?.trim() ||
  `VectorDemo-${randomBytes(4).toString("hex")}!`;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function daysAgo(days, hour = 19) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 15, 0, 0);
  return date.toISOString();
}

function buildRecentVisits() {
  return [
    85, 100, 60, 140, 45, 81, 100, 60, 180, 95, 41, 100, 85, 57, 140, 100, 81, 45, 100, 60, 125,
    100, 85, 95, 140, 41, 100, 60, 81, 105,
  ];
}

function buildRecentLegs() {
  return [true, true, false, true, true, true, false, true, true, true, true, false];
}

function buildRecentCheckouts() {
  return [true, false, true, true, false, true, true, true, false, true];
}

async function findOrCreateUser() {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  const existing = listed.users.find(
    (user) => user.email?.toLowerCase() === EMAIL.toLowerCase(),
  );

  if (existing) {
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        display_name: DISPLAY_NAME,
      },
    });

    if (updateError) {
      throw updateError;
    }

    return { user: existing, created: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: DISPLAY_NAME,
    },
  });

  if (error) {
    throw error;
  }

  return { user: data.user, created: true };
}

async function seedProfile(userId) {
  const { error } = await admin
    .from("profiles")
    .update({
      display_name: DISPLAY_NAME,
      nickname: NICKNAME,
      preferred_board_theme_id: "dartos",
      throwing_hand: "right",
      skill_level: "advanced",
      preferred_game: "501",
      home_league: "Jacksonville Darts League",
      favorite_double: "D16",
      favorite_practice: "treble-20-only-30",
      default_match: "501-double-out",
      haptics_enabled: true,
      sound_enabled: true,
      voice_announcements_enabled: true,
      confirm_finish_turn: true,
      deactivated_at: null,
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

async function seedStats(userId) {
  const visits = 1284;
  const totalScore = 83460; // ~65.0 three-dart average
  const firstNineVisits = 240;
  const firstNineScore = 17280; // ~72.0 first-nine average

  const { error } = await admin.from("player_stats").upsert(
    {
      user_id: userId,
      darts_thrown: visits * 3,
      total_score: totalScore,
      visits,
      highest_visit: 180,
      visits100_plus: 312,
      visits140_plus: 96,
      visits_180_plus: 18,
      highest_checkout: 141,
      first_nine_score: firstNineScore,
      first_nine_visits: firstNineVisits,
      singles_hit: 2100,
      doubles_hit: 420,
      triples_hit: 680,
      bull_hit: 145,
      checkout_attempts: 310,
      checkout_successes: 128,
      matches_played: 86,
      matches_won: 54,
      legs_played: 248,
      legs_won: 152,
      breaks_of_throw: 41,
      recent_visit_scores: buildRecentVisits(),
      recent_leg_results: buildRecentLegs(),
      recent_checkout_results: buildRecentCheckouts(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}

async function seedPlayers(userId) {
  await admin.from("player_match_history").delete().eq("owner_id", userId);
  await admin.from("player_head_to_head").delete().eq("owner_id", userId);
  await admin.from("players").delete().eq("owner_id", userId);

  const opponents = [
    { name: "Marcus Hale", nickname: "Hawk", color: "#6F9E24" },
    { name: "Sarah Nguyen", nickname: "SG", color: "#38BDF8" },
    { name: "Chris Ortega", nickname: "CO", color: "#F59E0B" },
    { name: "Dana Brooks", nickname: "DB", color: "#A855F7" },
  ];

  const { data: players, error } = await admin
    .from("players")
    .insert(
      opponents.map((opponent) => ({
        owner_id: userId,
        name: opponent.name,
        nickname: opponent.nickname,
        color: opponent.color,
      })),
    )
    .select("id, name");

  if (error) {
    throw error;
  }

  return players;
}

async function seedMatchHistory(userId, players) {
  const byName = Object.fromEntries(players.map((player) => [player.name, player.id]));

  const matches = [
    {
      opponent_name: "Marcus Hale",
      opponent_id: byName["Marcus Hale"],
      user_won: true,
      match_type: "501 · Best of 5",
      user_legs: 3,
      opponent_legs: 1,
      played_at: daysAgo(1, 20),
    },
    {
      opponent_name: "Sarah Nguyen",
      opponent_id: byName["Sarah Nguyen"],
      user_won: true,
      match_type: "Cricket",
      user_legs: 1,
      opponent_legs: 0,
      played_at: daysAgo(2, 18),
    },
    {
      opponent_name: "Chris Ortega",
      opponent_id: byName["Chris Ortega"],
      user_won: false,
      match_type: "501 · Best of 5",
      user_legs: 2,
      opponent_legs: 3,
      played_at: daysAgo(3, 21),
    },
    {
      opponent_name: "Dana Brooks",
      opponent_id: byName["Dana Brooks"],
      user_won: true,
      match_type: "301 · Best of 3",
      user_legs: 2,
      opponent_legs: 0,
      played_at: daysAgo(4, 19),
    },
    {
      opponent_name: "Marcus Hale",
      opponent_id: byName["Marcus Hale"],
      user_won: true,
      match_type: "501 · Best of 5",
      user_legs: 3,
      opponent_legs: 2,
      played_at: daysAgo(5, 17),
    },
    {
      opponent_name: "Sarah Nguyen",
      opponent_id: byName["Sarah Nguyen"],
      user_won: true,
      match_type: "501 · Best of 3",
      user_legs: 2,
      opponent_legs: 1,
      played_at: daysAgo(7, 20),
    },
    {
      opponent_name: "Chris Ortega",
      opponent_id: byName["Chris Ortega"],
      user_won: true,
      match_type: "Cricket",
      user_legs: 1,
      opponent_legs: 0,
      played_at: daysAgo(8, 16),
    },
    {
      opponent_name: "Dana Brooks",
      opponent_id: byName["Dana Brooks"],
      user_won: false,
      match_type: "501 · Best of 5",
      user_legs: 1,
      opponent_legs: 3,
      played_at: daysAgo(10, 21),
    },
    {
      opponent_name: "Marcus Hale",
      opponent_id: byName["Marcus Hale"],
      user_won: true,
      match_type: "701 · Best of 3",
      user_legs: 2,
      opponent_legs: 1,
      played_at: daysAgo(12, 18),
    },
    {
      opponent_name: "Sarah Nguyen",
      opponent_id: byName["Sarah Nguyen"],
      user_won: true,
      match_type: "501 · Best of 5",
      user_legs: 3,
      opponent_legs: 0,
      played_at: daysAgo(14, 19),
    },
    {
      opponent_name: "Guest Player",
      opponent_id: null,
      user_won: true,
      match_type: "501 · Best of 3",
      user_legs: 2,
      opponent_legs: 1,
      played_at: daysAgo(15, 15),
    },
    {
      opponent_name: "Chris Ortega",
      opponent_id: byName["Chris Ortega"],
      user_won: true,
      match_type: "Cricket",
      user_legs: 1,
      opponent_legs: 0,
      played_at: daysAgo(18, 20),
    },
  ].map((match) => ({
    owner_id: userId,
    ...match,
  }));

  const { error } = await admin.from("player_match_history").insert(matches);
  if (error) {
    throw error;
  }

  const headToHead = [
    { opponent_id: byName["Marcus Hale"], user_wins: 8, opponent_wins: 3 },
    { opponent_id: byName["Sarah Nguyen"], user_wins: 6, opponent_wins: 4 },
    { opponent_id: byName["Chris Ortega"], user_wins: 5, opponent_wins: 5 },
    { opponent_id: byName["Dana Brooks"], user_wins: 7, opponent_wins: 2 },
  ].map((row) => ({
    owner_id: userId,
    ...row,
  }));

  const { error: h2hError } = await admin.from("player_head_to_head").upsert(headToHead);
  if (h2hError) {
    throw h2hError;
  }
}

async function seedPractice(userId) {
  await admin.from("practice_session_history").delete().eq("owner_id", userId);

  const sessions = [
    {
      owner_id: userId,
      drill_id: "treble-20-only-30",
      drill_title: "Treble 20 Only · 30 darts",
      started_at: daysAgo(2, 11),
      completed_at: daysAgo(2, 11),
      darts_thrown: 30,
      successes: 14,
      attempts: 30,
      duration_seconds: 240,
      config: { dartLimit: 30 },
      metadata: { treble20: { hits: 14, averageScorePerDart: 28.2 } },
    },
    {
      owner_id: userId,
      drill_id: "random-checkout-10",
      drill_title: "Random Checkout · 2–40 · 10 attempts",
      started_at: daysAgo(4, 12),
      completed_at: daysAgo(4, 12),
      darts_thrown: 26,
      successes: 7,
      attempts: 10,
      duration_seconds: 360,
      config: { range: "2-40", attempts: 10, outRule: "double_out" },
      metadata: { randomCheckout: { successes: 7, attemptsCompleted: 10 } },
    },
    {
      owner_id: userId,
      drill_id: "bull-count-30",
      drill_title: "Bull Count · 30 darts",
      started_at: daysAgo(6, 10),
      completed_at: daysAgo(6, 10),
      darts_thrown: 30,
      successes: 11,
      attempts: 30,
      duration_seconds: 210,
      config: { dartLimit: 30 },
      metadata: { bullCount: { bullsHit: 11 } },
    },
    {
      owner_id: userId,
      drill_id: "round-the-clock-singles",
      drill_title: "Round the Clock · Singles",
      started_at: daysAgo(9, 14),
      completed_at: daysAgo(9, 14),
      darts_thrown: 48,
      successes: 20,
      attempts: 20,
      duration_seconds: 420,
      config: { targetMode: "singles" },
      metadata: { roundTheClock: { targetsCompleted: 20, targetCount: 20, dartsThrown: 48 } },
    },
    {
      owner_id: userId,
      drill_id: "scoring-99-10",
      drill_title: "Scoring 99 · 10 visits",
      started_at: daysAgo(11, 16),
      completed_at: daysAgo(11, 16),
      darts_thrown: 30,
      successes: 8,
      attempts: 10,
      duration_seconds: 300,
      config: { visits: 10 },
      metadata: { scoring99: { successes: 8, visitsCompleted: 10 } },
    },
  ];

  const { error } = await admin.from("practice_session_history").insert(sessions);
  if (error) {
    throw error;
  }
}

async function seedSubscription(userId) {
  await admin.from("subscriptions").delete().eq("user_id", userId);

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error } = await admin.from("subscriptions").insert({
    user_id: userId,
    stripe_subscription_id: `sub_demo_${userId.replaceAll("-", "").slice(0, 14)}`,
    stripe_customer_id: `cus_demo_${userId.replaceAll("-", "").slice(0, 14)}`,
    stripe_price_id: "price_demo_elite",
    plan_name: "Elite",
    status: "active",
    amount_cents: 999,
    currency: "usd",
    interval: "month",
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
  });

  if (error) {
    throw error;
  }
}

async function seedActiveMatch(userId, players) {
  await admin.from("player_active_matches").delete().eq("owner_id", userId);

  const opponent = players.find((player) => player.name === "Marcus Hale") ?? players[0];
  if (!opponent) {
    throw new Error("No saved opponents available for active match seed");
  }

  const matchId = crypto.randomUUID();
  const accountProfileId = `account-${userId}`;
  const updatedAt = new Date().toISOString();

  const gameState = {
    gameType: 501,
    players: [
      {
        id: "player-0",
        name: DISPLAY_NAME,
        nickname: NICKNAME,
        color: "#6F9E24",
        remaining: 221,
        legsWon: 1,
        setsWon: 0,
        visitScores: [100, 85, 95],
        checkoutAttempts: 0,
        checkoutSuccesses: 0,
        scoredIn: true,
        profileId: accountProfileId,
        isGuest: false,
        playerKind: "human",
      },
      {
        id: "player-1",
        name: opponent.name,
        nickname: null,
        color: "#38BDF8",
        remaining: 301,
        legsWon: 0,
        setsWon: 0,
        visitScores: [60, 81, 45],
        checkoutAttempts: 0,
        checkoutSuccesses: 0,
        scoredIn: true,
        profileId: opponent.id,
        isGuest: false,
        playerKind: "human",
      },
    ],
    currentPlayerIndex: 0,
    visitDarts: [
      { segment: 20, multiplier: "triple", score: 60, label: "T20" },
      { segment: 19, multiplier: "single", score: 19, label: "19" },
    ],
    visitStartRemaining: 221,
    visitStartScoredIn: true,
    legsToWin: 3,
    setsToWin: 1,
    teamsEnabled: false,
    startingPlayerRule: "winner_previous_leg",
    inRule: "straight_in",
    outRule: "double_out",
    legsPlayed: 1,
    history: [],
    status: "playing",
    matchId,
    isBotMatch: false,
  };

  const { error } = await admin.from("player_active_matches").insert({
    id: matchId,
    owner_id: userId,
    game_mode: "x01",
    resume_href: `/x01/501/play?matchId=${encodeURIComponent(matchId)}`,
    match_type: "501",
    opponent_id: opponent.id,
    opponent_name: opponent.name,
    progress: "Set 1 · Leg 2",
    game_state: {
      version: 1,
      gameState,
    },
    updated_at: updatedAt,
  });

  if (error) {
    throw error;
  }
}

async function main() {
  const { user, created } = await findOrCreateUser();

  if (!user?.id) {
    throw new Error("Failed to resolve user");
  }

  await seedProfile(user.id);
  await seedStats(user.id);
  const players = await seedPlayers(user.id);
  await seedMatchHistory(user.id, players);
  await seedPractice(user.id);
  await seedSubscription(user.id);
  await seedActiveMatch(user.id, players);

  console.log(created ? "Created demo user" : "Updated existing demo user");
  console.log("Email:", EMAIL);
  console.log("Password:", PASSWORD);
  console.log("User ID:", user.id);
  console.log("Display name:", DISPLAY_NAME);
  console.log(
    "Seeded: profile, stats (~65 avg), players, matches, practice, Elite subscription, active 501 match",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
